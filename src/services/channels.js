import { reactive } from "noctes.jsx";
import { request } from "./http.js";

// just use channels from auth

// null = loading, doesnt exist = not loaded, object = loaded
export const channels = reactive(new Map());
export const channelMessages = reactive(new Map());
export const channelStatuses = reactive(new Map());

window.channels = channels;

class LoadError extends Error {
  constructor(message) {
    super(message)
  }
}

async function loadChannel(channelId, status) {
  try {
    let resp = await request({
      url: `/channels/${channelId}`,
      includeAuth: true
    })

    if (resp.status === 404) throw new LoadError("Unknown Channel");
    if (resp.status !== 200) throw new LoadError("Unable to fetch channel");

    const channel = resp.body;

    resp = await request({
      url: `/channels/${channelId}/messages`,
      includeAuth: true
    })

    if (resp.status !== 200) throw new LoadError(resp.body.error || "Unable to fetch messages");

    const messages = resp.body;

    status.state = "loaded";
    channels.set(channelId, channel);
    channelMessages.set(channelId, messages);
  } catch(e) {
    console.log("Error occured while loading channel.", e);

    status.state = "failed";
    status.error = e instanceof LoadError ? `Error: ${e.message}` : "Unknown Error";
  }
}

export function retryLoadChannel(channelId) {
  let status = channelStatuses.get(channelId);
  if (!status) return false;

  status.state = "loading";
  status.error = undefined;

  loadChannel(channelId, status);
}

export function ensureChannelLoaded(channelId) {
  let status = channelStatuses.get(channelId);
  if (status) return status;

  status = reactive({
    state: "loading"
  });

  channelStatuses.set(channelId, status);

  loadChannel(channelId, status);

  return status;
}