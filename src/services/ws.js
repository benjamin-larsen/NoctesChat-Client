import { ref, watch } from "noctes.jsx";

import { auth, unsetAuth } from "./auth.js"
import { channels, channelMessages, channelStatuses, sortMessages } from "./channels.js";

const WS_URL = import.meta.env.DEV ? "ws://localhost:5117/ws" : "/ws"

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

    this.openHook = () => this.onOpen();
    this.closeHook = () => this.onClose();
    this.messageHook = (msg) => this.onMessage(msg);
  }

  onOpen() {
    console.log("WebSocket Open")

    this.socket.send(JSON.stringify({
      type: "login",
      data: {
        token: auth.value
      }
    }))
  }

  onClose() {
    this.socket = null;

    if (!auth.value) {
      connState.value = WS_STATES.inactive;
      return;
    }

    connState.value = WS_STATES.loading;

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
        case "update_channel":
        case "push_channel": {
          channels.set(json.channel.id, json.channel);
          break;
        }

        case "delete_channel": {
          channels.delete(json.channel);
          channelMessages.delete(json.channel);
          channelStatuses.delete(json.channel);
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
    if (!this.socket) return;
    this.socket.removeEventListener("open", this.openHook);
    this.socket.removeEventListener("close", this.closeHook);
    this.socket.removeEventListener("message", this.messageHook);

    this.socket.close();
    this.socket = null;
  }

  attemptConnection() {
    if (!auth.value) return;

    this.abort();

    connState.value = WS_STATES.loading;

    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", this.openHook);
    this.socket.addEventListener("close", this.closeHook);
    this.socket.addEventListener("message", this.messageHook);
  }
}

const wsState = new WebSocketManager(WS_URL);

watch(auth, (next) => {
  wsState.abort();

  if (next) {
    wsState.attemptConnection();
  }
}, { immediate: true, global: true })