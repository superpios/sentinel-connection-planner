const { buildPlan } = require("./core.js");
const { checkLive } = require("./livecheck.js");
async function main() {
  const country = process.argv[2];
  if (!country) { console.log("\nUsage: node verify.js \"<Country>\"\n"); return; }
  console.log(`\nBuilding plan for ${country}, then verifying nodes are live...`);
  const r = await buildPlan(country);
  if (!r.ok) { console.log("Error:", r.error, "\n"); return; }
  if (!r.primary) { console.log(`\nNo node found for ${country}.\n`); return; }
  if (r.viaNeighbour) console.log(`(via ${r.viaNeighbour})`);
  const all = [r.primary, ...r.backups];
  console.log(`Level ${r.level.toUpperCase()} | checking ${all.length} candidates live...\n`);
  let chosen = null;
  for (const p of all) {
    const live = await checkLive(p);
    const tag = live.live ? `LIVE ${live.ms}ms` : `down (${live.reason})`;
    console.log(`  ${live.live ? "[OK]  " : "[skip]"} ${p.moniker} via ${p.protocol}  -> ${tag}`);
    if (live.live && !chosen) chosen = { p, live };
  }
  console.log("");
  if (chosen) {
    const p = chosen.p;
    console.log(`>>> CONNECT TO: "${p.moniker}" via ${p.protocol}  [${p.confidence.level.toUpperCase()}]`);
    console.log(`    ${p.country} / ${p.city}  |  ${p.dl}/${p.ul} Mbps  |  verified live ${chosen.live.ms}ms`);
    console.log(`    addr: ${p.addr}\n`);
  } else {
    console.log(`>>> No candidate is live right now. History looked fine but none answered.\n`);
  }
}
main().catch(e => console.log("Error:", e.message));
