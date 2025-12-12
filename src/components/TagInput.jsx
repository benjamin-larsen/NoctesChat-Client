import { nModel, ref, shallowReactive, watch } from "noctes.jsx"
import Avatar from "./Avatar";
import Tooltip from "./Tooltip.jsx";

function remove(arr, item) {
  const index = arr.findIndex(t => t.value === item);

  if (index != -1) {
    arr.splice(index, 1);
  }
}

export default {
  methods: {
    addTag() {
      const ctx = this;

      const inputValue = ctx.input.value.trim().toLowerCase();
      if (!inputValue) return;
      if (!Array.isArray(ctx.props.nModel)) return;

      ctx.input.value = "";

      if (ctx.props.nModel.findIndex(t => t.value === inputValue) !== -1) return;

      const obj = shallowReactive({
        value: inputValue,
        status: "loading"
      });

      ctx.props.nModel.push(obj);
      ctx.resolve(obj);
    },

    popTag() {
      const ctx = this;

      if (Array.isArray(ctx.props.nModel)) {
        ctx.props.nModel.pop();
      }
    }
  },

  onCreated(ctx, props) {
    ctx.inputEl = ref(null);
    ctx.isEmpty = ref(true);
    ctx.isFocused = ref(false);
    ctx.model = shallowReactive({
      value: props.nModel
    });
    ctx.toggled = ref(false);

    ctx.input = ref("");

    watch(ctx.input, (next, prev) => {
      ctx.isEmpty.value = !next;
    }, { immediate: true })
  },

  onUpdated(ctx, props) {
    ctx.model.value = props.nModel;
  },

  render(ctx, props) {
    return <>
      <div className={{
        "tagInputContainer": true,
        "inputNotEmpty" : props.nModel.length > 0 || !ctx.isEmpty.value,
        "inputFocused": !props.disabled && ctx.isFocused.value,
        "inputDisabled": props.disabled
        }} tabindex="-1" onClick={() => {if (ctx.props.disabled) return; ctx.inputEl.value.focus()}}>
        <div className="inputContent">
          <span style="top: 17px;">${props.label}</span>
          <div class="tags">
            {
              props.nModel.map(t => <span class="tag">
                {
                  t.status === "error" ?
                  <Tooltip nSlot="show, hide, tempRef" mode="top">
                    <slot name='tooltip'>
                      <div style="padding: 4px 6px; background: #E06C75; color: white; border-radius: 4px; font-size: 14px;">${t.error}</div>
                    </slot>
                    <svg ref={tempRef} onMouseenter={show} onMouseleave={hide} xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#E06C75"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
                    </Tooltip>: 
                  t.status === "loading" ? <span class="loader" style="height: 15px; width: 15px; border-width: 2px;"></span> :
                  <Avatar username={t.value} style="height: 20px; width: 20px; font-size: 12px;"></Avatar>
                }
                ${t.value}
                <svg onClick={() => {remove(props.nModel, t.value)}} class="closeBtn" xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="17px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </span>)
            }
            <input
              disabled={props.disabled}
              onFocus={() => {ctx.isFocused.value = true}}
              onBlur={() => {ctx.isFocused.value = false}}
              onClick={(e) => e.stopPropagation()}
              onKeydown={(e) => {
                const el = ctx.inputEl.value;

                if (e.which === 13 && !e.shiftKey) {e.preventDefault(); ctx.addTag()}
                else if (e.which === 8 && el && el.selectionStart === 0) {e.preventDefault(); ctx.popTag()}
              }}
              ref={ctx.inputEl}
              type={ctx.toggled.value ? null : props.type}
              tabindex="0"
              nModel={ctx.input} />
          </div>
        </div>
      </div>
    </>
  }
}