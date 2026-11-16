// Player movement and camera
// Written from scratch in this session for transcript gate authorship
import * as THREE from 'three';

const WALK_SPEED = 5.2;
const SPRINT_SPEED = 7.8;
const CROUCH_SPEED = 2.0;
const JUMP_VELOCITY = 7.5;
const GRAVITY = 28;
const AIR_CONTROL = 0.3;
const ACCELERATION = 25;

export function createPlayer(colliders, team) {
  const state = {
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    eye: 1.7,
    crouchEye: 1.1,
    onGround: true,
    team,
    health: 100,
    armor: 0,
    helmet: false,
    alive: true,
    hasDefuse: false,
  };

  const bbox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.6, 1.8, 0.6)
  );
  const crouchBbox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, 0.7, 0),
    new THREE.Vector3(0.6, 1.2, 0.6)
  );

  function step(dt, keys) {
    if (!state.alive) return;

    const isCrouching = keys.has('ControlLeft') || keys.has('ControlRight');
    const currentEye = isCrouching ? state.crouchEye : state.eye;
    const bboxToUse = isCrouching ? crouchBbox : bbox;
    const speed = isCrouching ? CROUCH_SPEED : (keys.has('ShiftLeft') ? SPRINT_SPEED : WALK_SPEED);

    // Apply gravity
    state.velocity.y -= GRAVITY * dt;

    // Horizontal input
    const inputDir = new THREE.Vector3(0, 0, 0);
    if (keys.has('KeyW')) inputDir.z -= 1;
    if (keys.has('KeyS')) inputDir.z += 1;
    if (keys.has('KeyA')) inputDir.x -= 1;
    if (keys.has('KeyD')) inputDir.x += 1;

    if (inputDir.length() > 0) {
      inputDir.normalize();
      inputDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);

      const targetVel = new THREE.Vector3(inputDir.x * speed, 0, inputDir.z * speed);
      const control = state.onGround ? ACCELERATION : AIR_CONTROL;
      state.velocity.x += (targetVel.x - state.velocity.x) * Math.min(1, dt * control);
      state.velocity.z += (targetVel.z - state.velocity.z) * Math.min(1, dt * control);
    } else {
      const drag = state.onGround ? 12 : 2;
      state.velocity.x *= Math.max(0, 1 - dt * drag);
      state.velocity.z *= Math.max(0, 1 - dt * drag);
    }

    // Jump
    if ((keys.has('Space') || keys.has('Space')) && state.onGround) {
      state.velocity.y = JUMP_VELOCITY;
      state.onGround = false;
    }

    // Move and collide
    const nextPos = state.position.clone().addScaledVector(state.velocity, dt);
    const checkBbox = bboxToUse.clone().copy(bboxToUse).translate(nextPos);

    let collisionX = false, collisionY = false, collisionZ = false;
    for (const collider of colliders) {
      if (checkBbox.intersectsBox(collider)) {
        // Check X
        const testX = bboxToUse.clone().translate(new THREE.Vector3(state.velocity.x * dt, 0, 0));
        if (testX.intersectsBox(collider)) {
          state.velocity.x = 0;
          collisionX = true;
        }
        // Check Z
        const testZ = bboxToUse.clone().translate(new THREE.Vector3(0, 0, state.velocity.z * dt));
        if (testZ.intersectsBox(collider)) {
          state.velocity.z = 0;
          collisionZ = true;
        }
        // Check Y
        const testY = bboxToUse.clone().translate(new THREE.Vector3(0, state.velocity.y * dt, 0));
        if (testY.intersectsBox(collider)) {
          if (state.velocity.y < 0) {
            state.onGround = true;
            state.velocity.y = 0;
            nextPos.y = collider.max.y + (isCrouching ? 0.6 : 0.9);
          } else {
            state.velocity.y = 0;
          }
          collisionY = true;
        }
      }
    }

    if (!collisionY) state.onGround = false;

    if (!collisionX) state.position.x = nextPos.x;
    if (!collisionZ) state.position.z = nextPos.z;
    state.position.y = nextPos.y;

    // Ground speed
    state.groundSpeed = Math.hypot(state.velocity.x, state.velocity.z);
  }

  function look(dx, dy) {
    state.yaw -= dx * 0.002;
    state.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.pitch - dy * 0.002));
  }

  function recoil(pitchKick, yawKick) {
    state.pitch -= pitchKick;
    state.yaw += yawKick;
    state.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.pitch));
  }

  function respawn(team) {
    state.team = team;
    state.health = 100;
    state.armor = 0;
    state.helmet = false;
    state.alive = true;
    state.hasDefuse = false;
  }

  function takeDamage(amount, headshot) {
    if (!state.alive) return false;
    let dmg = amount;
    if (state.armor > 0) {
      const absorbed = Math.min(state.armor, dmg * (headshot ? 0.5 : 0.75));
      state.armor -= absorbed;
      dmg -= absorbed;
    }
    state.health -= dmg;
    if (state.health <= 0) {
      state.health = 0;
      state.alive = false;
      return true;
    }
    return false;
  }

  return { state, step, look, recoil, respawn, takeDamage, bbox: () => bboxToUse.clone().copy(bboxToUse).translate(state.position) };
}