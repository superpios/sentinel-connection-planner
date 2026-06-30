const https = require("https");
const insecureAgent = new https.Agent({ rejectUnauthorized: false });
function checkLive(node, timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!node.remote || !node.remote.includes(":")) {
      return resolve({ live: false, reason: "no remote address" });
    }
    const [host, port] = node.remote.split(":");
    const start = Date.now();
    const req = https.request(
      { host, port, path: "/", method: "GET", agent: insecureAgent, timeout: timeoutMs },
      (res) => {
        let body = "";
        res.on("data", c => { if (body.length < 4000) body += c; });
        res.on("end", () => {
          const ms = Date.now() - start;
          if (res.statusCode !== 200) return resolve({ live: false, reason: `HTTP ${res.statusCode}`, ms });
          try {
            const j = JSON.parse(body);
            const addr = j && j.result && j.result.addr;
            if (j.success !== true) return resolve({ live: false, reason: "success:false", ms });
            if (node.addr && addr && addr !== node.addr)
              return resolve({ live: false, reason: "addr mismatch", ms });
            return resolve({ live: true, ms, addr });
          } catch {
            return resolve({ live: false, reason: "bad JSON", ms });
          }
        });
      }
    );
    req.on("error", e => resolve({ live: false, reason: e.code || "error", ms: Date.now() - start }));
    req.on("timeout", () => { req.destroy(); resolve({ live: false, reason: "timeout", ms: Date.now() - start }); });
    req.end();
  });
}
module.exports = { checkLive };
