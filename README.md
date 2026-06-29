cd ~\Desktop\sentinel-node-oracle
@'
# Sentinel Connection Planner

Given a country, returns a ready-to-use connection plan for the Sentinel dVPN network: a primary node plus ordered backups, each with a confidence level, chosen from nodes that are both active now and reliable over time.

If a censored country has no nodes of its own, the planner falls back to a usable neighbour instead of a dead end.

Built on the [Node Scorecard](https://superpios.github.io/node-scorecard), which has been sampling the whole network on a schedule for weeks. The reliability scores come from that history, not from a single snapshot.

## Why a snapshot is not enough

Asking "which node is fast right now" is easy and wrong. A node can look fast this second and be gone the next. What matters is which node has been reliable over days, and that requires having measured it over days.

This planner joins two live data sources:

- latest.json - who is active now (protocol, country, speed)
- history-summary.json - uptime and stability measured over the sampling window

It picks the node that is active now AND clears the history bars (uptime, stability, enough samples), ranks by protocol fit for the country censorship level, then by reliability, then by speed.

## What you get back

    node cli.js "Germany"

A primary pick plus backups, each labelled with a confidence level and the reason for it. For machine use:

    node json.js "Iran"

returns the same plan as JSON, ready for an agent or another program to act on.

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
    node cli.js "Iran"
    node json.js "Germany"

## Honest limitations

- Censorship levels and neighbour maps are simplified. Real censorship varies by region, ISP, and time. Treat them as heuristics.
- Country names come from IP geolocation and may not match the keys used here. Aliases are handled in a small dictionary; PRs welcome.
- The planner ranks and plans. It does not connect. Opening a tunnel, switching protocols at runtime, or paying for a session is out of scope here - this is the decision layer, not the transport layer.
- This is research / measurement tooling, not a VPN client and not financial or security advice.

## License

MIT
'@ | Set-Content -Encoding utf8 README.md
