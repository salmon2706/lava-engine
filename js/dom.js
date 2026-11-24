/* Tiny element builder and the shared vocabulary. Text always goes in as
   text nodes, never as HTML, so nothing from the data can inject markup. */

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k.startsWith("--")) el.style.setProperty(k, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

const SVG = "http://www.w3.org/2000/svg";

export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}

export const ROLES = {
  have: { name: "What we have", short: "We have", colour: "var(--have)" },
  do: { name: "What we do", short: "We do", colour: "var(--do)" },
  they_get: { name: "What they get", short: "They get", colour: "var(--they_get)" },
  we_get: { name: "What we get", short: "We get", colour: "var(--we_get)" },
};

export const ROLE_ORDER = ["have", "do", "they_get", "we_get"];

export function rolePill(role, text) {
  const r = ROLES[role];
  if (!r) return h("span", { class: "pill", "--c": "var(--muted)" }, text ?? "Not placed");
  return h("span", { class: "pill", "--c": r.colour }, h("span", { class: "role-dot" }), text ?? r.short);
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function initials(name) {
  return name.slice(0, 1).toUpperCase();
}

export function viewHead(eyebrow, title, lede) {
  return h("header", { class: "view-head" },
    h("div", { class: "eyebrow" }, eyebrow),
    h("h1", {}, title),
    lede ? h("p", {}, lede) : null,
  );
}
