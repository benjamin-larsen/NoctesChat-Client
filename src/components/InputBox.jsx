import { nextTick, nModel, ref, shallowReactive, watch } from "noctes.jsx"

export default {
  methods: {
    async resize() {
      await nextTick();

      const el = this.inputEl.value;
      if (!el) return;

      el.style.height = "1px"
      el.style.height = `${el.scrollHeight}px`
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

    watch(() => ctx.model.value && ctx.model.value.value, (next, prev) => {
      ctx.$emit("input", next);

      ctx.isEmpty.value = !next;

      ctx.resize();
    }, { immediate: true })
  },

  onUpdated(ctx, props) {
    ctx.model.value = props.nModel;
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
          <textarea
          disabled={props.disabled}
          onFocus={() => {ctx.isFocused.value = true}}
          onBlur={() => {ctx.isFocused.value = false}}
          onClick={(e) => e.stopPropagation()}
          onKeydown={(e) => {if (e.which !== 13 || e.shiftKey) return; e.preventDefault(); ctx.$emit("enter");}}
          ref={ctx.inputEl}
          tabindex="0"
          nModel={ctx.model.value} />
        </div>
      </div>
    </>
  }
}