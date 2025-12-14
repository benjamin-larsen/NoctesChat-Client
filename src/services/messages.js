import { createEditor, $getRoot, $createParagraphNode, INSERT_LINE_BREAK_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_EDITOR, KEY_ENTER_COMMAND, $createTextNode } from "lexical";
import { mergeRegister } from '@lexical/utils';
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { registerPlainText } from "@lexical/plain-text";
import { channelStatuses } from "./channels.js";
import { request } from "./http.js";

export const editor = createEditor({
  namespace: 'NoctesChat',
  onError: console.error
})

export const historyState = createEmptyHistoryState();

let swapping = false;

export function isSwapping() {
  return swapping;
}

export const msgBoxState = {
  mounted: false,
  channelState: null,
  cleanup: null,
  ctx: null
};

let shouldBlockEnter = false;

mergeRegister(
  editor.registerCommand(KEY_ENTER_COMMAND, (e) => {
    shouldBlockEnter = !e.shiftKey;
  }, COMMAND_PRIORITY_HIGH),

  editor.registerCommand(INSERT_LINE_BREAK_COMMAND, () => {
    if (shouldBlockEnter) {
      if (msgBoxState.ctx) {
        editor.read(() => {
          const root = $getRoot();

          msgBoxState.ctx.$emit("enter", root.getTextContent());
        })
      }

      shouldBlockEnter = false;
      return true;
    }
  }, COMMAND_PRIORITY_EDITOR),

  registerHistory(editor, historyState, 200),
  registerPlainText(editor),
  editor.registerTextContentListener((next) => {
    if (!msgBoxState.ctx) return;

    msgBoxState.ctx.textUpdate(next);
  })
);

function clearEditor(shouldBlur = false) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
  });

  if (shouldBlur) {
    editor.blur();
  }
}

export async function sendMessage(channelId, msgRaw) {
  const status = channelStatuses.get(channelId);
  if (!status) return;

  const msgContent = msgRaw.trim();
  
  if (!msgContent) return;

  clearEditor();
  status.scroll = null;

  await request({
    url: `/channels/${channelId}/messages`,
    method: "POST",
    body: {
      content: msgContent
    },
    includeAuth: true
  })
}

// Active -> Idle
export function idleSwap() {
  if (swapping) {
    throw new Error("Attempted to swap during swap.");
  }

  swapping = true;
  try {
    if (!msgBoxState.channelState) {
      console.warn("Channel State is not active.");
      return;
    }

    let oldEditorState = editor.getEditorState().clone(null);

    oldEditorState.read(() => {
      const root = $getRoot();

      if (root.getChildrenSize() === 0) oldEditorState = null;
    })

    msgBoxState.channelState.value = {
      editorState: oldEditorState,
      historyState: {
        current: { ...historyState.current },
        redoStack: [ ...historyState.redoStack ],
        undoStack: [ ...historyState.undoStack ],
      }
    };
    msgBoxState.channelState = null;
  } finally {
    swapping = false;
  }
}

// Idle -> Active
export function dispatchSwap(newState) {
  if (swapping) {
    throw new Error("Attempted to swap during swap.");
  }

  swapping = true;

  try {
    if (msgBoxState.channelState) {
      console.warn("Channel State is not idle.");
      return;
    }

    if (newState.value) {
      const { editorState, historyState: newHistory } = newState.value;

      if (editorState) editor.setEditorState(editorState); else clearEditor(true);

      historyState.current = newHistory.current;
      historyState.redoStack = newHistory.redoStack;
      historyState.undoStack = newHistory.undoStack;
    } else {
      clearEditor(true);

      historyState.current = null;
      historyState.redoStack = [];
      historyState.undoStack = [];
    }
    
    msgBoxState.channelState = newState;
  } finally {
    swapping = false;
  }
}

// Active (Channel A) -> Active (Channel B)
export function contextSwap(newState) {
  idleSwap();
  dispatchSwap(newState);
}

export function setMsgBoxRoot(el, ctx) {
  if (msgBoxState.mounted) {
    console.warn("Message Box is already mounted.");
    return;
  }

  editor.setRootElement(el);

  msgBoxState.mounted = true;
  msgBoxState.ctx = ctx;
}

export function unsetMsgBoxRoot() {
  const prevSwapping = swapping;
  swapping = true;

  try {
    if (!msgBoxState.mounted) {
    console.warn("Message Box is not mounted.");
    return;
  }

  msgBoxState.ctx = null;

  editor.setRootElement(null);

  msgBoxState.cleanup = null;
  msgBoxState.mounted = false;
  } finally {
    swapping = prevSwapping;
  }
}