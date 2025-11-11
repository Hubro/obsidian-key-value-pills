import { MarkdownPostProcessorContext, Plugin } from "obsidian";

import pillLivePreviewExtension from "./editor-widget";
import { createPill, scanPills } from "./pill";

export default class KeyValuePillPlugin extends Plugin {
  async onload() {
    console.log("Loading plugin key-value-pill");

    this.registerMarkdownPostProcessor(
      (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        const blocks = el.querySelectorAll("p, li");
        for (const block of Array.from(blocks)) {
          this.processBlock(block as HTMLElement);
        }
      },
    );

    this.registerEditorExtension(pillLivePreviewExtension);
  }

  processBlock(block: HTMLElement) {
    const html = block.innerHTML;
    let pillStart: number,
      pillEnd: number,
      pillIndex = 1,
      cursor = 0,
      newHTML = "";

    const pillPositions = scanPills(html);

    for ([pillStart, pillEnd] of pillPositions) {
      let key = null,
        value = html.substring(pillStart + 2, pillEnd - 1);

      const eq = value.indexOf("=");
      if (eq !== -1) {
        key = value.substring(0, eq).trim();
        value = value.substring(eq + 1).trim();
      }

      if (pillStart > cursor) newHTML += html.substring(cursor, pillStart);

      newHTML += createPill(pillIndex, key, value).outerHTML;
      pillIndex += 1;

      cursor = pillEnd + 1;
    }

    if (cursor < html.length - 1) newHTML += html.substring(cursor);

    block.innerHTML = newHTML;
  }

  onunload() {
    // ...
  }
}
