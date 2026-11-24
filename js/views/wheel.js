import { h, s, ROLES } from "../dom.js?v=20261124124457";
import { openHop, openNode } from "./evidence.js?v=20261124124457";

/* A loop chain drawn as a wheel. Coordinates live in a fixed 760 by 640
   box; nodes are HTML placed by percentage over one SVG of arcs, so text
   wraps naturally and the whole thing scales with the card. Feeds (a node
   that pushes into the loop or a branch out of it) sit outside the ring. */

const W = 760;
const H = 640;
const C = { x: W / 2, y: H / 2 };
const R = 190;
const FEED_R = 292;
const GAP = 0.42;

const at = (angle, r) => ({ x: C.x + r * Math.cos(angle), y: C.y + r * Math.sin(angle) });
const pct = (p) => ({ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` });

export function wheel(model, chain) {
  const n = chain.nodes;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n.length;
  const place = new Map(n.map((id, i) => [id, { angle: angle(i), p: at(angle(i), R) }]));
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "wheel-svg", "aria-hidden": "true" },
    s("defs", {},
      s("marker", { id: "arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" },
        s("path", { d: "M0,0 L10,5 L0,10 z", fill: "#86868b" }))),
    s("circle", { cx: C.x, cy: C.y, r: R, class: "wheel-ring" }));
  const layer = h("div", { class: "wheel-layer" });

  model.hops(chain).forEach(([a, b], i) => {
    const a0 = place.get(a).angle;
    let a1 = place.get(b).angle;
    if (a1 <= a0) a1 += 2 * Math.PI;
    const from = at(a0 + GAP, R);
    const to = at(a1 - GAP, R);
    const large = a1 - a0 - 2 * GAP > Math.PI ? 1 : 0;
    svg.append(s("path", {
      d: `M${from.x},${from.y} A${R},${R} 0 ${large} 1 ${to.x},${to.y}`,
      class: "wheel-arc", style: `animation-delay:${i * 0.6}s`, "marker-end": "url(#arrow)",
    }));
    layer.append(hopTag(model, a, b, at((a0 + a1) / 2, R + 34)));
  });

  (chain.feeds ?? []).forEach(([a, b]) => {
    const inward = place.has(b);
    const anchor = place.get(inward ? b : a);
    const outside = at(anchor.angle, FEED_R);
    const near = at(anchor.angle, R + 58);
    const far = at(anchor.angle, FEED_R - 40);
    const [x1, y1, x2, y2] = inward ? [far.x, far.y, near.x, near.y] : [near.x, near.y, far.x, far.y];
    svg.append(s("line", { x1, y1, x2, y2, class: "wheel-feed", "marker-end": "url(#arrow)" }));
    layer.append(nodeTag(model, inward ? a : b, outside, "feed"));
    layer.append(hopTag(model, a, b, at(anchor.angle + 0.16, (R + FEED_R) / 2 + 6)));
  });

  n.forEach((id, i) => layer.append(nodeTag(model, id, place.get(id).p, "ring", i * 0.6)));
  return h("div", { class: "wheel", style: { aspectRatio: `${W} / ${H}` } }, svg, layer);
}

function nodeTag(model, id, p, kind, delay = 0) {
  const node = model.node(id);
  return h("button", {
    class: `wheel-node ${kind}`,
    type: "button",
    style: { ...pct(p), animationDelay: `${delay}s` },
    "--c": ROLES[node.role].colour,
    onclick: () => openNode(model, id),
  }, h("span", { class: "wheel-role" }, ROLES[node.role].short), h("span", { class: "wheel-label" }, node.label));
}

function hopTag(model, a, b, p) {
  const n = model.link(a, b)?.phrases.length ?? 0;
  return h("button", {
    class: "wheel-hop",
    type: "button",
    style: pct(p),
    title: "See the words behind this link",
    onclick: () => openHop(model, a, b),
  }, `×${n}`);
}
