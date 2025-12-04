import { getInitals } from "../services/utils"

export default {
  render(ctx, props) {
    return <>
    <div className={"avatar" + (props.className ? `props.className ${props.className}` : "")} style={props.style}>
      <span>${getInitals(props.username)}</span>
      <span class="avatarStatus" style={`background-color: ${props.status}`} />
    </div>
    </>
  }
}