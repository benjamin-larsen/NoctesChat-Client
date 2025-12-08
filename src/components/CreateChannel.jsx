import { ref } from "noctes.jsx"
import Input from "./Input.jsx"

export default {
  onCreated(ctx) {
    ctx.name = ref("");
  },

  render(ctx) {
    return <>
    <div style="display: flex; flex-direction: column; align-items: center; height: 100%; width: 100%;">
      <h1 style="margin: 32px 0 16px 0; font-size: 30px; font-weight: 600;">Create Channel</h1>
      <Input label="Channel Name" nModel={ctx.name} />
    </div>
    </>
  }
}