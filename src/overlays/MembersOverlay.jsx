import { closeOverlay } from "../services/overlays.js";
import { channels } from "../services/channels.js";
import Avatar from "../components/Avatar.jsx";
import Tooltip from "../components/Tooltip.jsx";
import { isOnline } from "../services/ws.js";

export default {
  render(ctx, props) {
    const channel = channels.get(props.channelId);
    if (!channel) {
      closeOverlay();
      return <></>
    }

    const members = [...channel.members.values()];

    return <>
    <div class="authCard" style="padding-top: 0;">
      <div class="cardTop">
        <span className="m-0 mb-8 text-25" style="margin-right: auto;">Members</span>
        <button onClick={closeOverlay} class="optionBtn-close">
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e8eaed"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
        </button>
      </div>
      {
        ...members.map(m => <div class="memberListItem">
          <Avatar username={m.username} status={isOnline(m.id) ? "#4CD964" : "#808080"} />
          <span class="text-overflow">${m.username}</span>
          {
            channel.owner.id === m.id ?
            <Tooltip nSlot="show, hide, tempRef" overlay={true}>
              <slot name='tooltip'>
                <div style="padding: 6px 8px; background: #2f445a; color: white; border-radius: 6px; display: flex; align-items: center; gap: 6px;">
                  <svg style="flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#D4AF37"><path d="M200-160v-80h560v80H200Zm0-140-51-321q-2 0-4.5.5t-4.5.5q-25 0-42.5-17.5T80-680q0-25 17.5-42.5T140-740q25 0 42.5 17.5T200-680q0 7-1.5 13t-3.5 11l125 56 125-171q-11-8-18-21t-7-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820q0 15-7 28t-18 21l125 171 125-56q-2-5-3.5-11t-1.5-13q0-25 17.5-42.5T820-740q25 0 42.5 17.5T880-680q0 25-17.5 42.5T820-620q-2 0-4.5-.5t-4.5-.5l-51 321H200Zm68-80h424l26-167-105 46-133-183-133 183-105-46 26 167Zm212 0Z"/></svg>
                  Channel Owner
                </div>
              </slot>
              <svg ref={tempRef} onMouseenter={show} onMouseleave={hide} style="flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#D4AF37"><path d="M200-160v-80h560v80H200Zm0-140-51-321q-2 0-4.5.5t-4.5.5q-25 0-42.5-17.5T80-680q0-25 17.5-42.5T140-740q25 0 42.5 17.5T200-680q0 7-1.5 13t-3.5 11l125 56 125-171q-11-8-18-21t-7-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820q0 15-7 28t-18 21l125 171 125-56q-2-5-3.5-11t-1.5-13q0-25 17.5-42.5T820-740q25 0 42.5 17.5T880-680q0 25-17.5 42.5T820-620q-2 0-4.5-.5t-4.5-.5l-51 321H200Zm68-80h424l26-167-105 46-133-183-133 183-105-46 26 167Zm212 0Z"/></svg>
            </Tooltip> : null
          }
        </div>)
      }
    </div>
    </>
  },

  meta: {
    closeOnBackgroundClick: true
  }
}