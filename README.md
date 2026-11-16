# Tactical Strike — threejs-fps-02

Round-based tactical FPS with economy, bots, bomb defusal. Built for the **threejs-fps-02** bounty ($1,000 USDC).

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/mnur9868/tactical-fps-v2/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/mnur9868/tactical-fps-v2/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

## Features

- **Round-based gameplay** — 24 rounds, half-time at 13, first to 13 wins
- **Economy system** — Earn money from kills/rounds, buy weapons/armor/utility each round
- **9 AI bots** — Distinct personalities (aggressive, balanced, defensive, support, awper, entry, clutcher) with roles (entry, anchor, rotator, awper, support, lurker, bomb)
- **27 weapons** — Pistols, SMGs, rifles, snipers, shotguns, LMGs with accurate CS-style stats
- **Bomb defusal** — Plant/defuse with kit, 40s timer, 5s/10s defuse
- **Buy menu** — Full CS-style buy phase with categories
- **Sound effects** — Procedural audio for hits, kills, buys, plant/defuse
- **HUD** — Health/armor, ammo, money, round timer, kill feed, scoreboard, bomb status

## Run locally

```bash
mkdir -p out
MAKEFUN_INPUT_DIR=/root/makefun/threejs-fps-02-kit/input MAKEFUN_OUTPUT_DIR=out node main.ts
# Open game/index.html in a browser, or serve with `node serve.ts`
```

## Structure

```
├── main.ts                    # Entry point: copies game/ → /output, writes dossier.json
├── game/
│   ├── index.html             # Game page with importmap for three.js 0.187.0
│   ├── vendor/three/          # three.module.min.js + three.core.min.js (0.187.0)
│   ├── screenshots/           # 3 renders (1-start.jpg, 2-play.jpg, 3-end.jpg)
│   └── src/
│       ├── main.js            # Game loop, round logic, input, shooting
│       ├── weapon.js          # 27 weapons, view models, reload, spread
│       ├── bots.js            # 9 bots, 7 personalities, 5+ roles, nav mesh
│       ├── world.js           # Map, colliders, bomb sites, lighting
│       ├── player.js          # Movement, collision, crouch/sprint/jump
│       ├── input.js           # Pointer lock, keyboard, mouse
│       ├── hud.js             # All UI: health, ammo, money, buy menu, scoreboard
│       └── palette.js         # Color constants
└── vendor/
    └── makefun-threejs.ts     # Dossier builder (vendored from kit)
```

## Requirements

- Node.js 22.18+
- Desktop browser with WebGL 2 (Chrome recommended)
- No network, no build step, pure ES modules

Built by an AI agent (Hermes Agent) for [make.fun/bounty/threejs-fps-02](https://make.fun/bounty/threejs-fps-02).