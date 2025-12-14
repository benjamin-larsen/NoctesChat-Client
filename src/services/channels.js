import { reactive, shallowReactive, shallowRef } from "noctes.jsx";
import { request } from "./http.js";
import { sendWSMessage } from "./ws.js";

// just use channels from auth
// dont load channels,

// null = loading, doesnt exist = not loaded, object = loaded
export const channels = reactive(new Map());
export const channelMessages = reactive(new Map());
export const channelStatuses = reactive(new Map());

export function sortMessages(messages) {
  let dedupe = new Set();

  const oldTop = messages[0];

  const newArr = messages.filter(m => {
    if (m === null || typeof m !== "object") return false;
    if (dedupe.has(m.id)) return false;
    dedupe.add(m.id);

    return true;
  }).sort((a, b) => {
    const aInt = BigInt(a.id);
    const bInt = BigInt(b.id);

    if (aInt > bInt) return 1;
    if (aInt < bInt) return -1;

    return 0;
  });
  
  const newTop = newArr[0];

  return {
    messages: newArr,
    addedTop: newTop !== oldTop
  }
}

window.channels = channels;

class LoadError extends Error {
  constructor(message) {
    super(message)
  }
}

async function getOrFetchChannel(channelId) {
  const existing = channels.get(channelId);
  if (existing) return existing;

  const resp = await request({
    url: `/channels/${channelId}`,
    includeAuth: true
  })

  if (resp.status === 404) throw new LoadError("Unknown Channel");
  if (resp.status !== 200) throw new LoadError("Unable to fetch channel");

  channels.set(channelId, resp.body);

  return resp.body;
}

async function loadChannel(channelId, status) {
  try {
    await getOrFetchChannel(channelId);

    const resp = await request({
      url: `/channels/${channelId}/messages`,
      includeAuth: true
    })

    if (resp.status !== 200) throw new LoadError(resp.body.error || "Unable to fetch messages");

    const { messages, has_more } = resp.body;

    status.state = "loaded";
    status.msgBox = shallowRef(null);
    status.typing = shallowReactive(new Map());
    status.typingSince = null;
    status.scroll = null;
    channelMessages.set(channelId, shallowReactive({
      messages: sortMessages(messages).messages,
      has_more: !!has_more,
      isLoading: false,
      addedTop: false
    }));
  } catch(e) {
    console.log("Error occured while loading channel.", e);

    status.state = "failed";
    status.error = e instanceof LoadError ? `Error: ${e.message}` : "Unknown Error";
    status.msgBox = undefined;
    status.typing = null;
    status.typingSince = null;
    status.scroll = null;
  }
}

export function evalTyping(channelId, nextText) {
  const status = channelStatuses.get(channelId);

  if (!status) return;
  if (!status.typing) return;

  const wasTyping = status.typingSince !== null;
  const shouldBeTyping = !!nextText.trim();

  if (shouldBeTyping !== wasTyping) {
    status.typingSince = shouldBeTyping ? Date.now() : null;

    sendWSMessage({
      type: shouldBeTyping ? "start_typing" : "stop_typing",
      data: {
        channel: channelId
      }
    });
  } else if (wasTyping) {
    status.typingSince = Date.now();
  }
}

setInterval(() => {
  const time = Date.now();

  for (const [channelId, status] of channelStatuses) {
    if (!status.typing || status.typingSince === null) continue;

    if ((time - status.typingSince) >= 5000) {
      status.typingSince = null;

      sendWSMessage({
        type: "stop_typing",
        data: {
          channel: channelId
        }
      });
    }
  }
}, 2500);

export function retryLoadChannel(channelId) {
  let status = channelStatuses.get(channelId);
  if (!status) return false;

  status.state = "loading";
  status.error = undefined;
  status.msgBox = undefined;
  status.typing = null;
  status.typingSince = null;
  status.scroll = null;

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

export async function loadMore(channelId) {
  let msgObj = channelMessages.get(channelId);
  if (!msgObj) return;
  if (msgObj.isLoading || !msgObj.has_more) return;

  const { messages } = msgObj;
  if (messages.length <= 0) return;

  const lastMessageId = messages[0].id;

  msgObj.isLoading = true;
  msgObj.addedTop = true;

  try {
    const resp = await request({
      url: `/channels/${channelId}/messages?after=${lastMessageId}`,
      includeAuth: true
    })

    if (resp.status !== 200) return;

    messages.push(...resp.body.messages);

    const sorted = sortMessages(messages);

    msgObj.messages = sorted.messages;
    msgObj.addedTop = sorted.addedTop;
    msgObj.has_more = !!resp.body.has_more;
  } finally {
    msgObj.isLoading = false;
  }
}

// Make this cancellable
export async function syncChannel(channelId) {
  let status = channelStatuses.get(channelId);
  if (!status) return false;

  let msgObj = channelMessages.get(channelId);
  if (!msgObj) return;

  let hasMore = true;
  let isAsc = true;

  while (hasMore) {
    const lastMessage = isAsc ? msgObj.messages[msgObj.messages.length - 1] : msgObj.messages[0];

    if (!lastMessage) isAsc = false;

    const resp = await request({
      url: `/channels/${channelId}/messages${lastMessage ? `?${isAsc ? "before" : "after"}=${lastMessage.id}` : ''}`,
      includeAuth: true
    })

    if (resp.status !== 200) {
      console.warn(`Failed to resync channel "${channelId}"`);
      break;
    }

    msgObj.messages.push(...resp.body.messages);

    const sorted = sortMessages(msgObj.messages);

    msgObj.messages = sorted.messages;
    msgObj.addedTop = sorted.addedTop;

    hasMore = resp.body.has_more;
  }

  if (status.state === "unsynced") {
    status.state = "loaded";
  }
}