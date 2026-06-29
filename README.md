# Sentinel Node Oracle

Given a country, returns a ready-to-use **connection plan** for the Sentinel dVPN network: a primary node plus ordered backups, each with a confidence level, chosen from nodes that are **both active now and reliable over time**.

If a censored country has no nodes of its own, the oracle falls back to a usable neighbour instead of returning a dead end.

Built on the [Node Scorecard](https://superpios.github.io/node-scorecard), which has been sampling the whole network on a schedule for weeks. The reliability scores come from that history, not from a single snapshot.

## Why a snapshot is not enough

Asking "which node is fast right now" is easy and wrong. A node can look fast this second and be gone the next. What matters is which node has been **reliable over days** — and that requires having measured it over days.

This oracle joins two live data sources:

- `latest.json` — who is active now (protocol, country, speed)
- `history-summary.json` — uptime and stability measured over the sampling window

It picks the node that is active now **and** clears the history bars (uptime, stability, enough samples), ranks by protocol fit for the country's censorship level, then by reliability, then by speed.

## What you get back

```
node cli.js "Germany"
```

A primary pick plus backups, each labelled with a confidence level and the reason for it. Example shape:

- `PRIMARY` / `BACKUP n` — node moniker, protocol, country, speed, price
- `confidence` — `high` / `medium` / `low`, with a one-line reason
- `history` — uptime %, number of state transitions, sample count

For machine use:

```
node json.js "Iran"
```

returns the same plan as JSON, ready for an agent or another program to act on.

## Censorship-aware protocol strategy

Censorship levels (`heavy` / `medium` / `light`) are derived from [Freedom House — Freedom on the Net 2025](https://freedomhouse.org/report/freedom-net). For each level the oracle prefers protocols in this order (also the fallback order):

- `heavy`: REALITY → AmneziaWG → Hysteria2 → V2Ray → WireGuard
- `medium`: AmneziaWG → REALITY → V2Ray → Hysteria2 → WireGuard
- `light`: WireGuard → Hysteria2 → V2Ray → REALITY → AmneziaWG

Note: the network today runs almost entirely on V2Ray and WireGuard. The anti-censorship protocols (REALITY, AmneziaWG, Hysteria2) are ranked highest for censored countries but are not yet present on the network — so the oracle will pick the best available and tell you the protocol is not ideal. That gap is the point.

## Geographic fallback

For a censored country with no in-country nodes, the oracle tries reachable neighbours commonly used to serve that region (e.g. Iran → Turkey/UAE/Germany, China → Japan/Singapore/US). These are entry points, not a claim about borders. The map is simple and extendable.

## Run it

Requires Node.js 18+ (built-in `fetch`). No install, no dependencies.

```
node cli.js "Germany"
node cli.js "Iran"
node json.js "Germany"
```

## Honest limitations

- **Censorship levels and neighbour maps are simplified.** Real censorship varies by region, ISP, and time. Treat them as heuristics.
- **Country names** come from IP geolocation and may not match the keys used here. Aliases are handled in a small dictionary; PRs welcome.
- **The oracle ranks and plans. It does not connect.** Actually opening a tunnel, switching protocols at runtime, or paying for a session is out of scope here — this is the decision layer, not the transport layer.
- This is **research / measurement tooling**, not a VPN client and not financial or security advice.

## License

MIT
