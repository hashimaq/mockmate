/**
 * Probe public schema via PostgREST (anon key). Prints table/column presence only.
 */
import fs from "fs";

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("MISSING_PUBLIC_SUPABASE_ENV");
  process.exit(1);
}

const required = [
  "profiles",
  "interviews",
  "questions",
  "answers",
  "reports",
  "seed_questions",
  "resumes",
  "resume_analysis",
  "voice_settings",
  "platform_settings",
  "platform_feedback",
];

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: "application/json",
};

console.log("project", new URL(url).host);
console.log("--- tables ---");

for (const table of required) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers,
  });
  const text = await res.text();
  let detail = "";
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j)) detail = `rows=${j.length}`;
    else if (j?.message) detail = j.message.slice(0, 120);
    else detail = text.slice(0, 120);
  } catch {
    detail = text.slice(0, 120);
  }
  console.log(`${table}: status=${res.status} ${detail}`);
}

// Column probes that often break interviews/resume pages
const columnChecks = [
  ["interviews", "target_company"],
  ["interviews", "status"],
  ["interviews", "user_id"],
  ["profiles", "role"],
  ["profiles", "status"],
  ["resumes", "analysis_status"],
  ["resume_analysis", "skills"],
];

console.log("--- columns ---");
for (const [table, col] of columnChecks) {
  const res = await fetch(
    `${url}/rest/v1/${table}?select=${col}&limit=1`,
    { headers },
  );
  const text = await res.text();
  let ok = res.status === 200;
  let msg = "";
  if (!ok) {
    try {
      msg = JSON.parse(text)?.message?.slice(0, 100) ?? text.slice(0, 100);
    } catch {
      msg = text.slice(0, 100);
    }
  }
  console.log(`${table}.${col}: ${ok ? "OK" : `MISSING/ERR ${msg}`}`);
}

// Storage bucket
const bucketRes = await fetch(`${url}/storage/v1/bucket/resumes`, { headers });
console.log("--- storage ---");
console.log(`bucket resumes: status=${bucketRes.status}`);
