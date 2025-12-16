import { ref, nextTick } from "noctes.jsx";
import { loadMore } from "../services/channels.js";
import Avatar from "./Avatar.jsx";
import Time from "./Time.jsx";
import { isToday } from "./Time.jsx";

// The maximum time that two messages can be apart before they are no longer grouped together.
const TIME_WINDOW = 10 * 60 * 1000;

async function updateScroll(ctx, skipTick = false) {
  if (!skipTick) await nextTick();

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

    ctx.updateScroll = updateScroll.bind(null, ctx, true);
  },

  onMounted(ctx) {
    updateScroll(ctx, false);

    window.addEventListener("resize", ctx.updateScroll);
  },

  onUpdated(ctx) {
    updateScroll(ctx, false);
  },

  onDestroy(ctx) {
    window.removeEventListener("resize", ctx.updateScroll);
  },
  
  render(ctx, props) {
    const { messageInfo } = props;

    let lastMsg = null;
    let lastTimestamp = null;
    let lastDate = null;

    return <>
    <div class="messageScroller" ref={ctx.el} onScroll={() => {
          const el = ctx.el.value;
          if (!el) return;

          if (el.scrollTop === 0) {
            loadMore(ctx.props.channel);
          }

          if (Math.ceil(el.scrollTop) >= (el.scrollHeight - el.clientHeight)) {
            ctx.props.status.scroll = null
          } else {
            ctx.lastHeight = el.scrollHeight;
            ctx.props.status.scroll = el.scrollTop
          }
        }}>
      <div class="messageContainer">
        <div class="messageList">
          {
            messageInfo.isLoading ? <div key="topMsg" class="topMessage"><span class="loader"></span></div> : !messageInfo.has_more ? <div key="topMsg" class="topMessage">You've reached the start of this channel.</div> : null
          }
          {
            messageInfo.messages.map(msg =>
            {
              try {
                const date = new Date(msg.timestamp);

                if (
                  // Verify Author
                  lastMsg && lastMsg.author && msg.author && msg.author.id === lastMsg.author.id &&
                  // Verify Time Window
                  lastDate && (msg.timestamp - lastMsg.timestamp) < TIME_WINDOW && isToday(date, lastDate) && lastDate
                ) {
                  return <div key={msg.id} class="message leadingMessage">
                    <span style="width: 40px; flex-shrink: 0; display: inline-block; position: relative;">
                      <Time time={msg.timestamp} />
                    </span>
                    <div class="messageInfo">
                      <p>${msg.content}</p>
                    </div>
                  </div>
                }

                lastDate = date;

                return <div key={msg.id} class="message">
                  <Avatar username={msg.author ? msg.author.username : "D"} status="#4CD964" />
                  <div class="messageInfo">
                    <span>
                      <span class="authorName">${msg.author ? msg.author.username : "Deleted User"}</span>
                      <Time style="margin-left: 6px;" expanded={true} time={msg.timestamp} />
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
      </div>
    </div>
    </>
  }
}