import { put } from "@vercel/blob";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, relative } from "node:path";

const [summaryPath, artifactDir] = process.argv.slice(2);
const dashboardUrl = process.env.TEST_DASHBOARD_URL;
const secret = process.env.TEST_DASHBOARD_UPLOAD_SECRET;
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!summaryPath || !artifactDir || !dashboardUrl || !secret || !token) throw new Error("Usage: node scripts/upload-test-run.mjs <summary.json> <artifact-dir>; set TEST_DASHBOARD_URL, TEST_DASHBOARD_UPLOAD_SECRET and BLOB_READ_WRITE_TOKEN.");
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const expiryStatus = summary.compatibility_status ?? summary.functional_status;
const days = /FAIL|REVIEW|BLOCKED/i.test(expiryStatus) ? 180 : 30;
const expiry = new Date(); expiry.setUTCDate(expiry.getUTCDate() + days);
const root = `runs/${expiry.toISOString().slice(0, 10)}/${summary.run_id}`;
async function files(dir) { const entries = await readdir(dir); const all = await Promise.all(entries.map(async (name) => { const p = join(dir, name); return (await stat(p)).isDirectory() ? files(p) : [p]; })); return all.flat(); }
const artifactPaths = [];
for (const file of await files(artifactDir)) {
  if (file === summaryPath) continue;
  const pathname = `${root}/artifacts/${relative(artifactDir, file).replaceAll("\\", "/")}`;
  await put(pathname, await readFile(file), { access: "private", token, addRandomSuffix: false });
  artifactPaths.push(pathname);
}
const response = await fetch(`${dashboardUrl.replace(/\/$/, "")}/api/runs`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${secret}` }, body: JSON.stringify({ ...summary, artifact_paths: artifactPaths }) });
if (!response.ok) throw new Error(`Run registration failed: ${response.status} ${await response.text()}`);
console.log(`Uploaded ${artifactPaths.length} artifacts for ${summary.run_id}; retention: ${days} days.`);
