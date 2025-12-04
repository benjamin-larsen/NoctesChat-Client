import { getInitals } from "../services/utils"
import { RouterLink } from "noctes.jsx-router"
import Tooltip from "./Tooltip.jsx";

export default {
  render(ctx, props) {
    return <>
    <Tooltip nSlot="show, hide, tempRef" mode="right">
      <slot name='tooltip'>
        <div style="padding: 6px 8px; background: white; color: black; border-radius: 6px;">${ctx.props.name}</div>
      </slot>
      <RouterLink elRef={tempRef} onMouseenter={show} onMouseleave={hide} to={`/channels/${ctx.props.id}`} className={"channelIcon" + (ctx.props.className ? `props.className ${ctx.props.className}` : "")} style={ctx.props.style}>
        <span>${getInitals(ctx.props.name)}</span>
      </RouterLink>
    </Tooltip>
    </>
  }
}