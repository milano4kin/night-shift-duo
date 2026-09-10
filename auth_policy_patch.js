"use strict";

const fs = require("fs");
const path = require("path");

function patchFile(file, replacements) {
  const target = path.join(__dirname, file);
  let source = fs.readFileSync(target, "utf8");
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      source = source.replace(from, to);
      changed = true;
    }
  }

  if (changed) fs.writeFileSync(target, source, "utf8");
}

// Keep existing test accounts usable for login, but require 8+ characters
// for every newly created password.
patchFile("server.js", [
  [
    'function validPassword(v){return typeof v==="string"&&v.length>=6&&v.length<=72;}',
    'function validPassword(v){return typeof v==="string"&&v.length>=8&&v.length<=72;}'
  ],
  [
    'if(!validPassword(password))return {error:"Пароль должен быть от 6 до 72 символов"};',
    'if(!validPassword(password))return {error:"Пароль должен быть от 8 до 72 символов"};'
  ],
  [
    'if(!a||!validPassword(password))return null;',
    'if(!a||typeof password!=="string"||password.length<1||password.length>72)return null;'
  ]
]);

patchFile("public/index.html", [
  [
    'id="loginUsername" maxlength="24" autocomplete="username" placeholder="например milano4kin"',
    'id="loginUsername" maxlength="24" autocomplete="username" placeholder="например Krytoi228"'
  ],
  [
    'id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="минимум 6 символов"',
    'id="loginPassword" type="password" maxlength="72" autocomplete="current-password" placeholder="не менее 8 символов"'
  ],
  [
    'id="registerUsername" maxlength="24" autocomplete="username" placeholder="a-z, цифры, _"',
    'id="registerUsername" maxlength="24" autocomplete="username" placeholder="например Krytoi228"'
  ],
  [
    'id="registerPassword" type="password" maxlength="72" autocomplete="new-password" placeholder="минимум 6 символов"',
    'id="registerPassword" type="password" minlength="8" maxlength="72" autocomplete="new-password" placeholder="не менее 8 символов"'
  ],
  [
    'Тестовая v8: аккаунты пока хранятся на сервере. Перед публичным релизом перенесём их в постоянную БД.',
    'Прогресс аккаунта сохраняется на сервере в базе данных.'
  ]
]);
