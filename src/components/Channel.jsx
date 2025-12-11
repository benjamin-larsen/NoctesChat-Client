import { ensureChannelLoaded, channels, channelMessages, retryLoadChannel, sendMessage, evalTyping } from "../services/channels";
import InputBox from "./InputBox.jsx";
import MessageContainer from "./MessageContainer.jsx";

export default {
  render(ctx) {
    const channelId = ctx.$router.params.value.id;

    const status = ensureChannelLoaded(channelId);

    if (status.state === "loading") {
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
    return <>
      <div class="channelContainer">
        <div class="channelInfo">
          <span class="name">${channel.name}</span>
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
          <InputBox onInput={() => {evalTyping(channelId)}} onEnter={() => {sendMessage(channelId)}} nModel={status.msgBox} label="Message" />
        </div>
      </div>
    </>
  }
}