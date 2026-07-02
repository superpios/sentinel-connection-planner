# Sentinel Connection Planner

Given a country, returns a ready-to-use connection plan for the Sentinel dVPN network: a primary node plus ordered backups, each with a confidence level, chosen from nodes that are both active now and reliable over time, and optionally verified to be live right now.

If a censored country has no nodes of its own, the planner falls back to a usable neighbour instead of a dead end.

Built on the [Node Scorecard](https://superpios.github.io/node-scorecard), which has been sampling the whole network on a schedule for weeks. The reliability scores come from that history, not from a single snapshot.

## Why a snapshot is not enough

Asking "which node is fast right now" is easy and wrong. A node can look fast this second and be gone the next. What matters is which node has been reliable over days, and that requires having measured it over days.

This planner joins two live data sources:

- latest.json - who is active now (protocol, country, speed, remote address)
- history-summary.json - uptime and stability measured over the sampling window

It picks the node that is active now AND clears the history bars (uptime, stability, enough samples), ranks by protocol fit for the country censorship level, then by reliability, then by speed.

## Plan, or plan + live verification

Two CLI faces:

    node cli.js "Germany"      # the plan: primary + backups, with confidence
    node verify.js "Germany"   # the plan, then live-checks each node and
                               # presents the first one that is actually up now

For machine use:

    node json.js "Iran"        # the same plan as JSON, for an agent or program

## How live verification works

verify.js contacts each candidate node directly at https://host:port/ and accepts it only if it returns success:true AND the on-chain address it reports matches the address the planner expects. This catches nodes that look healthy in history but are down this second, and prevents a reassigned IP from impersonating a node. Sentinel nodes use self-signed certificates on their API port, which the check accepts - it is a liveness probe, no secrets are sent.

## Exit evidence (does the node actually route?)

A node can be active, answer its API, and even accept a paid session, yet still
not route your traffic. "Reachable" is not "routes". To catch this without
paying to find out, the planner reads a signal from the measured history:
`p_pos` - the share of samples in which the node had real peers connected.

A node that has consistently had clients connected is a node that actually
carries traffic. The planner ranks these first (after protocol fit), and each
pick reports `exit-evidence`: the peer percentage and whether it likely routes.
Nodes that answer the API but never hold peers are ranked below and flagged as
weak, so you try the proven ones first.

This does not replace a live end-to-end check, but it turns the whole Scorecard
history into a cheap, pre-payment filter for nodes that really work.

## Censorship-aware protocol strategy

Censorship levels (heavy / medium / light) are derived from [Freedom House - Freedom on the Net 2025](https://freedomhouse.org/report/freedom-net). For each level the planner prefers protocols in this order (also the fallback order):

- heavy:  REALITY > AmneziaWG > Hysteria2 > V2Ray > WireGuard
- medium: AmneziaWG > REALITY > V2Ray > Hysteria2 > WireGuard
- light:  WireGuard > Hysteria2 > V2Ray > REALITY > AmneziaWG

The network today runs almost entirely on V2Ray and WireGuard. The anti-censorship protocols (REALITY, AmneziaWG, Hysteria2) are ranked highest for censored countries but are not yet present on the network, so the planner picks the best available and tells you the protocol is not ideal. That gap is the point.

## Geographic fallback

For a censored country with no in-country nodes, the planner tries reachable neighbours commonly used to serve that region (e.g. Iran to Turkey/UAE/Germany, China to Japan/Singapore/US). These are entry points, not a claim about borders. The map is simple and extendable.

## Run it

Requires Node.js 18+ (built-in fetch). No install, no dependencies.

    node cli.js "Germany"
    node verify.js "Germany"
    node json.js "Iran"

## Files

- core.js      - selection logic; returns a plan object, prints nothing
- cli.js       - prints the plan
- verify.js    - prints the plan, then live-checks each node
- livecheck.js - the live-check module (used by verify.js)
- json.js      - machine-readable JSON output

## Honest limitations

- Censorship levels and neighbour maps are simplified. Real censorship varies by region, ISP, and time. Treat them as heuristics.
- Country names come from IP geolocation and may not match the keys used here. Aliases are handled in a small dictionary; PRs welcome.
- The planner ranks, plans, and checks liveness. It does not connect. Opening a tunnel, switching protocols at runtime, or paying for a session is out of scope here - this is the decision layer, not the transport layer.
- This is research / measurement tooling, not a VPN client and not financial or security advice.

## License

MIT
