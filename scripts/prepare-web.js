const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "native-web");
const files = [
  "index.html",
  "styles.css",
  "planboard-domain.js",
  "planner-utils.js",
  "portfolio-utils.js",
  "planboard-api-client.js",
  "app.js",
  "firebase-adapter.js",
  "config.js",
  "sw.js",
  "manifest.webmanifest",
];
const folders = ["icons"];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(outDir, file));
}

for (const folder of folders) {
  fs.cpSync(path.join(root, folder), path.join(outDir, folder), { recursive: true });
}

const hash = crypto.createHash("sha256");
for (const file of files.filter((file) => file !== "sw.js")) {
  hash.update(fs.readFileSync(path.join(outDir, file)));
}
for (const file of fs.readdirSync(path.join(outDir, "icons")).sort()) {
  hash.update(fs.readFileSync(path.join(outDir, "icons", file)));
}
const cacheVersion = hash.digest("hex").slice(0, 12);
const swPath = path.join(outDir, "sw.js");
fs.writeFileSync(
  swPath,
  fs.readFileSync(swPath, "utf8").replace("__PLANBOARD_CACHE_VERSION__", cacheVersion)
);

console.log(`Prepared native web assets in ${outDir}`);
