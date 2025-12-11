import { auth } from "./auth.js"

const API_URL = import.meta.env.DEV ? "http://localhost:5117/api" : "/api"

export async function request({
  url = "",
  body: reqBody = null,
  method = "GET",
  includeAuth = false
}) {
  try {
    if (includeAuth && !auth.value) return {
      body: { error: "You need to be logged in." },
      status: 401
    };

    const headers = {};

    if (reqBody) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      headers['Authorization'] = auth.value;
    }

    const req = new Request(
      `${API_URL}${url}`,
      {
        body: reqBody ? JSON.stringify(reqBody) : null,
        headers,
        method
      }
    )

    const resp = await fetch(`${API_URL}${url}`, {
        body: reqBody ? JSON.stringify(reqBody) : null,
        headers,
        method
      });
    const respBody = await resp.json();

    return {
      body: respBody,
      status: resp.status
    }
  } catch(e) {
    console.log("Error occured attempting request", e);
  
    return {
      body: { error: "Unknown Error" },
      status: 500
    }
  }
}

export async function getUserByUsername(username) {
  const resp = await request({
    url: `/usernames/${username}`
  })

  if (resp.status !== 200) return {
    user: null,
    error: typeof resp.body.error === "string" ? resp.body.error : "Unknown Error"
  };

  return {
    user: resp.body,
    error: null
  };
}