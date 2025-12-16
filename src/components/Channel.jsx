import { authUser } from "../services/auth.js";
import { ensureChannelLoaded, channels, channelMessages, retryLoadChannel, evalTyping } from "../services/channels.js";
import { sendMessage } from "../services/messages.js";
import InputBox from "./InputBox.jsx";
import MessageContainer from "./MessageContainer.jsx";
import { setOverlay } from "../services/overlays.js";
import MembersOverlay from "../overlays/MembersOverlay.jsx";

export default {
  render(ctx) {
    const channelId = ctx.$router.params.value.id;

    const status = ensureChannelLoaded(channelId);

    if (status.state === "loading" || status.state === "unsynced") {
      return <>
        <div class="page-center">
          <span class="loader"></span>
        </div>
      </>
    } else if (status.state === "failed") {
      return <>
        <div class="page-center">
          <h2 style="margin-bottom: 0; font-weight: 600;">A error occured while attempting to load channel</h2>
          <h3 style="margin-top: 0; font-weight: 500;">${status.error}</h3>
          <button className="btn-primary" onClick={() => retryLoadChannel(ctx.$router.params.value.id)}>Try Again</button>
        </div>
      </>
    }

    const channel = channels.get(channelId);
    const msgObj = channelMessages.get(channelId) || { messages: [], has_more: false, isLoading: false };
    const isOwner = channel.owner.id === authUser.value.id;

    return <>
      <div class="channelContainer">
        <div class="channelInfo">
          <span class="name">${channel.name}</span>
          { isOwner ?
          <button class="optionBtn">
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e8eaed"><path d="M680-280q25 0 42.5-17.5T740-340q0-25-17.5-42.5T680-400q-25 0-42.5 17.5T620-340q0 25 17.5 42.5T680-280Zm0 120q31 0 57-14.5t42-38.5q-22-13-47-20t-52-7q-27 0-52 7t-47 20q16 24 42 38.5t57 14.5ZM480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v227q-19-8-39-14.5t-41-9.5v-147l-240-90-240 90v188q0 47 12.5 94t35 89.5Q310-290 342-254t71 60q11 32 29 61t41 52q-1 0-1.5.5t-1.5.5Zm200 0q-83 0-141.5-58.5T480-280q0-83 58.5-141.5T680-480q83 0 141.5 58.5T880-280q0 83-58.5 141.5T680-80ZM480-494Z"/></svg>
          </button> : null }
          <button class="optionBtn" onClick={() => setOverlay({
            comp: MembersOverlay,
            props: { channelId }
          })}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e8eaed"><path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z"/></svg>
          </button>
          <button class="optionBtn" disabled={isOwner}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e8eaed"><path d="M200-120q-33 0-56.5-23.5T120-200v-160h80v160h560v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm220-160-56-58 102-102H120v-80h346L364-622l56-58 200 200-200 200Z"/></svg>
          </button>
        </div>
        <MessageContainer messageInfo={msgObj} status={status} channel={channelId} />
        <div class="messageBox">
          <div style="font-size: 12px; padding: 4px 0; line-height: 1" class="ellipsis-anim">{
            status.typing.size > 0 ? <>
              Someone is typing 
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </> : null
          }</div>
          <InputBox onInput={(next) => {evalTyping(channelId, next)}} onEnter={(msg) => {sendMessage(channelId, msg)}} nModel={status.msgBox} label="Message" />
        </div>
      </div>
    </>
  }
}