import { ensureChannelLoaded, channels, channelMessages, retryLoadChannel } from "../services/channels";

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
    const messages = channelMessages.get(channelId) || { messages: [], has_more: false };
  
    return <>${JSON.stringify(channel, null, "\t")}${JSON.stringify(messages, null, "\t")}</>
  }
}