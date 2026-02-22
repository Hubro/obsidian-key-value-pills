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
import { syntaxTree } from "@codemirror/language";

import { createPill } from "./pill";

const PILL_REGEX = /\[\(((?:[^=)]|\)(?!\]))+)(?:=((?:[^=)]|\)(?!\]))+))?\)\]/g;

class PillWidget extends WidgetType {
  constructor(
    readonly key: string,
    readonly value: string | undefined,
    readonly index: number,
    readonly editorPos: number,
  ) {
    super();
  }

  eq(otherPill: WidgetType): boolean {
    if (otherPill instanceof PillWidget === false) return false;

    return (
      this.key == otherPill.key &&
      this.value == otherPill.value &&
      this.index == otherPill.index
    );
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
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const state = view.state;
      const livePreview = state.field(editorLivePreviewField, false);

      // Only run in Live Preview, don’t mess with Source mode
      if (!livePreview) return Decoration.none;

      const tree = syntaxTree(state);

      // Check if the position is inside a code block
      function inCode(pos: number): boolean {
        let node = tree.resolve(pos, -1);

        while (node) {
          const name = node.name;

          if (name === "hmd-codeblock" || name === "inline-code") {
            return true;
          }

          node = node.parent;
        }

        return false;
      }

      const builder = new RangeSetBuilder<Decoration>();
      const selRanges = state.selection.ranges;
      const text = state.doc.sliceString(0);
      const lines = text.split("\n");

      let cursor = 0;
      PILL_REGEX.lastIndex = 0;

      for (let line of lines) {
        let match: RegExpExecArray | null;
        let pillIndex = 0;

        while ((match = PILL_REGEX.exec(line)) !== null) {
          pillIndex += 1;

          const [full, key, value] = match;

          const start = cursor + match.index;
          const end = start + full.length;

          // Don't decorate pills inside code blocks
          if (inCode(start)) continue;

          const overlapsSelection = selRanges.some(
            (r) => r.from < end && r.to >= start,
          );
          if (overlapsSelection) {
            // Cursor is inside [(...)] → show raw markdown
            continue;
          }

          const deco = Decoration.replace({
            widget: new PillWidget(key, value, pillIndex, start),
            inclusive: false,
          });

          builder.add(start, end, deco);
        }

        cursor += line.length + 1; // Line endings were stripped by .split()
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

export default pillLivePreviewExtension;
