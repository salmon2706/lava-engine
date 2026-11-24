/* The one detail panel: slides in from the right on a desk, fills the
   screen on a phone. Escape, the scrim or the cross closes it. */

const sheet = document.getElementById("sheet");
const body = document.getElementById("sheet-body");

export function openSheet(content) {
  body.replaceChildren(content);
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add("open"));
  sheet.querySelector(".sheet-panel").scrollTop = 0;
}

export function closeSheet() {
  sheet.classList.remove("open");
  window.setTimeout(() => {
    if (!sheet.classList.contains("open")) sheet.hidden = true;
  }, 240);
}

sheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeSheet();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !sheet.hidden) closeSheet();
});
