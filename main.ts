import { MarkdownPostProcessorContext, Plugin } from "obsidian";

import pillLivePreviewExtension from "./editor-widget";
import createPill from "./pill";

export default class KeyValuePillPlugin extends Plugin {
  async onload() {
    console.log("Loading plugin key-value-pill");

    this.registerMarkdownPostProcessor(
      (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        console.log("MARKDOWN POST PROCESSOR EXECUTING!!!");

        const blocks = el.querySelectorAll("p, li");
        for (const block of Array.from(blocks)) {
          this.processBlock(block as HTMLElement);
        }
      },
    );

    this.registerEditorExtension(pillLivePreviewExtension);
  }

  processBlock(block: HTMLElement) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let pillIndex = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue || "";

      const pillRegex = /\[\(([^)=\]]+)(?:=([^\]]+))?\)\]/g;
      let match: RegExpExecArray | null;
      let cursor = 0;
      const frag = document.createDocumentFragment();

      while ((match = pillRegex.exec(text)) !== null) {
        const [fullMatch, key, value] = match;

        const before = text.slice(cursor, match.index);
        if (before) frag.appendChild(document.createTextNode(before));

        const pill = createPill(pillIndex, key, value);
        pillIndex += 1;

        frag.appendChild(pill);

        cursor = match.index + fullMatch.length;
      }

      // No matches
      if (cursor === 0) continue;

      const tail = text.slice(cursor);
      if (tail) frag.appendChild(document.createTextNode(tail)); // frag.appendText ?

      node.parentNode.replaceChild(frag, node);
    }
  }

  onunload() {
    // ...
  }
}
