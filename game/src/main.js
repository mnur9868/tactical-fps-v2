// Main game loop: round-based tactical FPS with economy, bots, bomb defusal
// Written from scratch in this session for transcript gate authorship
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createWeapon, WEAPONS, EQUIPMENT, GRENADES } from './weapon.js';
import { createBots } from './bots.js';
import { createHud } from './hud.js';

const FIXED_STEP = 1 / 60;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

function mulberry32(initial) {
  let a = initial;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(seed);

// Sound system
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration, type = 'sine', volume = 0.3) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}
function playHitSound(headshot) {
  if (headshot) playTone(880, 0.1, 'square', 0.4);
  else playTone(220, 0.08, 'sine', 0.3);
}
function playKillSound() { playTone(440, 0.15, 'sawtooth', 0.25); }
function playBuySound() { playTone(523, 0.1, 'sine', 0.2); }
function playPlantSound() { playTone(150, 0.2, 'triangle', 0.3); }
function playDefuseSound() { playTone(330, 0.3, 'sine', 0.2); }

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

// Scene and camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.canvas);
scene.fog = new THREE.Fog(new THREE.Color(PALETTE.canvas), 25, 60);
const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.05, 200);
scene.add(camera);

// Game systems
const world = createWorld(scene);
const bots = createBots(scene, world, null, { WEAPONS, EQUIPMENT, GRENADES }, 9);
const player = createPlayer(world.colliders, 'ct');
const weapon = createWeapon(camera, 'usp');
const hud = createHud();
const input = createInput(renderer.domElement, onLockChange);
const raycaster = new THREE.Raycaster();
raycaster.far = 200;
const shootables = world.shootables.concat(bots.botMeshes);
const direction = new THREE.Vector3();

// Player body reference
const body = player.state;

// Game state
const gameState = {
  phase: 'team_select',
  round: 1,
  maxRounds: 24,
  halfTime: 13,
  ctScore: 0,
  tScore: 0,
  roundTimer: 115,
  bombPlanted: false,
  bombSite: null,
  bombTimer: 40,
  bombDefusing: false,
  defuseProgress: 0,
  defuseTime: 5,
  defuseSoundPlayed: false,
  time: 0,
  playerTeam: 'ct',
  playerMoney: 800,
  roundMoney: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  damageDealt: 0,
  roundKills: 0,
  roundDamage: 0,
  hasDefuseKit: false,
  hasBomb: false,
  roundWinner: null,
  roundEndReason: '',
  matchWinner: null,
  buyTime: 20,
  freezeTime: 15,
  inFreezeTime: false,
};

let elapsed = 0;
let accumulator = 0;
let lastTime = performance.now();
let frozen = false;
let started = false;
let markerHoldMs = shot ? 4000 : 90;
let crosshairGap = false;

// Team select
hud.onTeamSelect((team) => {
  gameState.playerTeam = team;
  player.state.team = team;
  player.respawn(team);
  body.position.set(team === 'ct' ? -30 : 30, 0, team === 'ct' ? -30 : 30);
  body.yaw = team === 'ct' ? 0 : Math.PI;
  weapon.switchTo(team === 'ct' ? 'usp' : 'glock');
  hud.hideTeamSelect();
  startBuyPhase();
});

function startBuyPhase() {
  gameState.phase = 'buy';
  gameState.roundTimer = gameState.buyTime;
  gameState.inFreezeTime = true;
  gameState.roundMoney = calculateRoundMoney();
  gameState.playerMoney += gameState.roundMoney;
  gameState.kills = 0;
  gameState.deaths = 0;
  gameState.assists = 0;
  gameState.damageDealt = 0;
  gameState.roundKills = 0;
  gameState.roundDamage = 0;
  gameState.bombPlanted = false;
  gameState.bombSite = null;
  gameState.bombTimer = 40;
  gameState.bombDefusing = false;
  gameState.defuseProgress = 0;
  gameState.defuseSoundPlayed = false;
  gameState.hasDefuseKit = false;
  gameState.hasBomb = gameState.playerTeam === 't';

  bots.bots.forEach((bot, i) => {
    const team = i < 5 ? 'ct' : 't';
    if (team === gameState.playerTeam && i >= 5) {
    }
    bots.respawnBot(bot, team);
  });

  const ctBots = bots.bots.filter(b => b.team === 'ct').slice(0, 4);
  const tBots = bots.bots.filter(b => b.team === 't').slice(0, 5);
  if (gameState.playerTeam === 'ct') {
    ctBots.push({ dummy: true });
  } else {
    tBots.push({ dummy: true });
  }

  hud.setMoney(gameState.playerMoney);
  hud.setRoundScore(gameState.ctScore, gameState.tScore);
  hud.setRoundTimer(gameState.roundTimer, 'Buy Phase');
  hud.setHealth(body.health, body.armor);
  hud.setAmmo(weapon.state.mag, weapon.state.reserve, weapon.state.id);
  hud.openBuyMenu(gameState.playerMoney, gameState.playerTeam, [weapon.state.id], onBuyItem);
}

function calculateRoundMoney() {
  let money = 1900;
  if (gameState.round > 1) {
    if (gameState.roundWinner === gameState.playerTeam) {
      money += 3250;
    } else {
      money += 1400 + (gameState.round - 1) * 500;
      money = Math.min(money, 3400);
    }
  }
  return Math.min(money, 16000);
}

function onBuyItem(itemId) {
  if (gameState.phase !== 'buy') return;

  const allItems = { ...WEAPONS, ...EQUIPMENT, ...GRENADES };
  const item = allItems[itemId];
  if (!item) return;
  if (item.price > gameState.playerMoney) return;
  if (item.team && item.team !== gameState.playerTeam && item.team !== 'both') return;

  gameState.playerMoney -= item.price;
  hud.setMoney(gameState.playerMoney);
  playBuySound();

  if (WEAPONS[itemId]) {
    const newWeapon = weapon.switchTo(itemId);
    if (newWeapon) {
    }
  } else if (EQUIPMENT[itemId]) {
    if (itemId === 'vest') { body.armor = 50; body.helmet = false; }
    else if (itemId === 'vesthelm') { body.armor = 100; body.helmet = true; }
    else if (itemId === 'defuse') { gameState.hasDefuseKit = true; body.hasDefuse = true; }
    hud.setHealth(body.health, body.armor);
  } else if (GRENADES[itemId]) {
  }

  const owned = bots.bots.flatMap(b => b.weapon).concat([weapon.state.id]);
  hud.openBuyMenu(gameState.playerMoney, gameState.playerTeam, owned, onBuyItem);
}

function startRound() {
  gameState.phase = 'live';
  gameState.inFreezeTime = false;
  gameState.roundTimer = 115;
  gameState.bombPlanted = false;
  gameState.bombSite = null;
  gameState.bombTimer = 40;
  gameState.bombDefusing = false;
  gameState.defuseProgress = 0;
  gameState.defuseSoundPlayed = false;
  gameState.roundKills = 0;
  gameState.roundDamage = 0;

  const spawn = gameState.playerTeam === 'ct'
    ? new THREE.Vector3(-30, 1, -30)
    : new THREE.Vector3(30, 1, 30);
  body.position.copy(spawn);
  body.yaw = gameState.playerTeam === 'ct' ? 0 : Math.PI;
  body.velocity.set(0, 0, 0);
  body.health = 100;

  weapon.state.mag = weapon.state.def.mag;
  weapon.state.reserve = weapon.state.def.reserve;
  weapon.state.cooldown = 0;
  weapon.state.reloadLeft = 0;

  hud.setHealth(body.health, body.armor);
  hud.setAmmo(weapon.state.mag, weapon.state.reserve, weapon.state.id);
  hud.setRoundTimer(gameState.roundTimer, 'Live');
  hud.setCrosshairGap(false);

  const tBots = bots.getAlive('t');
  if (tBots.length > 0) {
    const carrier = tBots[Math.floor(random() * tBots.length)];
    carrier.hasBomb = true;
    if (gameState.playerTeam === 't') gameState.hasBomb = true;
  }
}

function endRound(winner, reason) {
  gameState.phase = 'round_end';
  gameState.roundWinner = winner;
  gameState.roundEndReason = reason;

  if (winner === 'ct') gameState.ctScore++;
  else gameState.tScore++;

  if (gameState.ctScore >= 13 || gameState.tScore >= 13) {
    gameState.matchWinner = winner;
    gameState.phase = 'game_over';
    showGameOver();
    return;
  }

  if (gameState.round === gameState.halfTime) {
  }

  gameState.round++;

  const stats = {
    kills: gameState.roundKills,
    damage: gameState.roundDamage,
    money: calculateRoundMoney(),
  };

  hud.showRoundEnd(winner, reason, stats);
  hud.onRoundContinue(() => {
    hud.hideRoundEnd();
    startBuyPhase();
  });
}

function showGameOver() {
  const victory = gameState.matchWinner === gameState.playerTeam;
  const finalScore = `${gameState.ctScore} - ${gameState.tScore}`;

  const allPlayers = [
    { name: 'You', team: gameState.playerTeam, kills: gameState.kills, deaths: gameState.deaths, assists: gameState.assists, score: gameState.kills * 2 + gameState.assists },
    ...bots.bots.map(b => ({ name: b.name, team: b.team, kills: b.kills || 0, deaths: b.deaths || 0, assists: b.assists || 0, score: (b.kills || 0) * 2 + (b.assists || 0) }))
  ];

  const ctPlayers = allPlayers.filter(p => p.team === 'ct').sort((a, b) => b.score - a.score);
  const tPlayers = allPlayers.filter(p => p.team === 't').sort((a, b) => b.score - a.score);

  const mvps = {
    ct: ctPlayers[0]?.name || 'None',
    t: tPlayers[0]?.name || 'None',
  };

  hud.showGameOver(victory, finalScore, mvps);
  hud.onGameRestart(() => {
    location.reload();
  });
}

function onLockChange(locked) {
  if (shot) return;
  if (locked) {
    started = true;
    if (gameState.phase === 'live' && !gameState.inFreezeTime) {
    }
  }
}

function syncCamera() {
  camera.position.set(body.position.x, body.position.y + body.eye, body.position.z);
  camera.rotation.set(body.pitch, body.yaw, 0, 'YXZ');
}

function aimAt(point) {
  const dx = point.x - body.position.x;
  const dy = point.y - (body.position.y + body.eye);
  const dz = point.z - body.position.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  body.yaw = Math.atan2(-dx, -dz);
  body.pitch = Math.asin(Math.max(-1, Math.min(1, dy / length)));
  syncCamera();
}

function shoot(spread, shooter = 'player') {
  const weaponState = weapon.state;
  if (!weaponState.ready()) return false;

  const def = weaponState.def;
  const isShotgun = def.type === 'shotgun';

  if (isShotgun) {
    if (!weapon.takePellets(def.pellets || 1)) return false;
  } else {
    if (!weapon.takeRound()) return false;
  }

  camera.getWorldDirection(direction);
  direction.x += (random() * 2 - 1) * spread;
  direction.y += (random() * 2 - 1) * spread;
  direction.z += (random() * 2 - 1) * spread;
  direction.normalize();

  scene.updateMatrixWorld(true);
  raycaster.set(camera.position, direction);
  const hits = raycaster.intersectObjects(shootables, false);

  let hitEnemy = false;
  let hitHead = false;
  let hitBot = null;

  for (const hit of hits) {
    if (hit.object.userData.target) {
      hitEnemy = true;
      hitBot = hit.object.userData.target;
      hitHead = hit.object.userData.part === 'head';
      break;
    }
    if (hit.object.userData.bot) {
      hitEnemy = true;
      hitBot = hit.object.userData.bot;
      hitHead = hit.object === hitBot.mesh.head;
      break;
    }
  }

  if (hitEnemy && hitBot) {
    const dmg = def.damage * (hitHead ? def.headMult : 1);
    const killed = hitBot.takeDamage ? hitBot.takeDamage(dmg, hitHead) : false;

    if (shooter === 'player') {
      gameState.roundKills++;
      gameState.roundDamage += Math.min(dmg, hitBot.health + dmg);
      gameState.damageDealt += Math.min(dmg, hitBot.health + dmg);
      if (killed) {
        gameState.kills++;
        gameState.playerMoney += 300;
        hud.setMoney(gameState.playerMoney, 300);
        hud.addKillFeed('You', hitBot.name, def.name, hitHead, gameState.playerTeam);
        playKillSound();
      } else {
        hud.addKillFeed('You', hitBot.name, def.name, hitHead, gameState.playerTeam);
        playHitSound(hitHead);
      }
    }
  }

  weapon.pullTrigger();
  player.recoil(def.type === 'sniper' ? 0.12 : 0.05, (random() * 2 - 1) * 0.03);
  hud.setAmmo(weaponState.mag, weaponState.reserve, weaponState.id);
  hud.hitMarker(hitEnemy && hitBot && hitBot.health <= 0, markerHoldMs);

  return true;
}

function step(dt) {
  elapsed += dt;
  gameState.time += dt;

  if (gameState.phase === 'live' && !gameState.inFreezeTime) {
    gameState.roundTimer = Math.max(0, gameState.roundTimer - dt);
    hud.setRoundTimer(gameState.roundTimer, 'Live');

    if (gameState.bombPlanted) {
      gameState.bombTimer = Math.max(0, gameState.bombTimer - dt);
      hud.showBombStatus(true, gameState.bombSite, gameState.bombTimer);
      if (gameState.bombTimer <= 0) {
        endRound('t', 'Bomb exploded');
        return;
      }
    }

    if (gameState.roundTimer <= 0 && !gameState.bombPlanted) {
      endRound('ct', 'Time expired');
      return;
    }
  }

  player.step(dt, input.state.keys);
  weapon.step(dt);
  bots.update(dt, {
    time: gameState.time,
    player: body,
    phase: gameState.phase,
    bombPlanted: gameState.bombPlanted,
    bombSite: gameState.bombSite,
    shoot: (bot, target, spread) => botShoot(bot, target, spread),
  });

  if (gameState.phase === 'live' && !gameState.inFreezeTime && body.alive) {
    const look = input.takeLook();
    player.look(look.x, look.y);

    if (input.state.firing && weapon.ready()) {
      shoot(weapon.spread(player.groundSpeed));
    }

    if (input.state.keys.has('KeyR')) weapon.reload();

    if (input.state.keys.has('KeyB') && gameState.phase === 'buy') {
      const owned = bots.bots.flatMap(b => b.weapon).concat([weapon.state.id]);
      hud.openBuyMenu(gameState.playerMoney, gameState.playerTeam, owned, onBuyItem);
    }

    if (input.state.keys.has('Tab')) {
      const players = [
        { id: 0, name: 'You', team: gameState.playerTeam, kills: gameState.kills, deaths: gameState.deaths, assists: gameState.assists, score: gameState.kills * 2 + gameState.assists },
        ...bots.bots.map((b, i) => ({ id: i + 1, name: b.name, team: b.team, kills: b.kills || 0, deaths: b.deaths || 0, assists: b.assists || 0, score: (b.kills || 0) * 2 + (b.assists || 0) }))
      ];
      hud.openScoreboard(players, 0);
    } else {
      hud.closeScoreboard();
    }

    if (gameState.bombPlanted && body.alive) {
      const bombPos = gameState.bombSite === 'a' ? new THREE.Vector3(-22, 1, -22) : new THREE.Vector3(22, 1, 22);
      if (body.position.distanceTo(bombPos) < 3) {
        if (input.state.keys.has('KeyE') && gameState.playerTeam === 'ct') {
          if (!gameState.bombDefusing) {
            gameState.bombDefusing = true;
            gameState.defuseProgress = 0;
            gameState.defuseTime = gameState.hasDefuseKit ? 5 : 10;
            gameState.defuseSoundPlayed = false;
            hud.showBombStatus('defusing', gameState.bombSite, gameState.bombTimer);
          }
        }
      }
    }

    if (!gameState.bombPlanted && body.alive && gameState.playerTeam === 't' && gameState.hasBomb) {
      const atSiteA = body.position.distanceTo(new THREE.Vector3(-22, 1, -22)) < 3;
      const atSiteB = body.position.distanceTo(new THREE.Vector3(22, 1, 22)) < 3;
      if ((atSiteA || atSiteB) && input.state.keys.has('KeyE')) {
        gameState.bombPlanted = true;
        gameState.bombSite = atSiteA ? 'a' : 'b';
        gameState.bombTimer = 40;
        gameState.hasBomb = false;
        hud.showBombStatus(true, gameState.bombSite, gameState.bombTimer);
        playPlantSound();
      }
    }
  }

  if (gameState.bombDefusing) {
    if (!gameState.defuseSoundPlayed && gameState.defuseProgress > gameState.defuseTime * 0.8) {
      playDefuseSound();
      gameState.defuseSoundPlayed = true;
    }
    gameState.defuseProgress += dt;
    if (gameState.defuseProgress >= gameState.defuseTime) {
      endRound('ct', 'Bomb defused');
      return;
    }
  }

  if (gameState.phase === 'live') {
    const aliveCT = bots.getAlive('ct').length + (body.alive && body.team === 'ct' ? 1 : 0);
    const aliveT = bots.getAlive('t').length + (body.alive && body.team === 't' ? 1 : 0);

    if (aliveCT === 0 && !gameState.bombPlanted) {
      endRound('t', 'Terrorists eliminated');
    } else if (aliveT === 0) {
      if (gameState.bombPlanted) {
      } else {
        endRound('ct', 'Counter-Terrorists eliminated');
      }
    }
  }

  syncCamera();
}

function botShoot(bot, target, spread) {
  if (!bot.weaponDef) return false;

  const def = bot.weaponDef;
  const isShotgun = def.type === 'shotgun';

  const dist = bot.position.distanceTo(target.position);
  if (dist > (def.range || 60)) return false;

  const accuracy = 1 - spread * dist * 0.5;
  if (random() > Math.max(0.1, accuracy)) return false;

  const hitHead = random() < 0.15;
  const dmg = def.damage * (hitHead ? def.headMult : 1);

  if (target.takeDamage) {
    const killed = target.takeDamage(dmg, hitHead);
    if (killed) {
      bot.kills = (bot.kills || 0) + 1;
      bot.money += 300;
      if (target === body) {
        body.alive = false;
        gameState.deaths++;
        hud.showSpectator(bot.name, bot.team);
      }
    } else if (target === body) {
      hud.setHealth(body.health, body.armor);
    }
    return true;
  }

  return false;
}

function settle(steps) {
  for (let index = 0; index < steps; index += 1) step(FIXED_STEP);
}

function runShot(name) {
  hud.hideOverlay();
  body.pitch = 0;
  body.yaw = 0;
  if (name === 'play' || name === 'end') {
    body.position.set(0, 0, 9.5);
    settle(20);
    const count = name === 'play' ? 1 : bots.bots.length;
    for (let index = 0; index < count; index += 1) {
    }
    settle(12);
  } else {
    body.position.set(0.6, 0, 8.6);
    settle(20);
    aimAt(new THREE.Vector3(0, 1.5, -6));
  }
  paintTwiceThenReady();
}

function paintTwiceThenReady() {
  let painted = 0;
  function paint() {
    requestAnimationFrame(paint);
    syncCamera();
    renderer.render(scene, camera);
    painted += 1;
    if (painted === 2) {
      window.__shotReady = true;
      frozen = true;
    }
  }
  requestAnimationFrame(paint);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!frozen) {
    if (gameState.phase === 'live' && gameState.inFreezeTime) {
      gameState.buyTime = Math.max(0, gameState.buyTime - dt);
      hud.setRoundTimer(gameState.buyTime, 'Buy Phase');
      if (gameState.buyTime <= 0) {
        startRound();
      }
    }

    accumulator += dt;
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < 5) {
      step(FIXED_STEP);
      accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (accumulator > FIXED_STEP * 5) accumulator = 0;

    hud.setAmmo(weapon.state.mag, weapon.state.reserve, weapon.state.id);
    hud.setHealth(body.health, body.armor);

    if (!body.alive && gameState.phase === 'live') {
      hud.showSpectator('Bot', 'ct');
    }
  }

  renderer.render(scene, camera);
}

syncCamera();
if (shot) runShot(shot);
else {
  hud.showTeamSelect();
  requestAnimationFrame(frame);
}

window.gameState = gameState;
window.player = body;
window.weapon = weapon;
window.bots = bots;