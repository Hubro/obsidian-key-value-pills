export function createPill(
  index: number,
  key: string,
  value: string | null,
): HTMLDivElement {
  const pill = document.createElement("div");
  pill.addClasses(["pill", `pill-${index}`]);

  if (!value) {
    value = key;
    key = null;
    pill.addClass("no-key");
  }

  if (key) {
    const keySpan = document.createElement("span");
    keySpan.addClass("key");
    keySpan.innerHTML = key;
    pill.appendChild(keySpan);
  }

  const valueSpan = document.createElement("span");
  valueSpan.addClass("value");
  valueSpan.innerHTML = value;
  pill.appendChild(valueSpan);

  return pill;
}

export function scanPills(text: string): [number, number][] {
  const pills: [number, number][] = [];

  let cursor = 0;

  while (true) {
    if (cursor >= text.length) break;

    const pillStart = text.indexOf("[(", cursor);
    if (pillStart === -1) break;

    cursor = pillStart;

    const pillEnd = text.indexOf(")]", cursor);
    if (pillEnd === -1) break;
    cursor = pillEnd + 1;

    pills.push([pillStart, pillEnd + 1]);
  }

  return pills;
}
