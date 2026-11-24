import { h, rolePill, ROLES } from "../dom.js?v=20261124101623";
import { nodeChip } from "./evidence.js?v=20261124101623";

/* The front door. Answers the question the team keeps asking (why did we
   do that day?) in the order a sceptic would ask it: what problem, what
   happened, what came out, where it has already been used, what went wrong,
   and what we do with it now. Counts come from the data, not the prose. */

export function whyView(root, model) {
  const st = model.story;
  const m = model.meta;
  root.append(
    h("section", { class: "hero" },
      h("div", { class: "eyebrow" }, st.kicker),
      h("h1", {}, st.title),
      h("p", { class: "hero-lede" }, st.lede),
      h("div", { class: "hero-stats" },
        bigStat(m.words, "words"), bigStat(m.people, "people"), bigStat(m.steps, "steps walked"),
        bigStat(m.concepts, "concepts"), bigStat(model.spine.nodes.length, "engine parts")),
      h("div", { class: "hero-cta" },
        h("a", { class: "btn primary", href: "#you" }, "Find your words"),
        h("a", { class: "btn", href: "#use" }, "Test a decision"))),

    block(st.problem.heading, st.problem.body.map((p) => h("p", {}, p))),

    block(st.day.heading,
      h("ol", { class: "steps3" }, st.day.steps.map(([t, body], i) => h("li", { class: "card" },
        h("span", { class: "step-n" }, String(i + 1)), h("h3", {}, t), h("p", {}, body))))),

    block(st.gave.heading,
      h("div", { class: "gave" }, st.gave.cards.map(([t, body]) => h("div", { class: "card gave-card" },
        h("h3", {}, t), h("p", {}, body)))),
      h("div", { class: "correction" }, correction(model))),

    block(st.used.heading,
      h("p", { class: "block-intro" }, st.used.intro),
      h("div", { class: "used" }, st.used.items.map(([id]) => usedCard(model, model.decisions.get(id))))),

    h("section", { class: "honest card" },
      h("h2", {}, st.honest.heading), h("p", {}, st.honest.body)),

    block(st.how.heading,
      h("ol", { class: "rules" }, st.how.rules.map((r) => h("li", {}, r))),
      h("blockquote", { class: "oneline" }, st.oneline)),
  );
}

function bigStat(n, label) {
  return h("div", { class: "big-stat" }, h("strong", {}, String(n)), h("span", {}, label));
}

function block(title, ...content) {
  return h("section", { class: "block" }, h("h2", {}, title), ...content);
}

function correction(model) {
  const c = model.bundle.data.concepts.find((x) => x.label === "Reliability");
  if (!c) return [];
  const by = [...new Set(c.words.map((id) => model.word(id).by))];
  return [
    h("span", { class: "muted" }, "The room's own placement of reliability:"),
    rolePill(c.room_role, ROLES[c.room_role]?.name),
    h("span", { class: "muted" }, `from ${c.words.length} words said by ${by.join(", ")}.`),
    nodeChip(model, "reliable"),
  ];
}

function usedCard(model, d) {
  return h("a", { class: "card used-card", href: `#use/${d.id}` },
    h("span", { class: `verdict v-${slug(d.verdict)}` }, d.verdict),
    h("h3", {}, d.title),
    h("p", {}, d.why),
    h("div", { class: "used-nodes" }, d.nodes.map((id) => h("span", { class: "mini" }, model.node(id).label))));
}

export function slug(text) {
  return text.toLowerCase().replace(/[^a-z]+/g, "-");
}
