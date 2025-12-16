import { ref } from "noctes.jsx";
import { currentOverlay, closeOverlay } from "../services/overlays.js"

export default {
  onCreated(ctx) {
    ctx.elRef = ref(null);
  },

  render(ctx) {
    const overlay = currentOverlay.value;

    return <>
      <Transition>
        { overlay ?
        <div ref={ctx.elRef} onClick={(e) => {
          if (!overlay.comp.meta || !overlay.comp.meta.closeOnBackgroundClick) return;
          if (e.target !== ctx.elRef.value) return;

          closeOverlay();
        }} class="page-center" style="position: absolute; top: 0; left: 0; pointer-events: all; background: rgba(0,0,0,0.5); z-index: 5;">
          <component {...overlay.props} is={overlay.comp} />
        </div> : null }
      </Transition>
    </>
  }
}