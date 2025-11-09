export default function createPill(
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
