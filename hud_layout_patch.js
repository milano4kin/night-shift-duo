const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "public", "style.css");
let css = fs.readFileSync(cssPath, "utf8");
const original = css;

const dockFrom = ".talent-dock,.talent-dock.collapsed{left:12px!important;right:auto!important;top:170px!important;bottom:auto!important;";
const dockTo = ".talent-dock,.talent-dock.collapsed{left:12px!important;right:auto!important;top:244px!important;bottom:auto!important;";
css = css.replace(dockFrom, dockTo);

const shortScreenFrom = "@media(max-height:720px){.talent-dock,.talent-dock.collapsed{top:142px!important;max-height:420px!important}.talent-dock.collapsed{max-height:58px!important}}";
const shortScreenTo = "@media(max-height:720px){.talent-dock,.talent-dock.collapsed{top:244px!important;max-height:min(420px,calc(100vh - 260px))!important}.talent-dock.collapsed{max-height:58px!important}}";
css = css.replace(shortScreenFrom, shortScreenTo);

if (css !== original) {
  fs.writeFileSync(cssPath, css, "utf8");
  console.log("HUD layout patch applied: talent dock now clears the kill-streak card.");
} else if (css.includes("top:244px!important")) {
  console.log("HUD layout patch already applied.");
} else {
  console.warn("HUD layout patch target was not found; style.css may have changed.");
}
