import { editorLivePreviewField } from "obsidian";

import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

import createPill from "./pill";

const PILL_REGEX = /\[\(([^)=\]]+)(?:=([^\]]+))?\)\]/g;

class PillWidget extends WidgetType {
  constructor(
    readonly key: string,
    readonly value: string | undefined,
    readonly index: number,
    readonly editorPos: number,
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const pill = createPill(this.index, this.key, this.value);

    pill.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();

      view.dispatch({
        selection: { anchor: this.editorPos + 2 },
      });
      view.focus();
    });

    return pill;
  }

  ignoreEvent(event: Event): boolean {
    if (event.type === "mousedown") return true;

    return false;
  }
}

const pillLivePreviewExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const state = view.state;
      const livePreview = state.field(editorLivePreviewField, false);

      // Only run in Live Preview, don’t mess with Source mode
      if (!livePreview) return Decoration.none;

      const builder = new RangeSetBuilder<Decoration>();

      // Consider all selection ranges (multi-cursor safety)
      const selRanges = state.selection.ranges;

      let pillIndex = 0;

      for (const { from, to } of view.visibleRanges) {
        const text = state.doc.sliceString(from, to);
        PILL_REGEX.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = PILL_REGEX.exec(text)) !== null) {
          const [full, key, value] = match;

          const start = from + match.index;
          const end = start + full.length;

          const overlapsSelection = selRanges.some(
            (r) => r.from < end && r.to > start,
          );
          if (overlapsSelection) {
            // Cursor is inside [(...)] → show raw markdown
            continue;
          }

          pillIndex += 1;

          const deco = Decoration.replace({
            widget: new PillWidget(key, value, pillIndex, start),
            inclusive: false,
          });

          builder.add(start, end, deco);
        }
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

export default pillLivePreviewExtension;
