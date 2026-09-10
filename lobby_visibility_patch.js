"use strict";

const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "public", "client.js");
let source = fs.readFileSync(target, "utf8");
const original = source;

source = source.replace(
  'accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");syncAccountUi();send("getMeta");',
  'accountState=m.account||accountState;$("authOverlay")?.classList.remove("visible");$("lobbySideActions")?.classList.add("visible");syncAccountUi();send("getMeta");'
);

source = source.replace(
  '  lobby.classList.add("visible");\n  $("indexBookBtn")?.classList.add("visible");',
  '  lobby.classList.add("visible");\n  $("indexBookBtn")?.classList.add("visible");\n  $("lobbySideActions")?.classList.add("visible");'
);

source = source.replace(
  '$("indexBookBtn")?.classList.remove("visible");$("codesOverlay")?.classList.remove("visible");',
  '$("indexBookBtn")?.classList.remove("visible");$("codesOverlay")?.classList.remove("visible");$("lobbySideActions")?.classList.remove("visible");'
);

if (source !== original) {
  fs.writeFileSync(target, source, "utf8");
  console.log("Lobby visibility patch applied: INDEX and CODES show immediately after login.");
} else if (source.includes('$("lobbySideActions")?.classList.add("visible")')) {
  console.log("Lobby visibility patch already applied.");
} else {
  console.warn("Lobby visibility patch target was not found.");
}
