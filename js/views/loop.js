import { h, plural, viewHead } from "../dom.js?v=20261124124457";
import { nodeChip, openHop } from "./evidence.js?v=20261124124457";
import { wheel } from "./wheel.js?v=20261124124457";

/* Chains of reasoning. Each one is a path the room actually walked: the
   build refuses any hop nobody walked. Loops draw as a wheel, straight
   chains as a line, and underneath every hop shows its words in place. */

export function loopView(root, model, chainId) {
  const chains = [...model.chains.values()];
  const chain = model.chains.get(chainId) ?? chains[0];
  root.append(
    viewHead("Chains of reasoning",
      "The loop",
      "Each chain is a path the room walked on the day, one word leading to the next. None is drawn unless somebody said it. Tap any number to read the words behind that link."),
    h("div", { class: "chain-tabs" },
      chains.map((c) => h("a", {
        class: "btn", href: `#loop/${c.id}`, "aria-pressed": c.id === chain.id ? "true" : "false",
      }, c.title))),
    h("section", { class: "chain-stage card" },
      h("p", { class: "chain-line" }, chain.line),
      chain.loop ? wheel(model, chain) : null,
      h("div", { class: chain.loop ? "chain-row mobile-only" : "chain-row" }, row(model, chain)),
    ),
    h("section", { class: "hop-list" },
      h("h2", {}, "Every link, in the room's words"),
      allHops(model, chain).map(([a, b]) => hopCard(model, a, b))),
  );
}

function allHops(model, chain) {
  return [...(chain.feeds ?? []).filter(([, b]) => chain.nodes.includes(b)),
    ...model.hops(chain),
    ...(chain.feeds ?? []).filter(([, b]) => !chain.nodes.includes(b))];
}

function row(model, chain) {
  const out = [];
  const ids = chain.loop ? [...chain.nodes, chain.nodes[0]] : chain.nodes;
  ids.forEach((id, i) => {
    if (i > 0) out.push(hopButton(model, ids[i - 1], id));
    out.push(nodeChip(model, id));
  });
  return out;
}

function hopButton(model, a, b) {
  const n = model.link(a, b)?.phrases.length ?? 0;
  return h("button", { class: "row-hop", type: "button", onclick: () => openHop(model, a, b) },
    h("span", {}, "→"), h("small", {}, `×${n}`));
}

function hopCard(model, a, b) {
  const phrases = model.link(a, b)?.phrases ?? [];
  const shown = phrases.slice(0, 3);
  return h("div", { class: "hop-card card" },
    h("div", { class: "hop-card-head" },
      nodeChip(model, a), h("span", { class: "hop-arrow" }, "→"), nodeChip(model, b),
      h("span", { class: "hop-count" }, plural(phrases.length, "time"))),
    h("ul", { class: "hop-quotes" },
      shown.map((p) => h("li", {},
        h("span", { class: "q" }, `${p.from} → `, h("strong", {}, p.to)),
        h("span", { class: "w-by" }, p.by)))),
    phrases.length > shown.length
      ? h("button", { class: "more", type: "button", onclick: () => openHop(model, a, b) },
        `See all ${phrases.length}`)
      : null,
  );
}
