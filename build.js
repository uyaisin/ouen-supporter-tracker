// data.json（都道府県ごとのサポーター数）から supporter-tracker.html を生成する。
// data.json が無ければ全県ゼロで生成（初期状態）。
// 使い方: node build.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function loadData() {
  const p = path.join(ROOT, "data.json");
  if (!fs.existsSync(p)) return { prefs: {}, delta: {}, goal: 1000 };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error("data.json の読み込みに失敗:", e.message, "→ 全県ゼロで生成します");
    return { prefs: {}, delta: {}, goal: 1000 };
  }
}

function todayISO() {
  const n = new Date();
  const z = (x) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${z(n.getMonth() + 1)}-${z(n.getDate())}`;
}

function main() {
  const data = loadData();
  const prefs = data.prefs || {};
  const delta = data.delta || {};
  const goal = data.goal || 1000;
  const updated = data.updated && data.updated !== "auto" ? data.updated : todayISO();

  const template = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
  const html = template
    .replace(/__DATA__/g, JSON.stringify(prefs))
    .replace(/__DELTA__/g, JSON.stringify(delta))
    .replace(/__GOAL__/g, String(goal))
    .replace(/__UPDATED__/g, updated);

  fs.writeFileSync(path.join(ROOT, "supporter-tracker.html"), html);
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
  const total = Object.values(prefs).reduce((a, b) => a + (Number(b) || 0), 0);
  console.log(`built supporter-tracker.html（合計 ${total}人 / 目標 ${goal}人・更新 ${updated}）`);
}

main();
