import { reactive, ref, watch } from "noctes.jsx";

import { auth, unsetAuth, authUser } from "./auth.js"
import { channels, channelMessages, channelStatuses, sortMessages, syncChannel, deleteChannel } from "./channels.js";

const WS_URL = import.meta.env.DEV ? "ws://localhost:5117/ws" : "/ws"

export const presences = reactive(new Map());

export function isOnline(userId) {
  if (userId === authUser.value.id) return true;

  return presences.get(userId) === "online";
}

export const WS_STATES = {
  inactive: 0,
  loading: 1,
  active: 2
}

export const connState = ref(WS_STATES.inactive);

class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.authUser = null;
    this.currentHeartbeat = null;

    this.openHook = () => this.onOpen();
    this.closeHook = () => this.onClose();
    this.messageHook = (msg) => this.onMessage(msg);
  }

  onOpen() {
    console.log("WebSocket Open")

    this.authUser = authUser.value;
    this.socket.send(JSON.stringify({
      type: "login",
      data: {
        token: auth.value
      }
    }))
  }

  onClose() {
    this.socket = null;
    this.authUser = null;

    if (this.currentHeartbeat) {
      clearInterval(this.currentHeartbeat);
      this.currentHeartbeat = null;
    }

    if (!authUser.value) {
      connState.value = WS_STATES.inactive;
      return;
    }

    connState.value = WS_STATES.loading;

    for (const [_, status] of channelStatuses) {
      if (status.state !== "loaded") continue;
      status.state = "unsynced";
    }

    console.log("WebSocket disconnected")
  
    setTimeout(() => this.attemptConnection(), 5000);
  }

  onMessage(msg) {
    const json = JSON.parse(msg.data);

    if (connState.value == WS_STATES.loading) {
      switch (json.type) {
        case "auth_ack": {
          connState.value = WS_STATES.active;
          console.log("WebSocket Authenticated")

          let channelIds = new Set();

          for (const channel of json.channels) {
            const members = new Map();

            for (const member of channel.members) {
              members.set(member.id, member);
            }

            channels.set(channel.id, {...channel, members})
            channelIds.add(channel.id);
          }

          // Cleanup deleted channels
          for (const [channelId, _] of channels) {
            if (channelIds.has(channelId)) continue;
            deleteChannel(channelId);
          }

          for (const [channelId, status] of channelStatuses) {
            if (status.state !== "unsynced") continue;
            syncChannel(channelId);
          }

          this.currentHeartbeat = setInterval(() => {
            this.socket.send(JSON.stringify({
              type: "heartbeat",
              data: {}
            }))
          }, 30000);
          break;
        }

        case "auth_error": {
          unsetAuth();

          console.log("Auth Error", json)
          break;
        }
      }
    } else if (connState.value == WS_STATES.active) {
      switch (json.type) {
        case "push_presence": {
          presences.set(json.user, json.status);
          break;
        }

        case "start_typing": {
          if (json.member == this.authUser.id) return;
          
          const channelState = channelStatuses.get(json.channel);
          if (!channelState || !channelState.typing) return;

          channelState.typing.set(json.member, Date.now());
          break;
        }

        case "stop_typing": {
          if (json.member == this.authUser.id) return;

          const channelState = channelStatuses.get(json.channel);
          if (!channelState || !channelState.typing) return;

          channelState.typing.delete(json.member);
          break;
        }

        case "update_channel": {
          const prevChannel = channels.get(json.channel.id);
          if (!prevChannel) return;

          channels.set(json.channel.id, {...json.channel, members: prevChannel.members});
          break;
        }

        case "push_channel": {
          const members = new Map();

          for (const member of json.members) {
            members.set(member.id, member);
          }
          
          console.log({json, members})
          channels.set(json.channel.id, {...json.channel, members});
          break;
        }

        case "push_channel_member": {
          // cache member here
          const channel = channels.get(json.channel);
          if (!channel) return;

          channel.members
          break;
        }

        case "delete_channel": {
          deleteChannel(json.channel);
          break;
        }

        case "push_message": {
          const msgObj = channelMessages.get(json.channel);
          if (!msgObj) return;

          const { messages } = msgObj;

          messages.push(json.message);

          const sorted = sortMessages(messages);

          msgObj.messages = sorted.messages;
          msgObj.addedTop = sorted.addedTop;

          break;
        }
      }
    }
  }

  abort() {
    if (this.currentHeartbeat) {
      clearInterval(this.currentHeartbeat);
      this.currentHeartbeat = null;
    }

    if (!this.socket) return;
    this.socket.removeEventListener("open", this.openHook);
    this.socket.removeEventListener("close", this.closeHook);
    this.socket.removeEventListener("message", this.messageHook);

    this.socket.close();
    this.socket = null;
  }

  attemptConnection() {
    if (!authUser.value) return;

    this.abort();

    connState.value = WS_STATES.loading;

    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", this.openHook);
    this.socket.addEventListener("close", this.closeHook);
    this.socket.addEventListener("message", this.messageHook);
  }
}

let wsState;

export function sendWSMessage(message) {
  try {
    if (!wsState.socket) return;
    if (connState.value !== WS_STATES.active) return;

    wsState.socket.send(JSON.stringify(message))
  } catch {}
}

export default function setup() {
  wsState = new WebSocketManager(WS_URL);

  watch(authUser, (next) => {
    wsState.abort();

    if (next) {
      wsState.attemptConnection();
    }
  }, { immediate: true, global: true })
}