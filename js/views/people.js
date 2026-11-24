import { h, plural, ROLES, viewHead } from "../dom.js?v=20261124124457";
import { nodeChip, openNode } from "./evidence.js?v=20261124124457";

/* You built it. Pick your name: your words, which parts of the engine they
   feed, and which of them the room chose to follow. The point is ownership:
   nobody handed this model down. */

export function peopleView(root, model, who) {
  const people = model.people;
  const me = people.find((p) => p.name === who) ?? null;
  const most = Math.max(...people.map((p) => p.words));
  root.append(
    viewHead("You built it",
      "Find your words",
      "Five people, almost exactly the same number of words each. Nobody dominated this engine. Pick your name to see where your words ended up."),
    h("div", { class: "people-pick" },
      people.map((p) => h("a", {
        class: "person card", href: `#you/${encodeURIComponent(p.name)}`, "aria-pressed": p === me ? "true" : "false",
      },
      h("span", { class: "avatar" }, p.name.slice(0, 1)),
      h("strong", {}, p.name),
      h("span", { class: "person-bar" }, h("i", { style: { width: `${(p.words / most) * 100}%` } })),
      h("span", { class: "muted" }, `${plural(p.words, "word")} · ${plural(p.votes_received, "vote")} received`)))),
    me ? person(model, me) : h("p", { class: "people-hint muted" }, "Choose a name above."),
  );
}

function person(model, p) {
  const mine = model.words.filter((w) => w.by === p.name);
  const chosen = new Set(model.steps.map((s) => s.chosen).filter(Boolean));
  const followed = mine.filter((w) => chosen.has(w.id));
  const top = p.top.map((id) => model.word(id)).filter((w) => w.votes > 0);
  const total = Math.max(...p.nodes.map(([, n]) => n));
  return h("section", { class: "me fade-in" },
    h("div", { class: "me-head" },
      h("h2", {}, `${p.name}'s words`),
      h("p", { class: "muted" },
        `${plural(followed.length, "of your words was", "of your words were")} chosen by the room as the next step.`)),
    h("div", { class: "me-grid" },
      h("div", { class: "card me-card" },
        h("h3", {}, "Your most voted"),
        h("ul", { class: "me-top" }, top.map((w) => h("li", {},
          h("span", { class: "w-text" }, w.text),
          h("span", { class: "w-votes" }, plural(w.votes, "vote")),
          w.spine && model.node(w.spine) ? nodeChip(model, w.spine) : h("span", { class: "muted" }, w.spine === "mission" ? "Why we exist" : "Not in the engine"))))),
      h("div", { class: "card me-card" },
        h("h3", {}, "The parts of the engine you fed"),
        h("ul", { class: "me-nodes" }, p.nodes.filter(([id]) => model.node(id)).map(([id, n]) => {
          const node = model.node(id);
          return h("li", { "--c": ROLES[node.role].colour },
            h("button", { type: "button", onclick: () => openNode(model, id) }, node.label),
            h("span", { class: "me-bar" }, h("i", { style: { width: `${(n / total) * 100}%` } })),
            h("span", { class: "muted" }, String(n)));
        })))),
    h("div", { class: "card me-card me-all" },
      h("h3", {}, `Everything you said (${mine.length})`),
      h("div", { class: "me-words" }, mine.map((w) => h("span", {
        class: `me-word${chosen.has(w.id) ? " chosen" : ""}`,
        title: w.concept ? `Folded into ${w.concept}` : "",
      }, w.text)))),
  );
}
