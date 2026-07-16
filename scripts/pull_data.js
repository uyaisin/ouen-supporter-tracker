// Apps Script（シート集計）のJSONを取得して data.json を更新する。
// 取得先URLは scripts/config.json の dataEndpoint、または環境変数 DATA_ENDPOINT。
// 未設定/取得失敗のときは既存の data.json を保持して静かに終了（パイプラインは止めない）。
//
// ★このトラッカーの肝：取得した新しい人数と、いま手元の data.json の人数を比べて
//   「増えた分（delta）」を自動計算し保存する。→ HTML側で「福岡 +3人！」の演出に使う。
//   期待するリモート応答: { "prefs": { "東京":12, "福岡":9, ... } }（都道府県→サポーター数）
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");

function getEndpoint() {
  if (process.env.DATA_ENDPOINT) return process.env.DATA_ENDPOINT;
  const cfgPath = path.join(__dirname, "config.json");
  if (fs.existsSync(cfgPath)) {
    try { return JSON.parse(fs.readFileSync(cfgPath, "utf8")).dataEndpoint || ""; } catch {}
  }
  return "";
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error("JSONではない応答: " + body.slice(0, 120))); }
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
  });
}

function toNum(v) { return Number(v) || 0; }

(async () => {
  const endpoint = getEndpoint();
  if (!endpoint) {
    console.log("dataEndpoint 未設定 → 既存 data.json を保持（サンプルデータのまま）");
    return;
  }
  try {
    const remote = await fetchJson(endpoint);
    if (!remote || typeof remote !== "object" || !remote.prefs) {
      throw new Error("prefs が無い応答");
    }
    const dataPath = path.join(ROOT, "data.json");
    let base = { prefs: {}, goal: 1000 };
    if (fs.existsSync(dataPath)) { try { base = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch {} }

    const oldPrefs = base.prefs || {};
    const newPrefs = {};
    for (const [k, v] of Object.entries(remote.prefs)) newPrefs[k] = toNum(v);

    // 増えた分を計算（新しい人数 - 前回の人数、プラスのみ）
    const delta = {};
    for (const [k, v] of Object.entries(newPrefs)) {
      const diff = v - toNum(oldPrefs[k]);
      if (diff > 0) delta[k] = diff;
    }

    const merged = {
      goal: remote.goal || base.goal || 1000,
      updated: "auto",
      prefs: newPrefs,
      delta,
    };
    fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2) + "\n");
    const total = Object.values(newPrefs).reduce((a, b) => a + b, 0);
    const upN = Object.keys(delta).length;
    console.log(`data.json 更新: 合計 ${total}人 / 増えた県 ${upN}`);
  } catch (e) {
    console.error("取得失敗（既存 data.json を保持）:", e.message);
    process.exitCode = 0; // パイプラインは止めない
  }
})();
