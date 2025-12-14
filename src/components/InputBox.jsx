import { nextTick, nModel, ref, shallowReactive, watch } from "noctes.jsx"
import { $getRoot } from "lexical";
import { setMsgBoxRoot, unsetMsgBoxRoot, editor, idleSwap, dispatchSwap, contextSwap, isSwapping } from "../services/messages";

export default {
  methods: {
    async resize() {
      await nextTick();

      const el = this.inputEl.value;
      if (!el) return;

      el.style.height = "1px"
      el.style.height = `${el.scrollHeight}px`
    },

    textUpdate(next) {
      const ctx = this;

      if (!isSwapping()) ctx.$emit("input", next);

      ctx.isEmpty.value = !next;
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

    // context switch first

    dispatchSwap(props.nModel);

    editor.read(() => {
      const root = $getRoot();
      ctx.isEmpty.value = !root.getTextContent();
    });
  },

  onMounted(ctx) {
    setMsgBoxRoot(ctx.inputEl.value, ctx);
  },

  onDestroy() {
    idleSwap();
    unsetMsgBoxRoot();
  },

  onUpdated(ctx, props) {
    if (ctx.model.value !== props.nModel) {
      contextSwap(props.nModel);
      ctx.model.value = props.nModel;
    }
  },

  render(ctx, props) {
    return <>
      <div className={{
        "inputContainer": true,
        "inputNotEmpty" : !ctx.isEmpty.value,
        "inputFocused": !props.disabled && ctx.isFocused.value,
        "inputDisabled": props.disabled
        }} tabindex="-1" onClick={() => {if (ctx.props.disabled) return; ctx.inputEl.value.focus()}}>
        <div className="inputContent">
          <span style="top: 17px;">${props.label}</span>
            <div
              class="msgBox"
              contentEditable
              ref={ctx.inputEl}
              onFocus={() => {ctx.isFocused.value = true}}
              onBlur={() => {ctx.isFocused.value = false}}
              onClick={(e) => e.stopPropagation()}
              tabindex="0"
            />
        </div>
      </div>
    </>
  }
}