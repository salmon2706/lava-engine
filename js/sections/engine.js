import { h } from "../dom.js?v=20261124130956";

/* The first half of the page: what the engine is, the loop, and what it
   helps with. Short sentences, one idea per line, no jargon. */

export const COLOURS = { have: "var(--have)", do: "var(--do)", they_get: "var(--they_get)", we_get: "var(--we_get)" };

export function section(n, heading, ...content) {
  return h("section", { class: "sec", id: `s${n}` },
    h("div", { class: "sec-n" }, String(n)),
    h("h2", {}, heading),
    ...content);
}

export function hero(p) {
  return h("header", { class: "hero" },
    h("h1", {}, p.hero.title),
    p.hero.lines.map((l) => h("p", {}, l)),
    h("p", { class: "why" }, p.why));
}

export function partLabel(p, id) {
  for (const box of p.boxes.items) {
    const found = box.parts.find(([pid]) => pid === id);
    if (found) return { label: found[1], box: box.id };
  }
  throw new Error(`unknown part ${id}`);
}

export function boxes(p, withStatus) {
  return h("div", { class: "boxes" }, p.boxes.items.map((b, i) => h("div", { class: "box-wrap" },
    h("div", { class: "box", "--c": COLOURS[b.id] },
      h("h3", {}, b.title),
      h("p", { class: "box-plain" }, b.plain),
      h("ul", {}, b.parts.map(([id, label]) => h("li", {},
        h("span", {}, label),
        withStatus ? statusChip(p, id) : null)))),
    i < p.boxes.items.length - 1 ? h("div", { class: "arrow", "aria-hidden": "true" }, "→") : null)));
}

export function statusChip(p, id) {
  const level = p.today.status[id];
  return h("span", { class: `status status-${level}` }, p.today.levels[level]);
}

export function engine(p) {
  return section(1, p.boxes.heading,
    h("p", { class: "lead" }, p.boxes.intro),
    boxes(p, false));
}

export function loop(p) {
  return section(2, p.loop.heading,
    h("p", { class: "lead" }, p.loop.intro),
    h("ol", { class: "loop" }, p.loop.steps.map((s, i) => h("li", {},
      h("span", { class: "loop-n" }, String(i + 1)),
      h("span", {}, s)))),
    h("div", { class: "loop-back" }, h("span", { "aria-hidden": "true" }, "↺"), p.loop.back));
}

export function helps(p) {
  const hp = p.helps;
  return section(3, hp.heading,
    h("p", { class: "lead" }, hp.question),
    h("p", { class: "ask" }, hp.ask),
    h("div", { class: "answers" }, hp.answers.map(([kind, title, act]) => h("div", { class: `answer answer-${kind}` },
      h("strong", {}, title),
      h("span", {}, act)))),
    h("h3", { class: "sub" }, hp.examples_heading),
    h("div", { class: "examples" }, hp.examples.map((e) => h("div", { class: "example" },
      h("div", { class: `verdict verdict-${e.answer.startsWith("Yes") ? "yes" : "no"}` }, e.answer),
      h("h4", {}, e.title),
      h("p", {}, e.why),
      h("div", { class: "tags" }, e.parts.map((id) => {
        const { label, box } = partLabel(p, id);
        return h("span", { class: "tag", "--c": COLOURS[box] }, label);
      }))))));
}
