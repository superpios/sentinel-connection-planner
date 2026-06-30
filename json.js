const { buildPlan } = require("./core.js");
async function main() {
  const country = process.argv[2];
  if (!country) { console.log(JSON.stringify({ ok:false, error:"country argument required" })); return; }
  console.log(JSON.stringify(await buildPlan(country), null, 2));
}
main().catch(e => console.log(JSON.stringify({ ok:false, error:e.message })));
