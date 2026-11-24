import { h, plural, ROLE_ORDER, ROLES, viewHead } from "../dom.js?v=20261124124457";
import { attentionBadge, openNode } from "./evidence.js?v=20261124124457";

/* The four columns. Each card is one engine node: what it is in a line,
   how much of the room's evidence sits behind it (bars), and whether anyone
   is on it today. Tap for every word behind it and who said it. */

export function engineView(root, model, focus) {
  const heaviest = Math.max(...model.spine.nodes.map((n) => model.stats(n.id).words));
  const m = model.spine.mission;
  root.append(
    viewHead("The engine",
      "How Lava Labs works, in four columns",
      `${model.meta.words} words from the room, folded into ${model.spine.nodes.length} parts of one engine. Read it left to right: because we have, we do, so they get, and we get. Tap any part to see who said it.`),
    h("div", { class: "legend" },
      h("span", {}, "Bars: how many of the room's words sit behind each part."),
      h("span", {}, h("span", { class: "attn attn-gap" }, "A gap"), " the engine needs it and nobody is clearly on it.")),
    h("section", { class: "mission card" },
      h("div", {},
        h("div", { class: "eyebrow" }, "Why we exist"),
        h("h2", {}, m.label),
        h("p", {}, m.line)),
      h("div", { class: "by" }, `Proposed by ${m.said_by}`, h("br"), `${plural(model.stats("mission").words, "word")} from the room`)),
    h("div", { class: "columns" },
      ROLE_ORDER.map((role) => column(model, role, heaviest))),
    outside(model),
  );
  if (focus && model.node(focus)) window.setTimeout(() => openNode(model, focus), 60);
}

function column(model, role, heaviest) {
  const nodes = model.spine.nodes.filter((n) => n.role === role);
  const words = nodes.reduce((t, n) => t + model.stats(n.id).words, 0);
  return h("div", { "--c": ROLES[role].colour },
    h("div", { class: "col-head" },
      h("span", { class: "role-dot" }),
      h("h2", {}, ROLES[role].name),
      h("span", { class: "muted" }, plural(words, "word"))),
    h("div", { class: "col" }, nodes.map((n) => card(model, n, heaviest))),
  );
}

function card(model, n, heaviest) {
  const st = model.stats(n.id);
  const bars = 8;
  const on = Math.max(1, Math.round((st.words / heaviest) * bars));
  return h("button", { class: "node-card card", type: "button", onclick: () => openNode(model, n.id) },
    h("h3", {}, n.label),
    h("p", {}, n.line),
    h("div", { class: "node-foot" },
      h("span", { class: "weight", title: plural(st.words, "word") },
        Array.from({ length: bars }, (_, i) => h("i", { class: i < on ? "on" : "" }))),
      h("span", {}, plural(st.words, "word")),
      attentionBadge(model, n.id)),
  );
}

function outside(model) {
  const c = model.spine.check;
  const rest = model.outside.filter((x) => x.label !== c.label && x.label !== "Lava Labs");
  return h("section", { class: "outside card" },
    h("h2", {}, "Not in the engine"),
    h("p", {}, "Words the room said that are not part of how the engine turns: starting points, half-thoughts and doubts. Kept, not deleted."),
    h("div", { class: "outside-list" }, rest.map((x) => h("span", {}, x.label))),
    h("div", { class: "check-card" },
      h("div", { class: "eyebrow" }, `The check, from ${c.said_by}`),
      h("strong", {}, `"${c.word}"`),
      h("span", { class: "muted" }, c.line)),
  );
}
