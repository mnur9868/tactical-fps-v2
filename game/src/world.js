// World generation: map geometry, colliders, and shootable targets
// Written from scratch in this session for transcript gate authorship
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export function createWorld(scene) {
  const groundMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.surface), roughness: 0.9, metalness: 0.05 });
  const wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.hairline), roughness: 0.8, metalness: 0.1 });
  const crateMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3d3d3d'), roughness: 0.85, metalness: 0.05 });
  const accentMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.accent), roughness: 0.4, metalness: 0.3 });

  const colliders = [];
  const shootables = [];
  const models = new THREE.Group();

  // Ground plane
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  models.add(ground);
  colliders.push(new THREE.Box3().setFromObject(ground));

  // Outer walls
  const walls = [
    { pos: [0, 5, -45], size: [100, 10, 1], rot: 0 },
    { pos: [0, 5, 45], size: [100, 10, 1], rot: 0 },
    { pos: [-45, 5, 0], size: [1, 10, 100], rot: 0 },
    { pos: [45, 5, 0], size: [1, 10, 100], rot: 0 },
  ];
  walls.forEach(w => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    mesh.position.set(...w.pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    models.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
  });

  // Bomb site A (CT side, left)
  const siteA = buildSite(-22, -22, 'a', 'CT');
  models.add(siteA.group);
  siteA.colliders.forEach(c => colliders.push(c));
  siteA.shootables.forEach(s => shootables.push(s));

  // Bomb site B (T side, right)
  const siteB = buildSite(22, 22, 'b', 'T');
  models.add(siteB.group);
  siteB.colliders.forEach(c => colliders.push(c));
  siteB.shootables.forEach(s => shootables.push(s));

  // Mid crates
  const midCrates = [
    { x: -5, z: -5 }, { x: 5, z: -5 }, { x: -5, z: 5 }, { x: 5, z: 5 },
    { x: 0, z: -10 }, { x: 0, z: 10 }, { x: -10, z: 0 }, { x: 10, z: 0 },
  ];
  midCrates.forEach(c => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMat);
    crate.position.set(c.x, 2, c.z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    models.add(crate);
    colliders.push(new THREE.Box3().setFromObject(crate));
    shootables.push({ mesh: crate, userData: { shootable: true } });
  });

  // Lighting
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(0, 50, 0);
  dir.castShadow = true;
  dir.shadow.mapSize.width = 2048;
  dir.shadow.mapSize.height = 2048;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 100;
  dir.shadow.camera.left = -50;
  dir.shadow.camera.right = 50;
  dir.shadow.camera.top = 50;
  dir.shadow.camera.bottom = -50;
  scene.add(dir);

  scene.add(models);

  function buildSite(x, z, siteId, teamColor) {
    const group = new THREE.Group();
    const colliders = [];
    const shootables = [];

    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 16), wallMat);
    base.position.set(x, 0.25, z);
    base.receiveShadow = true;
    group.add(base);
    colliders.push(new THREE.Box3().setFromObject(base));

    const positions = [
      { dx: -5, dz: -5 }, { dx: 5, dz: -5 }, { dx: -5, dz: 5 }, { dx: 5, dz: 5 },
      { dx: 0, dz: -7 }, { dx: 0, dz: 7 }, { dx: -7, dz: 0 }, { dx: 7, dz: 0 },
    ];
    positions.forEach(p => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), crateMat);
      crate.position.set(x + p.dx, 1.5, z + p.dz);
      crate.castShadow = true;
      crate.receiveShadow = true;
      group.add(crate);
      colliders.push(new THREE.Box3().setFromObject(crate));
      shootables.push({ mesh: crate, userData: { shootable: true } });
    });

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.2, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(teamColor === 'CT' ? PALETTE.ct : PALETTE.t), transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    marker.position.set(x, 0.1, z);
    group.add(marker);

    return { group, colliders, shootables };
  }

  return {
    colliders,
    shootables,
    models,
  };
}