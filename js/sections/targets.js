import { h } from "../dom.js?v=20261124130956";
import { boxes, COLOURS, partLabel, section } from "./engine.js?v=20261124130956";

/* The second half: where we are today, how targets come from the weak
   spots, how the engine lines up with frameworks people already know, and
   how it keeps growing. */

export function today(p) {
  return section(4, p.today.heading,
    h("p", { class: "lead" }, p.today.intro),
    boxes(p, true),
    h("p", { class: "note" }, p.today.source));
}

export function targets(p) {
  const t = p.targets;
  const ex = t.example;
  return section(5, t.heading,
    h("ol", { class: "three" }, t.steps.map(([title, body], i) => h("li", {},
      h("span", { class: "three-n" }, String(i + 1)),
      h("strong", {}, title),
      h("span", {}, body)))),
    h("h3", { class: "sub" }, t.table_heading),
    h("div", { class: "measures" }, t.rows.map(([id, number]) => {
      const { label, box } = partLabel(p, id);
      return h("div", { class: "measure" },
        h("span", { class: "tag", "--c": COLOURS[box] }, label),
        h("span", { class: "measure-arrow", "aria-hidden": "true" }, "→"),
        h("span", {}, number));
    })),
    h("p", { class: "note" }, t.to_agree),
    h("div", { class: "okr" },
      h("div", { class: "okr-label" }, ex.label),
      row("Goal", ex.goal), row("Number", ex.number), row("Target", ex.target), row("Owner", ex.owner)));
}

function row(k, v) {
  return h("div", { class: "okr-row" }, h("span", {}, k), h("strong", {}, v));
}

export function compare(p) {
  const c = p.compare;
  return section(6, c.heading,
    h("p", { class: "lead" }, c.intro),
    h("div", { class: "frames" }, c.items.map((f) => h("div", { class: "frame" },
      h("h3", {}, f.name),
      h("p", { class: "frame-who" }, f.who),
      h("p", {}, f.what),
      f.map ? h("div", { class: "map" }, f.map.map(([ours, theirs], i) => h("div", { class: "map-row" },
        h("span", { class: "tag", "--c": Object.values(COLOURS)[i] }, ours),
        h("span", { class: "measure-arrow", "aria-hidden": "true" }, "="),
        h("span", {}, theirs)))) : null,
      h("p", { class: "frame-ours" }, h("strong", {}, "Ours: "), f.ours)))));
}

export function grows(p) {
  return section(7, p.grows.heading,
    h("ul", { class: "grows" }, p.grows.lines.map((l) => h("li", {}, l))));
}
