import { h, plural, ROLE_ORDER, ROLES, viewHead } from "../dom.js?v=20261124124457";
import { attentionBadge, findingCard, monthLabel, openNode } from "./evidence.js?v=20261124124457";

/* Keep building. The day was part 1. This view shows the stages the engine
   goes through, how anyone adds to it, which parts still rest on words
   alone, and the ledger of what sites have told us. All counts are live. */

const WAYS = [
  ["A finding from a site", "Visited a site, spoke to a customer, saw a number? Give the site, the month, one sentence on what happened, which parts of the engine it speaks to, and whether it reads for or against. It goes in the ledger below and on that part's page.", "content/evidence.json"],
  ["A decision", "Before we start anything, run it through the test and record the title, the parts it strengthens, the verdict and why. When the result is in, we come back and say whether the engine called it right.", "content/decisions.json"],
  ["A new word, or a new part", "If something real is not on the map, the map is wrong, not the thing. We hold another session, same method, same rule: humans define and humans connect. New words fold into the 18 parts, or become a 19th.", "a new session"],
];

const MONTHLY = [
  "Which parts gained a finding this month, and did it read for or against?",
  "Which gaps are still on words alone?",
  "Did any decision we tested come good or go wrong? Say so against it.",
];

export function nextView(root, model) {
  const ev = model.evidence;
  const proven = model.spine.nodes.filter((n) => model.evidenceFor(n.id).length);
  const wordsOnly = model.spine.nodes.filter((n) => !model.evidenceFor(n.id).length);
  const openGaps = wordsOnly.filter((n) => model.attention(n.id).level === "gap");

  root.append(
    viewHead("Keep building", "Part 1 is done. Here is how it grows.", model.bundle.evidence.intro),
    h("ol", { class: "stages" },
      stage(1, "Done", "The words", "16th September. Five of us, 219 words, 18 parts, 7 chains. Every link on this site comes from that day."),
      stage(2, ev.length ? "Started" : "Next", "Proof from sites",
        `${plural(ev.length, "finding")} from ${plural(model.sites().length, "source")} so far. ${proven.length} of ${model.spine.nodes.length} parts have real-world proof; ${wordsOnly.length} still rest on words alone.`),
      stage(3, model.decisions.size ? "Started" : "Next", "Decisions on the record",
        `${plural(model.decisions.size, "decision")} tested against the engine. Each one gets checked again once the result is in.`),
      stage(4, "When needed", "New words",
        "When the team changes, when a customer tells us something the map cannot hold, or when a chain we need has no walked link. Same method, another session.")),

    h("section", { class: "block" },
      h("h2", {}, "Three ways to add to it"),
      h("div", { class: "ways" }, WAYS.map(([t, body, where]) => h("div", { class: "card way" },
        h("h3", {}, t), h("p", {}, body), h("div", { class: "way-where" }, "Lives in ", h("code", {}, where)))))),

    h("section", { class: "block" },
      h("h2", {}, "What needs proof next"),
      h("p", { class: "block-intro" }, openGaps.length
        ? `These parts are gaps and no site has spoken to them yet. The first install that renews, refers or gets cheaper to win changes this page.`
        : "Every gap has at least one finding. Now the question is whether they read for or against."),
      h("div", { class: "proof-grid" }, ROLE_ORDER.map((role) => h("div", { class: "proof-col", "--c": ROLES[role].colour },
        h("div", { class: "pick-head" }, h("span", { class: "role-dot" }), ROLES[role].name),
        model.spine.nodes.filter((n) => n.role === role).map((n) => proofRow(model, n)))))),

    h("section", { class: "block" },
      h("h2", {}, "The ledger"),
      ...months(ev).map(([ym, items]) => h("div", { class: "ledger-month" },
        h("h3", {}, monthLabel(ym)),
        items.map((e) => findingCard(model, e))))),

    h("section", { class: "block monthly card" },
      h("div", { class: "eyebrow" }, "Once a month, five minutes"),
      h("ol", { class: "rules" }, MONTHLY.map((q) => h("li", {}, q)))),
  );
}

function stage(n, status, title, body) {
  return h("li", { class: `stage stage-${status.toLowerCase().replace(/\s+/g, "-")}` },
    h("div", { class: "stage-top" }, h("span", { class: "stage-n" }, `Part ${n}`), h("span", { class: "stage-status" }, status)),
    h("h3", {}, title), h("p", {}, body));
}

function proofRow(model, n) {
  const found = model.evidenceFor(n.id);
  const against = found.filter((e) => e.reads === "against").length;
  return h("button", { class: `proof-row${found.length ? "" : " words-only"}`, type: "button", onclick: () => openNode(model, n.id) },
    h("span", { class: "proof-label" }, n.label),
    attentionBadge(model, n.id),
    h("span", { class: "proof-count" }, found.length
      ? `${plural(found.length, "finding")}${against ? `, ${against} against` : ""}`
      : "words only"));
}

function months(items) {
  const by = new Map();
  for (const e of items) by.set(e.date, [...(by.get(e.date) ?? []), e]);
  return [...by.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}
