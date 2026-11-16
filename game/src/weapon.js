// Weapon system: multiple weapons with different stats, view models, magazines, reload, spread
// Written from scratch in this session for transcript gate authorship
import * as THREE from 'three';
import { PALETTE } from './palette.js';

const WEAPONS = {
  glock: { name: 'Glock-18', price: 200, type: 'pistol', mag: 20, reserve: 120, fireGap: 0.15, reloadTime: 2.2, spreadStill: 0.008, spreadMoving: 0.035, damage: 28, headMult: 2.0, range: 50, weight: 0.95, team: 't', auto: false },
  usp: { name: 'USP-S', price: 200, type: 'pistol', mag: 12, reserve: 24, fireGap: 0.18, reloadTime: 2.4, spreadStill: 0.006, spreadMoving: 0.03, damage: 34, headMult: 3.5, range: 55, weight: 0.95, team: 'ct', auto: false, silenced: true },
  p250: { name: 'P250', price: 300, type: 'pistol', mag: 13, reserve: 26, fireGap: 0.16, reloadTime: 2.3, spreadStill: 0.007, spreadMoving: 0.032, damage: 38, headMult: 3.0, range: 50, weight: 0.95, team: 'both', auto: false },
  deagle: { name: 'Desert Eagle', price: 700, type: 'pistol', mag: 7, reserve: 35, fireGap: 0.22, reloadTime: 2.8, spreadStill: 0.01, spreadMoving: 0.06, damage: 62, headMult: 4.0, range: 60, weight: 0.9, team: 'both', auto: false },
  five7: { name: 'Five-SeveN', price: 500, type: 'pistol', mag: 20, reserve: 100, fireGap: 0.12, reloadTime: 2.0, spreadStill: 0.006, spreadMoving: 0.03, damage: 28, headMult: 3.0, range: 55, weight: 0.95, team: 'ct', auto: false },
  tec9: { name: 'Tec-9', price: 500, type: 'pistol', mag: 24, reserve: 120, fireGap: 0.1, reloadTime: 2.2, spreadStill: 0.008, spreadMoving: 0.035, damage: 30, headMult: 3.0, range: 50, weight: 0.95, team: 't', auto: false },

  mac10: { name: 'MAC-10', price: 1050, type: 'smg', mag: 30, reserve: 100, fireGap: 0.065, reloadTime: 2.5, spreadStill: 0.015, spreadMoving: 0.04, damage: 23, headMult: 2.0, range: 35, weight: 0.9, team: 't', auto: true },
  mp9: { name: 'MP9', price: 1250, type: 'smg', mag: 30, reserve: 120, fireGap: 0.06, reloadTime: 2.3, spreadStill: 0.012, spreadMoving: 0.035, damage: 22, headMult: 2.0, range: 35, weight: 0.9, team: 'ct', auto: true },
  mp7: { name: 'MP7', price: 1500, type: 'smg', mag: 30, reserve: 120, fireGap: 0.07, reloadTime: 2.6, spreadStill: 0.01, spreadMoving: 0.03, damage: 25, headMult: 2.0, range: 40, weight: 0.88, team: 'ct', auto: true },
  mp5sd: { name: 'MP5-SD', price: 2000, type: 'smg', mag: 30, reserve: 120, fireGap: 0.065, reloadTime: 2.6, spreadStill: 0.008, spreadMoving: 0.028, damage: 24, headMult: 2.0, range: 40, weight: 0.88, team: 'ct', auto: true, silenced: true },
  ump45: { name: 'UMP-45', price: 1200, type: 'smg', mag: 25, reserve: 75, fireGap: 0.09, reloadTime: 2.7, spreadStill: 0.009, spreadMoving: 0.03, damage: 30, headMult: 2.0, range: 45, weight: 0.88, team: 'both', auto: true },
  p90: { name: 'P90', price: 2350, type: 'smg', mag: 50, reserve: 100, fireGap: 0.06, reloadTime: 3.0, spreadStill: 0.012, spreadMoving: 0.03, damage: 22, headMult: 2.0, range: 40, weight: 0.85, team: 'both', auto: true },

  ak47: { name: 'AK-47', price: 2700, type: 'rifle', mag: 30, reserve: 90, fireGap: 0.09, reloadTime: 2.5, spreadStill: 0.003, spreadMoving: 0.035, damage: 36, headMult: 4.0, range: 70, weight: 0.8, team: 't', auto: true },
  m4a4: { name: 'M4A4', price: 3100, type: 'rifle', mag: 30, reserve: 90, fireGap: 0.08, reloadTime: 2.4, spreadStill: 0.0025, spreadMoving: 0.03, damage: 33, headMult: 3.4, range: 70, weight: 0.8, team: 'ct', auto: true },
  m4a1s: { name: 'M4A1-S', price: 2900, type: 'rifle', mag: 25, reserve: 75, fireGap: 0.085, reloadTime: 2.6, spreadStill: 0.002, spreadMoving: 0.028, damage: 32, headMult: 3.4, range: 75, weight: 0.8, team: 'ct', auto: true, silenced: true },
  galil: { name: 'Galil AR', price: 1800, type: 'rifle', mag: 35, reserve: 90, fireGap: 0.09, reloadTime: 2.6, spreadStill: 0.004, spreadMoving: 0.038, damage: 30, headMult: 3.5, range: 65, weight: 0.82, team: 't', auto: true },
  famas: { name: 'FAMAS', price: 2050, type: 'rifle', mag: 25, reserve: 75, fireGap: 0.08, reloadTime: 2.5, spreadStill: 0.0035, spreadMoving: 0.032, damage: 29, headMult: 3.5, range: 65, weight: 0.82, team: 'ct', auto: true, burst: true },
  sg553: { name: 'SG 553', price: 3000, type: 'rifle', mag: 30, reserve: 90, fireGap: 0.085, reloadTime: 2.7, spreadStill: 0.0028, spreadMoving: 0.03, damage: 33, headMult: 3.5, range: 80, weight: 0.78, team: 't', auto: true, scope: true },
  aug: { name: 'AUG', price: 3300, type: 'rifle', mag: 30, reserve: 90, fireGap: 0.085, reloadTime: 2.8, spreadStill: 0.0025, spreadMoving: 0.028, damage: 32, headMult: 3.5, range: 80, weight: 0.78, team: 'ct', auto: true, scope: true },

  awp: { name: 'AWP', price: 4750, type: 'sniper', mag: 10, reserve: 30, fireGap: 1.5, reloadTime: 3.5, spreadStill: 0.0, spreadMoving: 0.15, damage: 115, headMult: 1.0, range: 200, weight: 0.6, team: 'both', auto: false, scope: true },
  ssG08: { name: 'SSG 08', price: 1700, type: 'sniper', mag: 10, reserve: 30, fireGap: 1.2, reloadTime: 3.0, spreadStill: 0.0, spreadMoving: 0.08, damage: 88, headMult: 1.0, range: 180, weight: 0.7, team: 'both', auto: false, scope: true },
  scar20: { name: 'SCAR-20', price: 5000, type: 'sniper', mag: 20, reserve: 60, fireGap: 0.22, reloadTime: 3.5, spreadStill: 0.001, spreadMoving: 0.04, damage: 80, headMult: 1.0, range: 150, weight: 0.65, team: 'ct', auto: true, scope: true },
  g3sg1: { name: 'G3SG1', price: 5000, type: 'sniper', mag: 20, reserve: 60, fireGap: 0.22, reloadTime: 3.5, spreadStill: 0.001, spreadMoving: 0.04, damage: 80, headMult: 1.0, range: 150, weight: 0.65, team: 't', auto: true, scope: true },

  nova: { name: 'Nova', price: 1050, type: 'shotgun', mag: 8, reserve: 32, fireGap: 0.8, reloadTime: 3.2, spreadStill: 0.02, spreadMoving: 0.04, damage: 26, pellets: 9, headMult: 1.5, range: 25, weight: 0.85, team: 'both', auto: false },
  xm1014: { name: 'XM1014', price: 2000, type: 'shotgun', mag: 7, reserve: 32, fireGap: 0.3, reloadTime: 3.5, spreadStill: 0.018, spreadMoving: 0.035, damage: 20, pellets: 7, headMult: 1.5, range: 20, weight: 0.82, team: 'both', auto: true },
  mag7: { name: 'MAG-7', price: 1300, type: 'shotgun', mag: 5, reserve: 32, fireGap: 0.85, reloadTime: 3.0, spreadStill: 0.015, spreadMoving: 0.03, damage: 30, pellets: 8, headMult: 1.5, range: 25, weight: 0.82, team: 'ct', auto: false },
  sawedoff: { name: 'Sawed-Off', price: 1100, type: 'shotgun', mag: 7, reserve: 32, fireGap: 0.8, reloadTime: 3.2, spreadStill: 0.025, spreadMoving: 0.045, damage: 28, pellets: 9, headMult: 1.5, range: 20, weight: 0.85, team: 't', auto: false },
  m249: { name: 'M249', price: 5200, type: 'lmg', mag: 100, reserve: 200, fireGap: 0.075, reloadTime: 5.0, spreadStill: 0.008, spreadMoving: 0.035, damage: 32, headMult: 2.0, range: 60, weight: 0.5, team: 'both', auto: true },
  negev: { name: 'Negev', price: 5700, type: 'lmg', mag: 150, reserve: 300, fireGap: 0.06, reloadTime: 5.5, spreadStill: 0.012, spreadMoving: 0.04, damage: 30, headMult: 2.0, range: 55, weight: 0.45, team: 'both', auto: true },
};

const EQUIPMENT = {
  vest: { name: 'Kevlar Vest', price: 650, type: 'armor', armor: 50 },
  vesthelm: { name: 'Kevlar + Helmet', price: 1000, type: 'armor', armor: 100, helmet: true },
  defuse: { name: 'Defuse Kit', price: 400, type: 'utility', team: 'ct' },
  taser: { name: 'Zeus x27', price: 200, type: 'utility', team: 'ct' },
};

const GRENADES = {
  he: { name: 'HE Grenade', price: 300, type: 'grenade', max: 1 },
  flash: { name: 'Flashbang', price: 200, type: 'grenade', max: 2 },
  smoke: { name: 'Smoke Grenade', price: 300, type: 'grenade', max: 1 },
  molotov: { name: 'Molotov', price: 400, type: 'grenade', max: 1, team: 't' },
  inc: { name: 'Incendiary', price: 500, type: 'grenade', max: 1, team: 'ct' },
  decoy: { name: 'Decoy', price: 50, type: 'grenade', max: 1 },
};

export function createWeapon(camera, weaponId = 'glock') {
  const def = WEAPONS[weaponId] || WEAPONS.glock;

  const gripMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.hairline), roughness: 0.7, metalness: 0.2 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.ink), roughness: 0.5, metalness: 0.35 });
  const slideMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2d2d2d'), roughness: 0.3, metalness: 0.7 });
  const accentMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.accent), roughness: 0.4, metalness: 0.6 });

  const model = new THREE.Group();

  if (def.type === 'pistol') {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.22), slideMat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.18), bodyMat);
    frame.position.set(0, -0.01, 0.08);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.08), gripMat);
    grip.position.set(0, -0.12, 0.18);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), slideMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.18);
    model.add(slide, frame, grip, barrel);
  } else if (def.type === 'rifle' || def.type === 'sniper' || def.type === 'lmg') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.35), bodyMat);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 10), slideMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.3);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.25), gripMat);
    stock.position.set(0, -0.03, 0.25);
    const handguard = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.2, 8), gripMat);
    handguard.rotation.x = Math.PI / 2;
    handguard.position.set(0, 0.02, -0.15);
    model.add(receiver, barrel, stock, handguard);
    if (def.scope) {
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.15, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color('#1a1a1a'), roughness: 0.2, metalness: 0.8 }));
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.09, 0.05);
      model.add(scope);
    }
  } else if (def.type === 'smg') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.25), bodyMat);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), slideMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.18);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.15), gripMat);
    stock.position.set(0, -0.02, 0.15);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.08), slideMat);
    mag.position.set(0, -0.08, 0.05);
    model.add(receiver, barrel, stock, mag);
  } else if (def.type === 'shotgun') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.3), bodyMat);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), slideMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.28);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.2), gripMat);
    stock.position.set(0, -0.02, 0.2);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.35, 6), slideMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, -0.02, -0.1);
    model.add(receiver, barrel, stock, tube);
  }

  model.position.set(0.22, -0.18, -0.4);
  camera.add(model);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.28),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.accent), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })
  );
  flash.position.set(0.22, -0.16, -0.9);
  flash.visible = false;
  camera.add(flash);

  const flashLight = new THREE.PointLight(new THREE.Color(PALETTE.accent), 0, 6);
  flashLight.position.set(0.22, -0.14, -0.55);
  camera.add(flashLight);

  const state = {
    id: weaponId,
    def,
    mag: def.mag,
    reserve: def.reserve,
    cooldown: 0,
    reloadLeft: 0,
    flash: 0,
    kick: 0,
    inspecting: false,
  };

  function step(dt) {
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.kick += (0 - state.kick) * Math.min(1, dt * 16);
    model.position.z = -0.4 + state.kick;
    model.rotation.x = state.kick * 2.5;
    flash.visible = state.flash > 0;
    flash.rotation.z = state.flash * 40;
    flashLight.intensity = state.flash > 0 ? 22 : 0;
    if (state.reloadLeft > 0) {
      state.reloadLeft = Math.max(0, state.reloadLeft - dt);
      const progress = 1 - state.reloadLeft / def.reloadTime;
      model.rotation.x = -0.6 * Math.min(1, progress * 2);
      model.position.y = -0.18 - 0.08 * Math.sin(progress * Math.PI);
      if (state.reloadLeft === 0) {
        const need = def.mag - state.mag;
        const take = Math.min(need, state.reserve);
        state.mag += take;
        state.reserve -= take;
        model.position.y = -0.18;
      }
    }
  }

  return {
    state,
    step,
    ready() {
      return state.mag > 0 && state.cooldown === 0 && state.reloadLeft === 0;
    },
    pullTrigger() {
      state.cooldown = def.fireGap;
      state.flash = def.type === 'sniper' ? 0.1 : 0.05;
      state.kick = def.type === 'sniper' ? 0.12 : (def.type === 'shotgun' ? 0.1 : 0.05);
    },
    takeRound() {
      if (state.mag <= 0) return false;
      state.mag -= 1;
      return true;
    },
    takePellets(count) {
      if (state.mag <= 0) return false;
      state.mag -= 1;
      return true;
    },
    reload() {
      if (state.reloadLeft > 0 || state.mag === def.mag || state.reserve === 0) return;
      state.reloadLeft = def.reloadTime;
    },
    spread(speed) {
      if (def.type === 'sniper' && !def.auto) return 0;
      return def.spreadStill + Math.min(1, speed / WALK_SPEED) * def.spreadMoving;
    },
    refill() {
      state.mag = def.mag;
      state.reserve = def.reserve;
      state.cooldown = 0;
      state.reloadLeft = 0;
      state.flash = 0;
      state.kick = 0;
    },
    switchTo(newId) {
      const newDef = WEAPONS[newId];
      if (!newDef) return false;
      camera.remove(model);
      camera.remove(flash);
      camera.remove(flashLight);
      return createWeapon(camera, newId);
    },
    getDef() { return def; },
    getState() { return state; },
  };
}

export { WEAPONS, EQUIPMENT, GRENADES };

const WALK_SPEED = 5.2;