import { ref } from "noctes.jsx"

export default {
  methods: {
    show() {
      if (!this.templateRef.value) return;

      const { top, bottom, right, left, height, width } = this.templateRef.value.getBoundingClientRect();

      if (this.props.mode === "top") {
        this.info.value = {
          top: top - 6,
          left: Math.floor(right - (width / 2)),
          transform: `translateY(-100%) translateX(-50%)`
        }
      } else if (this.props.mode === "bottom") {
        this.info.value = {
          top: bottom + 6,
          left: Math.floor(right - (width / 2)),
          transform: `translateX(-50%)`
        }
      } else if (this.props.mode === "left") {
        this.info.value = {
          top: Math.floor(top + (height / 2)),
          left: left - 6,
          transform: `translateX(-100%) translateY(-50%)`
        }
      } else {
        this.info.value = {
          top: Math.floor(top + (height / 2)),
          left: right + 6,
          transform: `translateY(-50%)`
        }
      }
    },

    hide() {
      this.info.value = null;
    }
  },

  onCreated(ctx) {
    ctx.info = ref(null);
    ctx.templateRef = ref(null);
  },

  render(ctx, props, slots) {
    const info = ctx.info.value;

    return <>
    <Transition>
      {info ? <Teleport to="#overlays">
        <div onMouseenter={ctx.methods.show} onMouseleave={ctx.methods.hide} style={{
          top: `${info.top}px`,
          left: `${info.left}px`,
          position: "absolute",
          transform: info.transform,
          pointerEvents: "all"
        }}>{slots.tooltip?.()}</div>
      </Teleport> : null}
    </Transition>
    {slots.default?.(ctx.methods.show, ctx.methods.hide, ctx.templateRef)}
    </>
  }
}