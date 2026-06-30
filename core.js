const LATEST_URL  = "https://superpios.github.io/node-scorecard/latest.json";
const HISTORY_URL = "https://superpios.github.io/node-scorecard/history-summary.json";

const CENSORSHIP = {
  "china": "heavy", "iran": "heavy", "russia": "heavy", "belarus": "heavy",
  "turkmenistan": "heavy", "north korea": "heavy", "myanmar": "heavy",
  "saudi arabia": "heavy", "vietnam": "heavy", "cuba": "heavy",
  "turkey": "medium", "egypt": "medium", "united arab emirates": "medium",
  "pakistan": "medium", "india": "medium", "indonesia": "medium",
  "iraq": "medium", "kazakhstan": "medium", "thailand": "medium", "jordan": "medium",
};
const ALIASES = {
  "uae": "united arab emirates", "u.a.e.": "united arab emirates",
  "iran, islamic republic of": "iran", "russian federation": "russia",
  "korea, democratic people's republic of": "north korea", "viet nam": "vietnam",
};
const NEIGHBOURS = {
  "iran": ["Turkey", "United Arab Emirates", "Germany"],
  "china": ["Japan", "Singapore", "United States"],
  "north korea": ["Japan", "South Korea", "United States"],
  "turkmenistan": ["Turkey", "Kazakhstan", "Germany"],
  "belarus": ["Poland", "Lithuania", "Germany"],
  "cuba": ["United States", "Mexico", "Spain"],
  "iraq": ["Turkey", "Jordan", "United Arab Emirates"],
};
const STRATEGY = {
  heavy:  ["reality", "amneziawg", "hysteria2", "v2ray", "wireguard"],
  medium: ["amneziawg", "reality", "v2ray", "hysteria2", "wireguard"],
  light:  ["wireguard", "hysteria2", "v2ray", "reality", "amneziawg"],
};
const MIN_UPTIME = 90, MIN_STAB = 80, MIN_SAMPLES = 12;

function normCountry(c){ if(!c || typeof c !== "string") return ""; const k=c.toLowerCase().trim(); return ALIASES[k]||k; }
function levelOf(c){ return CENSORSHIP[normCountry(c)] || "light"; }
function protoScore(p,order){ if(!p) return -1; const i=order.indexOf((p||"").toLowerCase()); return i===-1?-1:(order.length-i); }

function confidenceOf(h, order, proto) {
  if (!h || h.stale) return { level: "low", why: "no usable history for this node" };
  const protoIdeal = order.indexOf((proto||"").toLowerCase()) <= 1;
  if (h.uptime >= 99 && h.stab >= 95 && h.n >= 100)
    return { level: protoIdeal ? "high" : "medium", why: protoIdeal ? "strong history + ideal protocol" : "strong history, protocol not ideal here" };
  if (h.uptime >= MIN_UPTIME && h.stab >= MIN_STAB && h.n >= MIN_SAMPLES)
    return { level: "medium", why: "decent history" };
  return { level: "low", why: "weak history" };
}

function rankForCountry(nodes, H, country, order) {
  const target = normCountry(country);
  if (!target) return [];
  return nodes
    .filter(n => n.country && normCountry(n.country)===target && n.status==="active" && n.api_ok===true)
    .map(n => ({ n, h: H[n.addr] || null }))
    .filter(({h}) => h && !h.stale && h.uptime>=MIN_UPTIME && h.stab>=MIN_STAB && h.n>=MIN_SAMPLES)
    .sort((a,b) => {
      const ps = protoScore(b.n.protocol,order) - protoScore(a.n.protocol,order);
      if (ps!==0) return ps;
      const sa=a.h?a.h.sc:0, sb=b.h?b.h.sc:0;
      if (sb!==sa) return sb-sa;
      return (b.n.dl_mbps||0)-(a.n.dl_mbps||0);
    });
}

function shape(order) {
  return ({n,h}) => ({
    moniker:n.moniker, addr:n.addr, remote:n.remote, protocol:n.protocol, country:n.country,
    dl:Math.round(n.dl_mbps), ul:Math.round(n.ul_mbps), priceGb:n.price_gb, city:n.city,
    confidence: confidenceOf(h, order, n.protocol),
    history: h ? { uptime:h.uptime, stability:h.stab, transitions:h.trans, samples:h.n } : null,
  });
}

async function buildPlan(country) {
  if (!country || typeof country !== "string" || !country.trim()) {
    return { ok:false, error:"invalid country: provide a non-empty country name" };
  }
  const level = levelOf(country);
  const order = STRATEGY[level];
  const [lr, hr] = await Promise.all([fetch(LATEST_URL), fetch(HISTORY_URL)]);
  if (!lr.ok) return { ok:false, error:`latest HTTP ${lr.status}` };
  if (!hr.ok) return { ok:false, error:`history HTTP ${hr.status}` };
  const nodes = await lr.json(), hist = await hr.json();
  const H = {}; for (const h of hist) H[h.a] = h;
  let ranked = rankForCountry(nodes, H, country, order);
  let viaNeighbour = null;
  if (ranked.length === 0) {
    for (const nb of (NEIGHBOURS[normCountry(country)] || [])) {
      const r = rankForCountry(nodes, H, nb, order);
      if (r.length) { ranked = r; viaNeighbour = nb; break; }
    }
  }
  const plan = ranked.slice(0, 4).map(shape(order));
  return { ok:true, country, level, strategy:order, viaNeighbour, primary:plan[0]||null, backups:plan.slice(1), total:nodes.length };
}

module.exports = { buildPlan, levelOf, normCountry, confidenceOf };
