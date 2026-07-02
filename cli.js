const { buildPlan } = require("./core.js");
async function main() {
  const country = process.argv[2];
  if (!country) { console.log("\nUsage: node cli.js \"<Country>\"\n"); return; }
  console.log(`\nBuilding connection plan for ${country}...`);
  const r = await buildPlan(country);
  if (!r.ok) { console.log("Error:", r.error, "\n"); return; }
  console.log(`Level: ${r.level.toUpperCase()}  |  strategy: ${r.strategy.join(" > ")}`);
  if (r.viaNeighbour) console.log(`No reliable node IN ${country}. Falling back via ${r.viaNeighbour}.`);
  if (!r.primary) { console.log(`\nNo usable node found.\n`); return; }
  const show = (label, p) => {
    console.log(`\n  ${label}: "${p.moniker}" via ${p.protocol}  [${p.confidence.level.toUpperCase()}]`);
    console.log(`         ${p.country} / ${p.city}  |  ${p.dl}/${p.ul} Mbps  |  ${p.priceGb} udvpn/GB`);
    if (p.history) console.log(`         uptime ${p.history.uptime}% | ${p.history.transitions} flaps | ${p.history.samples} samples`);
    if (p.exitEvidence && p.exitEvidence.peerPercent!=null) console.log(`         exit-evidence: had peers in ${p.exitEvidence.peerPercent}% of samples ${p.exitEvidence.likelyRoutes?"(likely routes)":"(weak - may not route)"}`);
  };
  show("PRIMARY", r.primary);
  r.backups.forEach((b,i) => show(`BACKUP ${i+1}`, b));
  console.log("");
}
main().catch(e => console.log("Error:", e.message));
