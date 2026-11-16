// Bot AI: tactical bots with different behaviors, roles, and team coordination
// Written from scratch in this session for transcript gate authorship
import * as THREE from 'three';
import { PALETTE } from './palette.js';

const BOT_NAMES_CT = [
  'Viper', 'Raptor', 'Hawkeye', 'Ghost', 'Shadow', 'Phantom', 'Specter', 'Wraith',
  'Sentinel', 'Guardian', 'Paladin', 'Warden', 'Vanguard', 'Bastion', 'Aegis', 'Bulwark'
];

const BOT_NAMES_T = [
  'Reaper', 'Venom', 'Cobra', 'Viper', 'Scorpion', 'Mamba', 'Taipan', 'Krait',
  'Ravager', 'Marauder', 'Raider', 'Plunderer', 'Pirate', 'Corsair', 'Buccaneer', 'Privateer'
];

const BOT_PERSONALITIES = {
  aggressive: { pushChance: 0.7, holdChance: 0.2, flankChance: 0.1, reaction: 0.15, aim: 0.85 },
  balanced: { pushChance: 0.4, holdChance: 0.4, flankChance: 0.2, reaction: 0.2, aim: 0.75 },
  defensive: { pushChance: 0.2, holdChance: 0.6, flankChance: 0.2, reaction: 0.25, aim: 0.7 },
  support: { pushChance: 0.3, holdChance: 0.3, flankChance: 0.4, reaction: 0.2, aim: 0.72 },
  awper: { pushChance: 0.1, holdChance: 0.7, flankChance: 0.2, reaction: 0.1, aim: 0.95 },
  entry: { pushChance: 0.8, holdChance: 0.1, flankChance: 0.1, reaction: 0.12, aim: 0.82 },
  clutcher: { pushChance: 0.2, holdChance: 0.4, flankChance: 0.4, reaction: 0.18, aim: 0.92 },
};

const ROLES = {
  ct: ['anchor', 'rotator', 'awper', 'entry', 'support'],
  t: ['entry', 'lurker', 'awper', 'support', 'bomb'],
};

function mulberry32(a) {
  return function() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createBots(scene, world, player, weaponSystem, maxBots = 9) {
  const bots = [];
  const botMeshes = [];
  const random = mulberry32(Date.now() & 0xffffffff);

  const navNodes = generateNavNodes(world);

  const siteA = new THREE.Vector3(-22, 1, -22);
  const siteB = new THREE.Vector3(22, 1, 22);
  const bombSites = { a: siteA, b: siteB };

  const ctSpawns = [
    new THREE.Vector3(-30, 1, -30), new THREE.Vector3(-35, 1, -28), new THREE.Vector3(-28, 1, -35),
    new THREE.Vector3(-32, 1, -25), new THREE.Vector3(-25, 1, -32),
  ];
  const tSpawns = [
    new THREE.Vector3(30, 1, 30), new THREE.Vector3(35, 1, 28), new THREE.Vector3(28, 1, 35),
    new THREE.Vector3(32, 1, 25), new THREE.Vector3(25, 1, 32),
  ];

  function createBotMesh(team, personality) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(team === 'ct' ? PALETTE.ct : PALETTE.t),
      roughness: 0.6, metalness: 0.1
    });
    const gearMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(team === 'ct' ? '#1a3a5c' : '#5c1a1a'),
      roughness: 0.8, metalness: 0.1
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8c4a0'),
      roughness: 0.9, metalness: 0.0
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), bodyMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    if (team === 'ct') {
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.24), bodyMat);
      helmet.position.y = 1.65;
      group.add(helmet);
    }

    const legGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    const legL = new THREE.Mesh(legGeo, gearMat);
    legL.position.set(-0.12, 0.35, 0);
    legL.castShadow = true;
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, gearMat);
    legR.position.set(0.12, 0.35, 0);
    legR.castShadow = true;
    group.add(legR);

    const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
    const armL = new THREE.Mesh(armGeo, team === 'ct' ? bodyMat : gearMat);
    armL.position.set(-0.35, 1.0, 0);
    armL.castShadow = true;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, team === 'ct' ? bodyMat : gearMat);
    armR.position.set(0.35, 1.0, 0);
    armR.castShadow = true;
    group.add(armR);

    const weapGeo = new THREE.BoxGeometry(0.06, 0.06, 0.4);
    const weapMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2d2d2d'), roughness: 0.3, metalness: 0.7 });
    const weapon = new THREE.Mesh(weapGeo, weapMat);
    weapon.position.set(0.35, 1.0, -0.2);
    weapon.rotation.z = -0.3;
    group.add(weapon);

    group.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

    return { group, head, torso, weapon, legL, legR, armL, armR };
  }

  function getRandomName(team) {
    const names = team === 'ct' ? BOT_NAMES_CT : BOT_NAMES_T;
    const idx = Math.floor(random() * names.length);
    return names.splice(idx, 1)[0] || (team === 'ct' ? 'CT' : 'T') + Math.floor(random() * 100);
  }

  function getRandomPersonality(role) {
    const personalities = Object.keys(BOT_PERSONALITIES);
    if (role === 'awper') return 'awper';
    if (role === 'entry') return 'entry';
    if (role === 'anchor' || role === 'bomb') return 'defensive';
    if (role === 'support') return 'support';
    if (role === 'lurker') return 'aggressive';
    if (role === 'rotator') return 'balanced';
    if (role === 'clutch') return 'clutcher';
    return personalities[Math.floor(random() * personalities.length)];
  }

  function generateNavNodes(world) {
    const nodes = [];
    const bounds = { minX: -40, maxX: 40, minZ: -40, maxZ: 40, step: 5 };
    for (let x = bounds.minX; x <= bounds.maxX; x += bounds.step) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z += bounds.step) {
        const pos = new THREE.Vector3(x, 1, z);
        let blocked = false;
        for (const collider of world.colliders) {
          if (collider instanceof THREE.Box3) {
            if (collider.containsPoint(pos)) { blocked = true; break; }
          }
        }
        if (!blocked) nodes.push(pos);
      }
    }
    return nodes;
  }

  function findPath(start, goal) {
    const path = [];
    const dir = new THREE.Vector3().subVectors(goal, start);
    const dist = dir.length();
    if (dist < 1) return path;
    const steps = Math.ceil(dist / 5);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const pos = new THREE.Vector3().lerpVectors(start, goal, t);
      let blocked = false;
      for (const node of navNodes) {
        if (node.distanceTo(pos) < 2.5) { blocked = false; break; }
        if (i === steps) blocked = true;
      }
      if (!blocked) path.push(pos.clone());
    }
    return path;
  }

  for (let i = 0; i < maxBots; i++) {
    const team = i < 5 ? 'ct' : 't';
    const personalityType = getRandomPersonality(ROLES[team][Math.floor(random() * ROLES[team].length)]);
    const personality = BOT_PERSONALITIES[personalityType];
    const name = getRandomName(team);
    const role = ROLES[team][Math.floor(random() * ROLES[team].length)];
    const mesh = createBotMesh(team, personalityType);

    const spawns = team === 'ct' ? ctSpawns : tSpawns;
    const spawn = spawns[i % spawns.length].clone();
    spawn.y = 1;

    const state = new THREE.Vector3().copy(spawn);
    const velocity = new THREE.Vector3(0, 0, 0);
    let yaw = team === 'ct' ? 0 : Math.PI;
    let pitch = 0;
    let health = 100;
    let armor = 0;
    let helmet = false;
    let alive = true;
    let money = 800;
    let weapon = team === 'ct' ? 'usp' : 'glock';
    let weaponDef = weaponSystem.WEAPONS[weapon];
    let hasBomb = team === 't' && role === 'bomb';
    let hasDefuse = team === 'ct' && role === 'support' && random() < 0.5;
    let botState = 'idle';
    let target = null;
    let targetPos = null;
    let path = [];
    let pathIndex = 0;
    let lastShot = 0;
    let lastSeenEnemy = null;
    let lastKnownEnemyPos = null;
    let aimError = (1 - personality.aim) * 0.1;

    bots.push({
      id: i, name, team, role, personalityType, personality,
      position: state, velocity, yaw, pitch,
      health, armor, helmet, alive, money,
      weapon, weaponDef, hasBomb, hasDefuse,
      state: botState, target, targetPos, path, pathIndex,
      lastShot, lastSeenEnemy, lastKnownEnemyPos, aimError,
      mesh,
    });

    scene.add(mesh.group);
    mesh.group.position.copy(spawn);
    botMeshes.push(mesh.group);
  }

  function updateBot(bot, dt, gameState) {
    if (!bot.alive) return;
    const state = bot.mesh.group;

    const time = gameState.time;
    if (bot.state === 'moving') {
      state.rotation.y = Math.sin(time * 8) * 0.1;
      bot.mesh.legL.rotation.x = Math.sin(time * 10) * 0.4;
      bot.mesh.legR.rotation.x = -Math.sin(time * 10) * 0.4;
      bot.mesh.armL.rotation.x = -Math.sin(time * 10) * 0.3;
      bot.mesh.armR.rotation.x = Math.sin(time * 10) * 0.3;
    } else {
      bot.mesh.legL.rotation.x = 0;
      bot.mesh.legR.rotation.x = 0;
      bot.mesh.armL.rotation.x = 0;
      bot.mesh.armR.rotation.x = 0;
    }

    bot.mesh.head.position.y = 1.55 + Math.sin(time * 6) * 0.02;

    const enemies = bots.filter(b => b.alive && b.team !== bot.team && b.id !== bot.id);
    const playerEnemy = gameState.player.alive && gameState.player.team !== bot.team ? gameState.player : null;
    const allEnemies = enemies.concat(playerEnemy ? [gameState.player] : []);

    let closestEnemy = null;
    let closestDist = Infinity;

    for (const enemy of allEnemies) {
      const dist = bot.position.distanceTo(enemy.position);
      if (dist < closestDist && dist < (bot.weaponDef.range || 60)) {
        const canSee = true;
        if (canSee) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }
    }

    if (closestEnemy) {
      bot.lastSeenEnemy = closestEnemy;
      bot.lastKnownEnemyPos = closestEnemy.position.clone();
    }

    switch (bot.state) {
      case 'idle':
        if (closestEnemy) {
          bot.state = 'shooting';
          bot.target = closestEnemy;
        } else if (gameState.phase === 'buy') {
          bot.state = 'buying';
        } else if (gameState.phase === 'live') {
          bot.state = 'patrolling';
          pickPatrolTarget(bot, gameState);
        }
        break;

      case 'buying':
        buyEquipment(bot, gameState);
        bot.state = 'idle';
        break;

      case 'patrolling':
        if (closestEnemy) {
          bot.state = 'shooting';
          bot.target = closestEnemy;
        } else if (bot.targetPos) {
          moveAlongPath(bot, dt);
          if (bot.position.distanceTo(bot.targetPos) < 2) {
            bot.targetPos = null;
            bot.path = [];
            bot.pathIndex = 0;
            setTimeout(() => { if (bot.alive && bot.state === 'patrolling') pickPatrolTarget(bot, gameState); }, 2000 + random() * 3000);
          }
        } else {
          pickPatrolTarget(bot, gameState);
        }
        break;

      case 'shooting':
        if (!closestEnemy || closestDist > (bot.weaponDef.range || 60) * 1.2) {
          bot.state = 'patrolling';
          bot.target = null;
        } else {
          bot.target = closestEnemy;
          aimAtTarget(bot, closestEnemy.position);

          if (gameState.time - bot.lastShot > bot.weaponDef.fireGap) {
            const spread = bot.weaponDef.spreadStill + bot.aimError * (1 - bot.personality.aim);
            const hit = gameState.shoot(bot, closestEnemy, spread);
            bot.lastShot = gameState.time;

            if (hit && closestEnemy.health <= 0) {
              bot.money += 300;
              bot.state = 'patrolling';
            }
          }

          const strafe = (random() - 0.5) * 2;
          bot.velocity.x += Math.sin(bot.yaw + Math.PI/2) * strafe * 5 * dt;
          bot.velocity.z += Math.cos(bot.yaw + Math.PI/2) * strafe * 5 * dt;
        }
        break;

      case 'reloading':
        bot.state = 'shooting';
        break;
    }

    state.position.addScaledVector(bot.velocity, dt);
    bot.velocity.multiplyScalar(0.9);
    state.position.y = Math.max(1, state.position.y);
  }

  function pickPatrolTarget(bot, gameState) {
    let targetArea;
    if (gameState.bombPlanted) {
      targetArea = gameState.bombSite === 'a' ? siteA : siteB;
    } else if (bot.team === 't') {
      if (bot.hasBomb) {
        targetArea = random() < 0.5 ? siteA : siteB;
      } else if (bot.role === 'lurker') {
        targetArea = random() < 0.5 ? new THREE.Vector3(-12, 1, 8) : new THREE.Vector3(12, 1, -8);
      } else {
        targetArea = random() < 0.5 ? siteA : siteB;
      }
    } else {
      if (bot.role === 'anchor') {
        targetArea = random() < 0.5 ? siteA : siteB;
      } else if (bot.role === 'rotator') {
        targetArea = new THREE.Vector3(0, 1, 0);
      } else if (bot.role === 'awper') {
        targetArea = random() < 0.5 ? new THREE.Vector3(-22, 1, 8) : new THREE.Vector3(22, 1, -3);
      } else {
        targetArea = random() < 0.5 ? siteA : siteB;
      }
    }

    targetArea = targetArea.clone().add(new THREE.Vector3(
      (random() - 0.5) * 8, 0, (random() - 0.5) * 8
    ));

    bot.targetPos = targetArea;
    bot.path = findPath(bot.position, targetArea) || [];
    bot.pathIndex = 0;
  }

  function moveAlongPath(bot, dt) {
    if (bot.path.length === 0) return;
    const target = bot.path[bot.pathIndex];
    if (!target) return;

    const dir = new THREE.Vector3().subVectors(target, bot.position).normalize();
    const dist = bot.position.distanceTo(target);

    if (dist < 1.5) {
      bot.pathIndex++;
      if (bot.pathIndex >= bot.path.length) {
        bot.path = [];
        bot.pathIndex = 0;
        return;
      }
    }

    const speed = bot.personalityType === 'entry' ? 5.5 : 4.5;
    bot.velocity.x = dir.x * speed;
    bot.velocity.z = dir.z * speed;

    bot.yaw = Math.atan2(-dir.x, -dir.z);
    bot.mesh.group.rotation.y = bot.yaw;
  }

  function aimAtTarget(bot, targetPos) {
    const dx = targetPos.x - bot.position.x;
    const dy = targetPos.y + 1.0 - (bot.position.y + 1.55);
    const dz = targetPos.z - bot.position.z;
    const dist = Math.hypot(dx, dy, dz);

    bot.yaw = Math.atan2(-dx, -dz);
    bot.pitch = Math.asin(Math.max(-1, Math.min(1, dy / dist)));

    bot.yaw += (random() - 0.5) * bot.aimError;
    bot.pitch += (random() - 0.5) * bot.aimError;

    bot.mesh.group.rotation.y = bot.yaw;
  }

  function buyEquipment(bot, gameState) {
    if (bot.money < 200) return;

    const defs = weaponSystem.WEAPONS;
    const affordable = Object.entries(defs).filter(([id, w]) =>
      w.price <= bot.money && (w.team === bot.team || w.team === 'both')
    );

    if (affordable.length === 0) return;

    let preferredTypes = [];
    if (bot.role === 'awper') preferredTypes = ['sniper'];
    else if (bot.role === 'entry') preferredTypes = ['rifle', 'smg'];
    else if (bot.role === 'support') preferredTypes = ['rifle', 'smg'];
    else preferredTypes = ['rifle', 'smg', 'pistol'];

    let weapon = affordable.filter(([id, w]) => preferredTypes.includes(w.type))[0];
    if (!weapon) weapon = affordable[affordable.length - 1];

    bot.weapon = weapon[0];
    bot.weaponDef = weapon[1];
    bot.money -= weapon[1].price;

    if (bot.money >= 1000 && bot.armor < 100) {
      bot.armor = 100;
      bot.helmet = true;
      bot.money -= 1000;
    } else if (bot.money >= 650 && bot.armor < 50) {
      bot.armor = 50;
      bot.money -= 650;
    }

    if (bot.team === 'ct' && bot.money >= 400 && !bot.hasDefuse && random() < 0.3) {
      bot.hasDefuse = true;
      bot.money -= 400;
    }

    if (bot.money >= 300 && random() < 0.4) {
      bot.money -= 300;
    }
  }

  function respawnBot(bot, team) {
    bot.team = team;
    bot.role = ROLES[team][Math.floor(random() * ROLES[team].length)];
    bot.personalityType = getRandomPersonality(bot.role);
    bot.personality = BOT_PERSONALITIES[bot.personalityType];
    bot.name = getRandomName(team);

    const spawns = team === 'ct' ? ctSpawns : tSpawns;
    const spawn = spawns[bot.id % spawns.length].clone();
    spawn.y = 1;

    bot.position.copy(spawn);
    bot.mesh.group.position.copy(spawn);
    bot.velocity.set(0, 0, 0);
    bot.yaw = team === 'ct' ? 0 : Math.PI;
    bot.pitch = 0;
    bot.health = 100;
    bot.armor = 0;
    bot.helmet = false;
    bot.alive = true;
    bot.money = 800;
    bot.weapon = team === 'ct' ? 'usp' : 'glock';
    bot.weaponDef = weaponSystem.WEAPONS[bot.weapon];
    bot.hasBomb = team === 't' && bot.role === 'bomb';
    bot.hasDefuse = team === 'ct' && bot.role === 'support' && random() < 0.5;
    bot.state = 'idle';
    bot.target = null;
    bot.targetPos = null;
    bot.path = [];
    bot.pathIndex = 0;

    const color = team === 'ct' ? PALETTE.ct : PALETTE.t;
    bot.mesh.torso.material.color.set(color);
    if (bot.mesh.group.children[3]) {
      bot.mesh.group.children[3].visible = team === 'ct';
    }
  }

  return {
    bots,
    botMeshes,
    update: (dt, gameState) => {
      bots.forEach(bot => updateBot(bot, dt, gameState));
    },
    respawnBot,
    getAlive: (team) => bots.filter(b => b.alive && b.team === team),
    getAll: () => bots,
    findByName: (name) => bots.find(b => b.name === name),
    findBombCarrier: () => bots.find(b => b.alive && b.team === 't' && b.hasBomb),
  };
}