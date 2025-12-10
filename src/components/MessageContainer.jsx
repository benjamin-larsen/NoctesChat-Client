import { ref, nextTick } from "noctes.jsx";
import { loadMore } from "../services/channels.js";
import Avatar from "./Avatar.jsx";

async function updateScroll(ctx) {
  await nextTick();

  const { channel, status: { scroll }, messageInfo: { addedTop } } = ctx.props;

  if (ctx.lastChannelId != channel) ctx.lastHeight = null;
  ctx.lastChannelId = channel;

  const el = ctx.el.value;
  if (!el) return;

  el.scrollTop = scroll === null ?
    el.scrollHeight - el.clientHeight :
      (ctx.lastHeight !== null && addedTop) ?
      el.scrollHeight - ctx.lastHeight + scroll :
  scroll;

  if (scroll !== null) {
    ctx.lastHeight = el.scrollHeight;
    ctx.props.status.scroll = el.scrollTop;
  }
}

export default {
  onCreated(ctx) {
    ctx.el = ref(null);
    ctx.lastHeight = null;
    ctx.lastChannelId = null;
  },

  onMounted: updateScroll,
  onUpdated: updateScroll,
  
  render(ctx, props) {
    const { messageInfo } = props;

    let lastMsg = null;
    let seqCounter = 0;

    return <>
      <div class="messagesContainer" ref={ctx.el} onScroll={() => {
        const el = ctx.el.value;
        if (!el) return;

        if (el.scrollTop === 0) {
          loadMore(ctx.props.channel);
        }

        if (el.scrollTop >= (el.scrollHeight - el.clientHeight)) {
          ctx.props.status.scroll = null
        } else {
          ctx.lastHeight = el.scrollHeight;
          ctx.props.status.scroll = el.scrollTop
        }
      }}>
        {
          messageInfo.isLoading ? <div key="topMsg" class="topMessage"><span class="loader"></span></div> : !messageInfo.has_more ? <div key="topMsg" class="topMessage">You've reached the start of this channel.</div> : null
        }
        {
          messageInfo.messages.map(msg =>
          {
            try {
              if (seqCounter >= 5) {
                seqCounter = 1;
                lastMsg = null;
              }

              if (lastMsg && lastMsg.author && msg.author && msg.author.id === lastMsg.author.id) {
                seqCounter++;

                return <div key={msg.id} class="message leadingMessage">
                  <span style="width: 40px;"></span>
                  <div class="messageInfo">
                    <p style="font-size: 16px; margin: 0; white-space: break-spaces; word-wrap: anywhere;">${msg.content}</p>
                  </div>
                </div>
              } else {
                seqCounter = 1;
              }

              return <div key={msg.id} class="message">
                <Avatar username={msg.author ? msg.author.username : "D"} status="#4CD964" />
                <div class="messageInfo">
                  <span>
                    ${msg.author ? msg.author.username : "Deleted User"}
                  </span>
                  <p>${msg.content.trim()}</p>
                </div>
              </div>
            } finally {
              lastMsg = msg;
            }
          })
        }
      </div>
    </>
  }
}