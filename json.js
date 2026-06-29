// ============================================================================
//  Sentinel Node Oracle - JSON face
//  Same core, machine-readable output. This is what an AI agent or another
//  program would call to get a connection plan it can act on.
//
//  Usage: node json.js "Germany"
// ============================================================================

const { buildPlan } = require("./core.js");

async function main() {
  const country = process.argv[2];
  if (!country) {
    console.log(JSON.stringify({ ok: false, error: "country argument required" }));
    return;
  }
  const r = await buildPlan(country);
  console.log(JSON.stringify(r, null, 2));
}

main().catch(e => console.log(JSON.stringify({ ok: false, error: e.message })));
