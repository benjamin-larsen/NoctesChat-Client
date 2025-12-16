import { shallowRef, globalProperties } from 'noctes.jsx'
import { request } from './http.js';
import { sleep } from './utils.js';
import { channels, channelMessages, channelStatuses } from './channels.js';
import SetupWS from './ws.js'

export const auth = shallowRef(
  localStorage.getItem("auth-token") || null
);

export const authUser = shallowRef(null);
export const authError = shallowRef(null);

let isLoadingUser = false;

export function setAuth(token) {
  localStorage.setItem("auth-token", token);
  auth.value = token;

  authUser.value = null;
  authError.value = null;
  isLoadingUser = false;

  globalProperties.$router.navigate("/");
}

export function unsetAuth() {
  localStorage.removeItem("auth-token");
  auth.value = null;
  channels.clear();
  channelMessages.clear();
  channelStatuses.clear();

  globalProperties.$router.navigate("/login");
}

class AuthError extends Error {
  constructor(message) {
    super(message)
  }
}

export async function ensureLoadUser() {
  if (!auth.value) return;
  if (isLoadingUser) return;

  while (!authUser.value) {
    try {
      isLoadingUser = true;

      let resp = await request({
        url: "/users/@me",
        includeAuth: true
      });

      if (resp.status == 401) return unsetAuth();
      if (resp.status != 200) throw new AuthError("Unable to fetch user.");

      const user = resp.body;

      authUser.value = user;
    } catch(e) {
      console.log("Error while trying to setup authentication.", e);

      if (e instanceof AuthError) {
        authError.value = "Authentication Error: " + e.message
      } else {
        authError.value = "An error occured."
      }
    }

    if (!authUser.value) await sleep(5000);
  }
}

SetupWS();