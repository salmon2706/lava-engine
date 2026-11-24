import { h, plural, rolePill, ROLES } from "../dom.js?v=20261124124457";
import { openSheet } from "../sheet.js?v=20261124124457";

/* Evidence, shown the same way everywhere: the actual morning phrase
   (parent word, then the word said under it), who said it, and the votes it
   got. Opening a node or a hop always lands in the same side panel. */

export function phraseList(phrases) {
  return h("ul", { class: "phrases" },
    phrases.map((p) => h("li", {},
      h("span", { class: "ph-from" }, p.from),
      h("span", { class: "ph-arrow", "aria-hidden": "true" }, "→"),
      h("span", { class: "ph-to" }, p.to),
      h("span", { class: "ph-by" }, p.by),
      p.votes > 0 ? h("span", { class: "ph-votes" }, plural(p.votes, "vote")) : null,
    )),
  );
}

export function nodeChip(model, id, onClick) {
  const n = model.node(id);
  if (!n) return h("span", { class: "pill", "--c": "var(--muted)" }, id);
  return h("button", {
    class: "node-chip",
    type: "button",
    "--c": ROLES[n.role].colour,
    onclick: onClick ?? (() => openNode(model, id)),
  }, h("span", { class: "role-dot" }), n.label);
}

export function attentionBadge(model, id) {
  const a = model.attention(id);
  return h("span", { class: `attn attn-${a.level}`, title: a.label }, a.label.split(":")[0]);
}

export function openNode(model, id) {
  const n = model.node(id);
  const st = model.stats(id);
  const a = model.attention(id);
  const touching = model.touching(id);
  const chains = model.chainsWith(id);
  openSheet(h("div", { class: "sheet-node", "--c": ROLES[n.role].colour },
    h("div", { class: "sheet-tags" }, rolePill(n.role, ROLES[n.role].name), attentionBadge(model, id)),
    h("h2", {}, n.label),
    h("p", { class: "sheet-line" }, n.line),
    h("div", { class: "sheet-stats" },
      stat(st.words, "words"), stat(st.votes, "votes"), stat(st.people, "of 5 people")),
    h("p", { class: "attn-note" }, h("strong", {}, "Today: "), a.note),
    section("From real sites since",
      model.evidenceFor(id).length
        ? model.evidenceFor(id).map((e) => findingCard(model, e, id))
        : h("p", { class: "muted" }, "Only the room's words so far. The first site that proves or disproves this part goes here.")),
    section("In the room's words",
      model.concepts(id).map((c) => conceptBlock(model, c, n.role))),
    touching.length ? section("Walked to and from",
      touching.map(({ link, out, other }) => h("div", { class: "touch" },
        h("div", { class: "touch-head" },
          h("span", { class: "touch-dir" }, out ? "leads to" : "comes from"),
          nodeChip(model, other),
          h("span", { class: "touch-n" }, `×${link.phrases.length}`)),
        phraseList(link.phrases)))) : null,
    chains.length ? section("On these chains",
      h("div", { class: "chain-links" },
        chains.map((c) => h("a", { class: "btn", href: `#loop/${c.id}` }, c.title)))) : null,
  ));
}

export function openHop(model, a, b) {
  const link = model.link(a, b);
  const phrases = link?.phrases ?? [];
  const people = new Set(phrases.map((p) => p.by));
  openSheet(h("div", { class: "sheet-hop" },
    h("div", { class: "eyebrow" }, "Why this link is on the map"),
    h("div", { class: "hop-title" }, nodeChip(model, a), h("span", { class: "hop-arrow" }, "→"), nodeChip(model, b)),
    h("p", { class: "sheet-line" },
      phrases.length
        ? `Walked ${plural(phrases.length, "time")} on 16th September, by ${plural(people.size, "person", "people")}.`
        : "Nobody walked this link on the day."),
    phraseList(phrases),
  ));
}

export function findingCard(model, e, except) {
  const others = e.nodes.filter((n) => n !== except);
  return h("div", { class: `finding reads-${e.reads}` },
    h("div", { class: "finding-head" },
      h("span", { class: "finding-mark" }, e.reads === "for" ? "For" : "Against"),
      h("strong", {}, e.site),
      h("span", { class: "finding-date" }, monthLabel(e.date))),
    h("p", {}, e.note),
    others.length ? h("div", { class: "finding-nodes" }, others.map((n) => nodeChip(model, n))) : null);
}

export function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function stat(n, label) {
  return h("div", { class: "stat" }, h("strong", {}, String(n)), h("span", {}, label));
}

function section(title, ...content) {
  return h("section", { class: "sheet-sec" }, h("h3", {}, title), ...content);
}

function conceptBlock(model, concept, nodeRole) {
  const differs = concept.room_role && concept.room_role !== nodeRole;
  return h("div", { class: "concept" },
    h("div", { class: "concept-head" },
      h("strong", {}, concept.label),
      differs ? h("span", { class: "concept-note" }, "the room put this in ", rolePill(concept.room_role)) : null),
    h("ul", { class: "words" },
      concept.words.map((id) => model.word(id)).sort((x, y) => y.votes - x.votes).map((w) => {
        const parent = w.parent ? model.word(w.parent) : null;
        return h("li", {},
          h("span", { class: "w-text" }, w.text),
          h("span", { class: "w-by" }, w.by),
          parent ? h("span", { class: "w-under" }, `under ${parent.text}`) : null,
          w.votes > 0 ? h("span", { class: "w-votes" }, plural(w.votes, "vote")) : null);
      })),
  );
}
