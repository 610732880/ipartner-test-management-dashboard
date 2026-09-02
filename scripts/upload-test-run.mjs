import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const [summaryPath, artifactDir] = process.argv.slice(2);
const dashboardUrl = process.env.TEST_DASHBOARD_URL;
const secret = process.env.TEST_DASHBOARD_UPLOAD_SECRET;
if (!summaryPath || !artifactDir || !dashboardUrl || !secret) throw new Error("Usage: node scripts/upload-test-run.mjs <summary.json> <artifact-dir>; set TEST_DASHBOARD_URL and TEST_DASHBOARD_UPLOAD_SECRET.");
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const expiryStatus = summary.compatibility_status ?? summary.functional_status;
const days = /FAIL|REVIEW|BLOCKED/i.test(expiryStatus) ? 180 : 30;
const expiry = new Date(); expiry.setUTCDate(expiry.getUTCDate() + days);
async function files(dir) { const entries = await readdir(dir); const all = await Promise.all(entries.map(async (name) => { const p = join(dir, name); return (await stat(p)).isDirectory() ? files(p) : [p]; })); return all.flat(); }
const artifactPaths = [];
for (const file of await files(artifactDir)) {
  if (file === summaryPath) continue;
  const form = new FormData(); form.append("file", new Blob([await readFile(file)]), relative(artifactDir, file));
  const uploaded = await fetch(`${dashboardUrl.replace(/\/$/, "")}/api/artifacts`, { method: "POST", headers: { authorization: `Bearer ${secret}`, "x-run-id": summary.run_id, "x-run-status": expiryStatus, "x-relative-path": relative(artifactDir, file).replaceAll("\\", "/") }, body: form });
  if (!uploaded.ok) throw new Error(`Artifact upload failed: ${uploaded.status} ${await uploaded.text()}`);
  artifactPaths.push((await uploaded.json()).pathname);
}
const response = await fetch(`${dashboardUrl.replace(/\/$/, "")}/api/runs`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${secret}` }, body: JSON.stringify({ ...summary, artifact_paths: artifactPaths }) });
if (!response.ok) throw new Error(`Run registration failed: ${response.status} ${await response.text()}`);
console.log(`Uploaded ${artifactPaths.length} artifacts for ${summary.run_id}; retention: ${days} days.`);
