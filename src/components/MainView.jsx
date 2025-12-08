import { RouterView, RouterLink } from "noctes.jsx-router"
import Avatar from "./Avatar.jsx";
import ChannelIcon from "./ChannelIcon.jsx";
import { ensureLoadUser, authUser, authError } from "../services/auth.js"
import { channels } from "../services/channels.js";
import { connState, WS_STATES } from "../services/ws.js";
import Tooltip from "./Tooltip.jsx";

export default {
  render() {
    ensureLoadUser();

    if (!authUser.value || connState.value !== WS_STATES.active) {
      return <>
        <div class="page-center">
          <span class="loader"></span>
          {authError.value ? <p>${authError.value}</p> : null}
        </div>
      </>
    }

    const user = authUser.value;

    return <>
      <div className="mainView">
        <div style="display: flex; flex-direction: column; height: 100%">
          <div className="channelListContainer">
            <div className="channeList">
              {
                [...channels.values()].map(c => <ChannelIcon key={c.id} name={c.name} id={c.id} />)
              }
            </div>
            <Tooltip nSlot="show, hide, tempRef">
              <slot name='tooltip'>
                <div style="padding: 6px 8px; background: white; color: black; border-radius: 6px;">Create new Channel</div>
              </slot>
              <RouterLink elRef={tempRef} onMouseenter={show} onMouseleave={hide} to="/" className="addChannel">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#1C2B3A"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
              </RouterLink>
            </Tooltip>
          </div>
          <div className="profileContainer">
            <Tooltip nSlot="show, hide, tempRef" mode="top">
              <slot name='tooltip'>
                <div style="padding: 6px 8px; background: white; color: black; border-radius: 6px;">Test Tooltip</div>
              </slot>
              <div className="profile" ref={tempRef} onMouseenter={show} onMouseleave={hide}>
                <Avatar username={user.username} status="#4CD964" />
                <div style="display: flex; flex-direction: column; line-height: 1;">
                  <span>${user.username}</span>
                  <span style="font-size: 14px; color: #c5c5c5ff">Online</span>
                </div>
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="mainContent">
          <RouterView />
        </div>
      </div>
    </>
  }
}