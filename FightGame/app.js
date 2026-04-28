import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("game-canvas");
const menuOverlay = document.getElementById("main-menu");
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");
const loadMapButton = document.getElementById("load-map-button");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingStatus = document.getElementById("loading-status");

const ui = {
  playerHealthFill: document.getElementById("player-health-fill"),
  playerStatus: document.getElementById("player-status"),
  roundStatus: document.getElementById("round-status"),
  enemyHealth: document.getElementById("enemy-health"),
  enemyHealthFill: document.getElementById("enemy-health-fill")
};

function createMove({ range, damage, cooldown, startup, active, recovery }) {
  return {
    range,
    damage,
    cooldown,
    startup,
    active,
    recovery,
    duration: startup + active + recovery
  };
}

const mapConfig = {
  url: "./assets/small_warehouse.glb",
  position: new THREE.Vector3(0, 0, 0),
  rotationY: 0,
  scale: 1,
  clampPadding: 2.5,
  defaultBounds: {
    minX: -16,
    maxX: 16,
    minZ: -16,
    maxZ: 16
  },
  defaultPlayerSpawn: new THREE.Vector3(0, 0, 6),
  defaultNpcSpawn: new THREE.Vector3(0, 0, -2.5)
};

const characterConfig = {
  playerModelUrl: "./assets/player.glb",
  playerScale: 1,
  playerTargetHeight: 2.15,
  playerOffsetY: 0,
  playerRotationY: Math.PI
};

const fighterRig = {
  worldY: 0.45,
  rootY: 0.2,

  shoulderX: 0.39,
  shoulderY: 1.10,
  shoulderZ: 0.02,

  upperArmRadius: 0.095,
  upperArmLength: 0.42,
  upperArmOffsetY: -0.3,

  elbowY: -0.6,

  foreArmRadius: 0.082,
  foreArmLength: 0.4,
  foreArmOffsetY: -0.28,

  handRadius: 0.11,
  handY: -0.54,
  handZ: 0.02,

  hipX: 0.16,
  hipY: 0.92,

  upperLegRadius: 0.11,
  upperLegLength: 0.52,
  upperLegOffsetY: -0.38,

  kneeY: -0.76,

  lowerLegRadius: 0.085,
  lowerLegLength: 0.5,
  lowerLegOffsetY: -0.34,

  footWidth: 0.24,
  footHeight: 0.11,
  footLength: 0.46,
  footY: -0.7,
  footZ: 0.08,

  hipsWidth: 0.52,
  hipsHeight: 0.28,
  hipsDepth: 0.3,
  hipsY: 1.02,

  torsoPivotY: 1.1,
  torsoRadius: 0.3,
  torsoLength: 0.62,
  torsoScaleX: 1.15,
  torsoScaleY: 1,
  torsoScaleZ: 0.72,
  torsoY: 0.55,

  abdomenWidth: 0.32,
  abdomenHeight: 0.16,
  abdomenDepth: 0.07,
  abdomenY: 0.22,
  abdomenZ: 0.24,

  neckTopY: 1.0,
  neckRadiusTop: 0.09,
  neckRadiusBottom: 0.1,
  neckHeight: 0.14,

  headPivotY: 1.1,
  headRadius: 0.23,
  headY: 0.18,
  headScaleX: 0.95,
  headScaleY: 1.08,
  headScaleZ: 0.92,

  jawWidth: 0.22,
  jawHeight: 0.12,
  jawDepth: 0.18,
  jawY: -0.02,
  jawZ: 0.1,

  noseWidth: 0.05,
  noseHeight: 0.07,
  noseDepth: 0.06,
  noseY: 0.08,
  noseZ: 0.22,

  stanceTorsoLean: 0.1,
  stanceHeadTilt: -0.04,
  stanceLeadShoulderZ: -0.18,
  stanceRearShoulderZ: 0.22,
  stanceLeadShoulderX: -0.26,
  stanceRearShoulderX: -0.18,
  stanceLeadShoulderY: 0.05,
  stanceRearShoulderY: -0.02,
  stanceLeadElbowX: -1.26,
  stanceRearElbowX: -1.34,
  stanceLeadElbowY: -0.08,
  stanceRearElbowY: -0.12,
  stancePelvisY: 0.035,
  stanceHipOffsetX: -0.06,
  stanceLeadFootZ: 0.18,
  stanceRearFootZ: -0.16,
  stanceLeadFootX: 0.04,
  stanceRearFootX: -0.03,
  stancePelvisYaw: -0.18,
  stanceTorsoYaw: -0.26,

  freeAcceleration: 18,
  freeDrag: 7,
  combatAcceleration: 26,
  combatDrag: 16,
  combatMaxSpeed: 4.6,
  freeMaxSpeed: 6.35,
  locomotionLean: 0.12,
  strafeLean: 0.14,
  pelvisTwist: 0.1,
  plantedThreshold: 0.12,
  combatStepHeight: 0.008,
  freeStepHeight: 0.016,
  combatStepSwing: 0.12,
  freeStepSwing: 0.22
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e131a);
scene.fog = new THREE.Fog(0x0e131a, 18, 42);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

const hemiLight = new THREE.HemisphereLight(0xa9d6ff, 0x1b1f25, 1.45);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
dirLight.position.set(10, 18, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 60;
dirLight.shadow.camera.left = -18;
dirLight.shadow.camera.right = 18;
dirLight.shadow.camera.top = 18;
dirLight.shadow.camera.bottom = -18;
scene.add(dirLight);

const loader = new GLTFLoader();
const world = {
  mapRoot: null,
  poiRoot: new THREE.Group(),
  poiZones: [],
  activePoi: null,
  bounds: { ...mapConfig.defaultBounds },
  playerSpawn: mapConfig.defaultPlayerSpawn.clone(),
  npcSpawn: mapConfig.defaultNpcSpawn.clone(),
  loaded: false,
  loading: false
};

scene.add(world.poiRoot);

const fallbackArena = new THREE.Group();
scene.add(fallbackArena);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80, 40, 40),
  new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.95, metalness: 0.05 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
fallbackArena.add(floor);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(2.8, 3.15, 64),
  new THREE.MeshBasicMaterial({ color: 0xffad66, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.03;
scene.add(ring);

for (let i = -4; i <= 4; i += 1) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.02, 80),
    new THREE.MeshStandardMaterial({ color: 0x404854, roughness: 1 })
  );
  line.position.set(i * 4, 0.01, 0);
  line.receiveShadow = true;
  fallbackArena.add(line);

  const lineCross = new THREE.Mesh(
    new THREE.BoxGeometry(80, 0.02, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x404854, roughness: 1 })
  );
  lineCross.position.set(0, 0.01, i * 4);
  lineCross.receiveShadow = true;
  fallbackArena.add(lineCross);
}

addMapPois(new THREE.Vector3(0, 0, 0), new THREE.Vector3(32, 0, 32));

function capsule(radius, length, material, radialSegments = 12, capSegments = 6) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments), material);
  mesh.castShadow = true;
  return mesh;
}

function createArm(side, sleeveMat, wrapMat) {
  const shoulder = new THREE.Group();

  const upperArm = capsule(fighterRig.upperArmRadius, fighterRig.upperArmLength, sleeveMat, 14, 8);
  upperArm.rotation.z = Math.PI;
  upperArm.position.y = fighterRig.upperArmOffsetY;
  shoulder.add(upperArm);

  const elbow = new THREE.Group();
  elbow.position.y = fighterRig.elbowY;
  shoulder.add(elbow);

  const foreArm = capsule(fighterRig.foreArmRadius, fighterRig.foreArmLength, sleeveMat, 14, 8);
  foreArm.rotation.z = Math.PI;
  foreArm.position.y = fighterRig.foreArmOffsetY;
  elbow.add(foreArm);

  const hand = new THREE.Mesh(new THREE.SphereGeometry(fighterRig.handRadius, 18, 18), wrapMat);
  hand.position.set(0, fighterRig.handY, fighterRig.handZ);
  hand.castShadow = true;
  elbow.add(hand);

  shoulder.position.set(side * fighterRig.shoulderX, fighterRig.shoulderY, fighterRig.shoulderZ);
  return { shoulder, elbow, upperArm, foreArm, hand };
}

function createLeg(side, pantsMat, shoeMat) {
  const hip = new THREE.Group();

  const upperLeg = capsule(fighterRig.upperLegRadius, fighterRig.upperLegLength, pantsMat, 14, 8);
  upperLeg.rotation.z = Math.PI;
  upperLeg.position.y = fighterRig.upperLegOffsetY;
  hip.add(upperLeg);

  const knee = new THREE.Group();
  knee.position.y = fighterRig.kneeY;
  hip.add(knee);

  const lowerLeg = capsule(fighterRig.lowerLegRadius, fighterRig.lowerLegLength, pantsMat, 14, 8);
  lowerLeg.rotation.z = Math.PI;
  lowerLeg.position.y = fighterRig.lowerLegOffsetY;
  knee.add(lowerLeg);

  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(fighterRig.footWidth, fighterRig.footHeight, fighterRig.footLength),
    shoeMat
  );
  foot.position.set(0, fighterRig.footY, fighterRig.footZ);
  foot.castShadow = true;
  knee.add(foot);

  hip.position.set(side * fighterRig.hipX, fighterRig.hipY, 0);
  return { hip, knee, upperLeg, lowerLeg, foot };
}

function createFighter({ skin, shirt, pants, wraps, shoes }) {
  const root = new THREE.Group();
  root.position.y = fighterRig.rootY;

  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.72, metalness: 0.03 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.76, metalness: 0.04 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.84, metalness: 0.02 });
  const wrapsMat = new THREE.MeshStandardMaterial({ color: wraps, roughness: 0.45, metalness: 0.03 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: 0.9, metalness: 0.01 });

  const pelvis = new THREE.Group();
  root.add(pelvis);

  const hips = new THREE.Mesh(
    new THREE.BoxGeometry(fighterRig.hipsWidth, fighterRig.hipsHeight, fighterRig.hipsDepth),
    pantsMat
  );
  hips.position.y = fighterRig.hipsY;
  hips.castShadow = true;
  pelvis.add(hips);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = fighterRig.torsoPivotY;
  pelvis.add(torsoPivot);

  const torso = capsule(fighterRig.torsoRadius, fighterRig.torsoLength, shirtMat, 16, 10);
  torso.scale.set(fighterRig.torsoScaleX, fighterRig.torsoScaleY, fighterRig.torsoScaleZ);
  torso.position.y = fighterRig.torsoY;
  torsoPivot.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.12), shirtMat);
  chest.position.set(0, 0.76, 0.12);
  chest.castShadow = true;
  torsoPivot.add(chest);

  const abdomen = new THREE.Mesh(
    new THREE.BoxGeometry(fighterRig.abdomenWidth, fighterRig.abdomenHeight, fighterRig.abdomenDepth),
    wrapsMat
  );
  abdomen.position.set(0, fighterRig.abdomenY, fighterRig.abdomenZ);
  abdomen.castShadow = true;
  torsoPivot.add(abdomen);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(fighterRig.neckRadiusTop, fighterRig.neckRadiusBottom, fighterRig.neckHeight, 12),
    skinMat
  );
  neck.position.y = fighterRig.neckTopY;
  neck.castShadow = true;
  torsoPivot.add(neck);

  const headPivot = new THREE.Group();
  headPivot.position.y = fighterRig.headPivotY;
  torsoPivot.add(headPivot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(fighterRig.headRadius, 24, 24), skinMat);
  head.position.y = fighterRig.headY;
  head.scale.set(fighterRig.headScaleX, fighterRig.headScaleY, fighterRig.headScaleZ);
  head.castShadow = true;
  headPivot.add(head);

  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(fighterRig.jawWidth, fighterRig.jawHeight, fighterRig.jawDepth),
    skinMat
  );
  jaw.position.set(0, fighterRig.jawY, fighterRig.jawZ);
  jaw.castShadow = true;
  headPivot.add(jaw);

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(fighterRig.noseWidth, fighterRig.noseHeight, fighterRig.noseDepth),
    skinMat
  );
  nose.position.set(0, fighterRig.noseY, fighterRig.noseZ);
  nose.castShadow = true;
  headPivot.add(nose);

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.03), skinMat);
  brow.position.set(0, 0.17, 0.17);
  brow.castShadow = true;
  headPivot.add(brow);

  const leftArm = createArm(-1, shirtMat, wrapsMat);
  const rightArm = createArm(1, shirtMat, wrapsMat);
  torsoPivot.add(leftArm.shoulder);
  torsoPivot.add(rightArm.shoulder);

  const leftLeg = createLeg(-1, pantsMat, shoeMat);
  const rightLeg = createLeg(1, pantsMat, shoeMat);
  pelvis.add(leftLeg.hip);
  pelvis.add(rightLeg.hip);

  return {
    root,
    pelvis,
    torsoPivot,
    headPivot,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    materials: { shirtMat, wrapsMat }
  };
}

const playerVisual = createFighter({
  skin: 0xb97858,
  shirt: 0x3d7be0,
  pants: 0x1f2a3a,
  wraps: 0xf4f7fb,
  shoes: 0x15181c
});

const npcVisual = createFighter({
  skin: 0x8e6148,
  shirt: 0xd95f5f,
  pants: 0x312328,
  wraps: 0xf6ddcc,
  shoes: 0x18191b
});

scene.add(playerVisual.root);
scene.add(npcVisual.root);

const characterModels = {
  player: null
};

const player = {
  position: new THREE.Vector3(0, 0, 6),
  velocity: new THREE.Vector3(),
  facing: Math.PI,
  animMoveX: 0,
  animMoveZ: 0,
  animSpeed: 0,
  turnVelocity: 0,
  radius: 0.62,
  health: 100,
  maxHealth: 100,
  combatMode: false,
  action: "Idle",
  attackCooldown: 0,
  attackTimer: 0,
  attackElapsed: 0,
  currentAttack: null,
  jab: createMove({ range: 2.1, damage: 8, cooldown: 0.3, startup: 0.06, active: 0.07, recovery: 0.14 }),
  straight: createMove({ range: 2.6, damage: 14, cooldown: 0.52, startup: 0.1, active: 0.08, recovery: 0.22 }),
  leadKick: createMove({ range: 2.35, damage: 12, cooldown: 0.6, startup: 0.13, active: 0.09, recovery: 0.24 })
};

const npc = {
  position: new THREE.Vector3(0, 0, -2.5),
  velocity: new THREE.Vector3(),
  facing: Math.PI,
  radius: 0.62,
  health: 100,
  maxHealth: 100,
  action: "Idle",
  hitFlash: 0,
  attackCooldown: 0,
  attackTimer: 0,
  attackElapsed: 0,
  currentAttack: null,
  decisionTimer: 0,
  strafeBias: 1,
  jab: createMove({ range: 2.1, damage: 6, cooldown: 0.42, startup: 0.08, active: 0.06, recovery: 0.18 }),
  straight: createMove({ range: 2.55, damage: 10, cooldown: 0.72, startup: 0.14, active: 0.08, recovery: 0.26 }),
  leadKick: createMove({ range: 2.5, damage: 11, cooldown: 0.95, startup: 0.16, active: 0.1, recovery: 0.3 })
};

const controls = {
  pressed: new Set(),
  justPressed: new Set(),
  pointerDown: false,
  cameraYaw: Math.PI,
  cameraPitch: 0.52,
  radius: 7.5,
  paused: true
};

const cameraState = {
  target: new THREE.Vector3(0, 1.55, 6)
};

const matchState = {
  over: false,
  winner: null
};

startButton.addEventListener("click", () => {
  controls.paused = false;
  menuOverlay.classList.add("hidden");
  hideLoadingOverlay();
  ui.roundStatus.textContent = world.loaded
    ? "Map loaded. Fight space live."
    : "Prototype live. Fallback arena active.";
});

resetButton.addEventListener("click", () => {
  resetScene();
  controls.paused = true;
  menuOverlay.classList.remove("hidden");
  hideLoadingOverlay();
  ui.roundStatus.textContent = "Scene reset. Main menu ready.";
});
loadMapButton.addEventListener("click", () => {
  if (world.loaded || world.loading) {
    return;
  }

  controls.paused = false;
  menuOverlay.classList.add("hidden");
  showLoadingOverlay("Loading warehouse scene...");
  ui.roundStatus.textContent = "Loading warehouse scene. Please wait...";
  loadMap();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if ([" ", "shift", "escape"].includes(key)) {
    event.preventDefault();
  }
  if (!controls.pressed.has(key)) {
    controls.justPressed.add(key);
  }
  controls.pressed.add(key);

  if (key === "escape") {
    controls.paused = !controls.paused;
    menuOverlay.classList.toggle("hidden", !controls.paused);
  }
});

window.addEventListener("keyup", (event) => {
  controls.pressed.delete(event.key.toLowerCase());
});

canvas.addEventListener("pointerdown", () => {
  controls.pointerDown = true;
});

window.addEventListener("pointerup", () => {
  controls.pointerDown = false;
});

window.addEventListener("pointermove", (event) => {
  if (!controls.pointerDown || controls.paused) {
    return;
  }
  controls.cameraYaw -= event.movementX * 0.0055;
  controls.cameraPitch = THREE.MathUtils.clamp(controls.cameraPitch - event.movementY * 0.004, 0.2, 1.05);
});

window.addEventListener("resize", onResize);
onResize();
loadPlayerModel();
resetScene();

let lastTime = performance.now();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  if (!controls.paused) {
    update(dt);
  }

  animateVisuals(now * 0.001);
  updateTransforms();
  updateCamera();
  updateHud();
  renderer.render(scene, camera);
  controls.justPressed.clear();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (controls.justPressed.has("r")) {
    resetScene();
  }

  updatePoiState();

  if (matchState.over) {
    return;
  }

  player.combatMode = controls.pressed.has("shift");
  const inputX = (controls.pressed.has("d") ? 1 : 0) - (controls.pressed.has("a") ? 1 : 0);
  const inputZ = (controls.pressed.has("s") ? 1 : 0) - (controls.pressed.has("w") ? 1 : 0);

  const cameraForward = new THREE.Vector3(Math.sin(controls.cameraYaw), 0, Math.cos(controls.cameraYaw)).normalize();
  const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(-1);

  const freeMove = new THREE.Vector3()
    .addScaledVector(cameraRight, inputX)
    .addScaledVector(cameraForward, inputZ);

  const targetOffset = new THREE.Vector3().subVectors(npc.position, player.position);
  targetOffset.y = 0;
  const distanceToNpc = targetOffset.length();
  const hasTarget = distanceToNpc < 8;
  if (distanceToNpc > 0.0001) {
    npc.facing = rotateAngle(npc.facing, Math.atan2(player.position.x - npc.position.x, player.position.z - npc.position.z), dt * 8);
  }
  let desiredMove = new THREE.Vector3();

  if (player.combatMode && hasTarget) {
    const forward = targetOffset.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    desiredMove = new THREE.Vector3()
      .addScaledVector(right, inputX)
      .addScaledVector(forward, -inputZ);
    applyMovement(desiredMove, dt, fighterRig.combatMaxSpeed, true);
    faceTowards(npc.position, dt, 14);
    player.action = desiredMove.lengthSq() > 0.001 ? getCombatAction(inputX, inputZ) : player.attackTimer > 0 ? player.action : "Fight Idle";
  } else {
    desiredMove = freeMove;
    applyMovement(desiredMove, dt, player.combatMode ? fighterRig.combatMaxSpeed : fighterRig.freeMaxSpeed, false);
    if (desiredMove.lengthSq() > 0.001) {
      const desiredFacing = Math.atan2(desiredMove.x, desiredMove.z);
      player.facing = rotateAngle(player.facing, desiredFacing, dt * (player.combatMode ? 11 : 9.5));
      player.action = player.attackTimer > 0 ? player.action : "Move";
    } else if (player.attackTimer <= 0) {
      player.action = player.combatMode ? "Fight Idle" : "Idle";
    }
  }

  if (controls.justPressed.has(" ")) {
    performAttack(player.jab, "Jab");
  }

  if (controls.justPressed.has("f")) {
    performAttack(player.straight, "Right Cross");
  }

  if (controls.justPressed.has("g")) {
    performAttack(player.leadKick, "Lead Leg Kick");
  }

  resolveFighterCollision(player, npc);

  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  if (player.currentAttack) {
    const attack = player.currentAttack;
    const previousElapsed = player.attackElapsed;
    player.attackElapsed = Math.min(attack.move.duration, player.attackElapsed + dt);
    resolveAttackHit(player, npc, attack, previousElapsed, player.attackElapsed);
    player.attackTimer = Math.max(0, attack.move.duration - player.attackElapsed);
  } else {
    player.attackTimer = 0;
  }
  npc.hitFlash = Math.max(0, npc.hitFlash - dt);
  npc.attackCooldown = Math.max(0, npc.attackCooldown - dt);
  if (npc.currentAttack) {
    const attack = npc.currentAttack;
    const previousElapsed = npc.attackElapsed;
    npc.attackElapsed = Math.min(attack.move.duration, npc.attackElapsed + dt);
    resolveAttackHit(npc, player, attack, previousElapsed, npc.attackElapsed);
    npc.attackTimer = Math.max(0, attack.move.duration - npc.attackElapsed);
  } else {
    npc.attackTimer = 0;
  }

  updateNpcAi(dt, distanceToNpc);

  if (player.attackTimer <= 0 && (player.action === "Jab" || player.action === "Right Cross" || player.action === "Lead Leg Kick")) {
    if (player.currentAttack && !player.currentAttack.resultAnnounced) {
      ui.roundStatus.textContent = `${player.currentAttack.name} missed.`;
    }
    player.action = player.combatMode ? "Fight Idle" : "Idle";
    player.currentAttack = null;
    player.attackElapsed = 0;
  }

  if (npc.attackTimer <= 0 && (npc.action === "Jab" || npc.action === "Right Cross" || npc.action === "Lead Leg Kick")) {
    npc.action = "Fight Idle";
    npc.currentAttack = null;
    npc.attackElapsed = 0;
  }

  if (npc.health <= 0 && !matchState.over) {
    matchState.over = true;
    matchState.winner = "player";
    player.attackCooldown = 0;
    player.attackTimer = 0;
    player.attackElapsed = 0;
    player.currentAttack = null;
    player.action = "Idle";
    player.velocity.set(0, 0, 0);
    npc.velocity.set(0, 0, 0);
    npc.action = "Knocked Out";
    ui.roundStatus.textContent = "Knockout. Player wins. Press R to reset.";
  }

  if (player.health <= 0 && !matchState.over) {
    matchState.over = true;
    matchState.winner = "npc";
    npc.attackCooldown = 0;
    npc.attackTimer = 0;
    npc.attackElapsed = 0;
    npc.currentAttack = null;
    npc.action = "Idle";
    npc.velocity.set(0, 0, 0);
    player.attackCooldown = 0;
    player.attackTimer = 0;
    player.attackElapsed = 0;
    player.currentAttack = null;
    player.action = "Knocked Out";
    player.velocity.set(0, 0, 0);
    ui.roundStatus.textContent = "Knockout. Opponent wins. Press R to reset.";
  }

  if (desiredMove.lengthSq() <= 0.0001) {
    dampVelocity(dt, player.combatMode);
  }

  updateAnimationDrive(dt);
}

function applyFighterMovement(fighter, direction, dt, speed, inCombat) {
  const acceleration = inCombat ? fighterRig.combatAcceleration : fighterRig.freeAcceleration;
  const drag = inCombat ? fighterRig.combatDrag : fighterRig.freeDrag;

  if (direction.lengthSq() > 0.0001) {
    direction.normalize();
    const desiredVelocity = direction.multiplyScalar(speed);
    fighter.velocity.lerp(desiredVelocity, 1 - Math.exp(-acceleration * dt));
  } else {
    fighter.velocity.multiplyScalar(Math.exp(-drag * dt));
  }

  if (fighter.velocity.lengthSq() < fighterRig.plantedThreshold * fighterRig.plantedThreshold) {
    fighter.velocity.set(0, 0, 0);
  }

  fighter.position.addScaledVector(fighter.velocity, dt);
  fighter.position.x = THREE.MathUtils.clamp(fighter.position.x, world.bounds.minX, world.bounds.maxX);
  fighter.position.z = THREE.MathUtils.clamp(fighter.position.z, world.bounds.minZ, world.bounds.maxZ);
}

function applyMovement(direction, dt, speed, inCombat) {
  applyFighterMovement(player, direction, dt, speed, inCombat);
}

function dampVelocity(dt, inCombat) {
  const drag = inCombat ? fighterRig.combatDrag : fighterRig.freeDrag;
  player.velocity.multiplyScalar(Math.exp(-drag * dt));
  if (player.velocity.lengthSq() < fighterRig.plantedThreshold * fighterRig.plantedThreshold) {
    player.velocity.set(0, 0, 0);
  }
}

function updateNpcAi(dt, distanceToPlayer) {
  if (matchState.over || npc.health <= 0) {
    npc.velocity.multiplyScalar(Math.exp(-fighterRig.combatDrag * dt));
    return;
  }

  const toPlayer = new THREE.Vector3().subVectors(player.position, npc.position);
  toPlayer.y = 0;
  if (toPlayer.lengthSq() <= 0.0001) {
    npc.velocity.set(0, 0, 0);
    npc.action = npc.currentAttack ? npc.action : "Fight Idle";
    return;
  }

  const forward = toPlayer.clone().normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  npc.facing = rotateAngle(npc.facing, Math.atan2(forward.x, forward.z), dt * 9);
  npc.decisionTimer = Math.max(0, npc.decisionTimer - dt);

  if (npc.currentAttack) {
    npc.velocity.multiplyScalar(Math.exp(-fighterRig.combatDrag * dt));
    return;
  }

  if (npc.decisionTimer <= 0) {
    npc.decisionTimer = 0.35 + Math.random() * 0.35;
    if (Math.random() > 0.6) {
      npc.strafeBias *= -1;
    }
  }

  const desiredMove = new THREE.Vector3();
  if (distanceToPlayer > 2.7) {
    desiredMove.add(forward);
  } else if (distanceToPlayer < 1.45) {
    desiredMove.addScaledVector(forward, -1);
  } else {
    desiredMove.addScaledVector(right, npc.strafeBias * 0.9);
    desiredMove.addScaledVector(forward, distanceToPlayer > 2.15 ? 0.3 : -0.12);
  }

  applyFighterMovement(npc, desiredMove, dt, fighterRig.combatMaxSpeed * 0.72, true);

  if (npc.attackCooldown <= 0 && distanceToPlayer <= 2.6) {
    const attackRoll = Math.random();
    if (distanceToPlayer < 1.9 && attackRoll < 0.36) {
      performAttackFor(npc, npc.jab, "Jab");
    } else if (distanceToPlayer < 2.35 && attackRoll < 0.58) {
      performAttackFor(npc, npc.leadKick, "Lead Leg Kick");
    } else if (attackRoll < 0.72) {
      performAttackFor(npc, npc.straight, "Right Cross");
    }
  }

  if (!npc.currentAttack) {
    if (desiredMove.lengthSq() > 0.001) {
      const localX = desiredMove.dot(right);
      const localZ = -desiredMove.dot(forward);
      npc.action = getCombatAction(localX, localZ);
    } else {
      npc.action = "Fight Idle";
    }
  }
}

function updateAnimationDrive(dt) {
  const forward = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const localX = player.velocity.dot(right);
  const localZ = player.velocity.dot(forward);
  const max = player.combatMode ? fighterRig.combatMaxSpeed : fighterRig.freeMaxSpeed;
  const targetMoveX = THREE.MathUtils.clamp(localX / Math.max(max, 0.001), -1, 1);
  const targetMoveZ = THREE.MathUtils.clamp(localZ / Math.max(max, 0.001), -1, 1);
  const blend = 1 - Math.exp(-14 * dt);

  player.animMoveX = THREE.MathUtils.lerp(player.animMoveX, targetMoveX, blend);
  player.animMoveZ = THREE.MathUtils.lerp(player.animMoveZ, targetMoveZ, blend);
  player.animSpeed = THREE.MathUtils.lerp(player.animSpeed, player.velocity.length() / Math.max(max, 0.001), blend);
}

function resolveFighterCollision(a, b) {
  const delta = new THREE.Vector3().subVectors(b.position, a.position);
  delta.y = 0;
  const distance = delta.length();
  const minDistance = a.radius + b.radius;

  if (distance <= 0.0001 || distance >= minDistance) {
    return;
  }

  const push = (minDistance - distance) * 0.5;
  delta.normalize();
  a.position.addScaledVector(delta, -push);
  b.position.addScaledVector(delta, push);
}

function faceTowards(target, dt, turnSpeed) {
  const offset = new THREE.Vector3().subVectors(target, player.position);
  const desired = Math.atan2(offset.x, offset.z);
  player.facing = rotateAngle(player.facing, desired, dt * turnSpeed);
}

function rotateAngle(current, target, step) {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  if (Math.abs(diff) <= step) {
    return target;
  }
  return current + Math.sign(diff) * step;
}

function performAttack(move, actionName) {
  if (performAttackFor(player, move, actionName)) {
    ui.roundStatus.textContent = `${actionName} in motion.`;
  }
}

function performAttackFor(fighter, move, actionName) {
  const defender = fighter === player ? npc : player;
  if (matchState.over || defender.health <= 0 || fighter.attackCooldown > 0) {
    return false;
  }

  fighter.attackCooldown = move.cooldown;
  fighter.attackTimer = move.duration;
  fighter.attackElapsed = 0;
  fighter.action = actionName;
  fighter.currentAttack = {
    name: actionName,
    move,
    hitConnected: false,
    resultAnnounced: false
  };
  return true;
}

function resolveAttackHit(attacker, defender, attack, previousElapsed, currentElapsed) {
  if (attack.hitConnected || matchState.over || defender.health <= 0) {
    return;
  }

  const activeStart = attack.move.startup;
  const activeEnd = attack.move.startup + attack.move.active;
  const enteredActiveWindow = previousElapsed < activeEnd && currentElapsed >= activeStart;
  if (!enteredActiveWindow) {
    return;
  }

  const distance = attacker.position.distanceTo(defender.position);
  if (distance <= attack.move.range) {
    defender.health = Math.max(0, defender.health - attack.move.damage);
    defender.action = attack.name === "Jab" ? "Checked by Jab" : attack.name === "Right Cross" ? "Hit by Right Cross" : "Hit by Lead Kick";
    defender.hitFlash = 0.18;
    attack.hitConnected = true;
    attack.resultAnnounced = true;
    ui.roundStatus.textContent = attacker === player ? `${attack.name} landed.` : `Opponent ${attack.name.toLowerCase()} landed.`;
  }
}

function getCombatAction(inputX, inputZ) {
  if (Math.abs(inputX) > Math.abs(inputZ)) {
    return inputX < 0 ? "Strafe Left" : "Strafe Right";
  }
  return inputZ > 0 ? "Back Step" : "Forward Pressure";
}

function clearPois() {
  world.poiRoot.clear();
  world.poiZones = [];
  world.activePoi = null;
}

function addMapPois(center, size) {
  clearPois();

  const depth = Math.max(size.z || 20, 20);
  const width = Math.max(size.x || 20, 20);
  const specs = [
    {
      id: "gym",
      label: "Gym",
      color: 0x4f8cff,
      width: 6.8,
      height: 3.5,
      depth: 5.5,
      position: new THREE.Vector3(center.x - Math.min(width * 0.24, 10), 0, center.z + Math.min(depth * 0.28, 10)),
      blurb: "Gym entered. Training, sparring, and stat work can happen here."
    },
    {
      id: "shop",
      label: "Fight Shop",
      color: 0xf59e0b,
      width: 5.8,
      height: 3.1,
      depth: 4.8,
      position: new THREE.Vector3(center.x + Math.min(width * 0.24, 10), 0, center.z + Math.min(depth * 0.26, 9)),
      blurb: "Shop entered. Gear, wraps, gloves, and upgrades can be bought here."
    },
    {
      id: "food",
      label: "Food Spot",
      color: 0x34c759,
      width: 5.2,
      height: 2.9,
      depth: 4.6,
      position: new THREE.Vector3(center.x, 0, center.z - Math.min(depth * 0.3, 10)),
      blurb: "Food spot entered. Recovery, meals, and energy boosts can happen here."
    }
  ];

  for (const spec of specs) {
    addPoiBuilding(spec);
  }
}

function addPoiBuilding(spec) {
  const shell = new THREE.Group();
  shell.position.copy(spec.position);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x252a31, roughness: 0.92, metalness: 0.04 });
  const accentMat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.45, metalness: 0.18, emissive: spec.color, emissiveIntensity: 0.18 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x12161c, roughness: 0.88, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 1 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(spec.width, spec.height, spec.depth), wallMat);
  body.position.y = spec.height * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  shell.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(spec.width + 0.35, 0.22, spec.depth + 0.35), roofMat);
  roof.position.y = spec.height + 0.11;
  roof.castShadow = true;
  roof.receiveShadow = true;
  shell.add(roof);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(spec.width - 0.5, 0.08, spec.depth - 0.5), floorMat);
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  shell.add(floor);

  const entranceWidth = Math.min(1.8, spec.width * 0.3);
  const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(entranceWidth, 0.42, 0.16), accentMat);
  doorHeader.position.set(0, 2.35, spec.depth * 0.5 + 0.04);
  doorHeader.castShadow = true;
  shell.add(doorHeader);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(Math.min(spec.width * 0.58, 3), 0.5, 0.16), accentMat);
  sign.position.set(0, spec.height - 0.55, spec.depth * 0.5 + 0.05);
  sign.castShadow = true;
  shell.add(sign);

  const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.08), accentMat);
  leftWindow.position.set(-spec.width * 0.25, 1.65, spec.depth * 0.5 + 0.05);
  shell.add(leftWindow);

  const rightWindow = leftWindow.clone();
  rightWindow.position.x *= -1;
  shell.add(rightWindow);

  world.poiRoot.add(shell);
  world.poiZones.push({
    id: spec.id,
    label: spec.label,
    blurb: spec.blurb,
    center: spec.position.clone(),
    halfExtents: new THREE.Vector3(spec.width * 0.42, 2, spec.depth * 0.42)
  });
}

function updatePoiState() {
  let currentPoi = null;
  for (const poi of world.poiZones) {
    const insideX = Math.abs(player.position.x - poi.center.x) <= poi.halfExtents.x;
    const insideZ = Math.abs(player.position.z - poi.center.z) <= poi.halfExtents.z;
    if (insideX && insideZ) {
      currentPoi = poi;
      break;
    }
  }

  if (currentPoi && world.activePoi?.id !== currentPoi.id) {
    world.activePoi = currentPoi;
    ui.roundStatus.textContent = currentPoi.blurb;
  } else if (!currentPoi && world.activePoi) {
    world.activePoi = null;
    if (!controls.paused && !matchState.over) {
      ui.roundStatus.textContent = "Back outside. Fight district active.";
    }
  }
}

function updateTransforms() {
  const playerRootY = fighterRig.worldY + fighterRig.rootY;
  playerVisual.root.position.copy(player.position);
  playerVisual.root.position.y = playerRootY;
  playerVisual.root.rotation.y = player.facing;

  if (characterModels.player) {
    characterModels.player.position.copy(player.position);
    characterModels.player.position.y = playerRootY + characterConfig.playerOffsetY;
    characterModels.player.rotation.y = player.facing + characterConfig.playerRotationY;
  }

  npcVisual.root.position.copy(npc.position);
  npcVisual.root.position.y = fighterRig.worldY + fighterRig.rootY;
  npcVisual.root.rotation.y = npc.facing;

  ring.position.set(npc.position.x, 0.03, npc.position.z);
}

function animateVisuals(time) {
  if (!characterModels.player) {
    animateFighter(playerVisual, player, time, false);
  }
  animateFighter(npcVisual, npc, time, true);
}

function animateFighter(visual, fighter, time, isNpc) {
  const moveAlpha = fighter === player
    ? THREE.MathUtils.clamp(fighter.animSpeed, 0, 1)
    : THREE.MathUtils.clamp(fighter.velocity.length() / Math.max(fighterRig.combatMaxSpeed * 0.72, 0.001), 0, 1);
  const inCombat = fighter.action.includes("Fight") || fighter.action.includes("Strafe") || fighter.action.includes("Pressure") || fighter.action.includes("Back") || fighter.action === "Jab" || fighter.action === "Right Cross" || fighter.action === "Lead Leg Kick";
  const cadence = inCombat ? 8.1 : 6.1;
  const moveX = fighter === player ? fighter.animMoveX : 0;
  const moveZ = fighter === player ? fighter.animMoveZ : 0;
  const stepSwing = inCombat ? fighterRig.combatStepSwing : fighterRig.freeStepSwing;
  const walkSwing = Math.sin(time * cadence) * stepSwing * Math.max(Math.abs(moveZ), moveAlpha * 0.75);
  const strafeSwing = Math.sin(time * cadence + Math.PI / 2) * 0.09 * Math.abs(moveX) * (inCombat ? 1 : 0.35);
  const bounce = Math.sin(time * cadence) * (inCombat ? fighterRig.combatStepHeight : fighterRig.freeStepHeight) * moveAlpha + (inCombat ? fighterRig.stancePelvisY : 0);
  const sway = Math.cos(time * cadence) * (inCombat ? 0.016 : 0.02) * moveAlpha + moveX * (inCombat ? 0.015 : 0.025);
  const idleBreath = Math.sin(time * 2) * 0.01;
  const plantedAlpha = moveAlpha < 0.08 ? 1 : 0;

  visual.pelvis.position.y = plantedAlpha ? fighterRig.stancePelvisY : bounce;
  visual.pelvis.position.x = plantedAlpha ? fighterRig.stanceHipOffsetX : sway;
  visual.pelvis.rotation.z = plantedAlpha ? 0 : -moveX * 0.04;
  visual.torsoPivot.rotation.x = THREE.MathUtils.lerp(visual.torsoPivot.rotation.x, inCombat ? fighterRig.stanceTorsoLean : 0.03 + idleBreath, 0.18);
  visual.headPivot.rotation.x = THREE.MathUtils.lerp(visual.headPivot.rotation.x, inCombat ? fighterRig.stanceHeadTilt : idleBreath * 0.8, 0.18);

  visual.leftLeg.hip.position.x = -fighterRig.hipX + (inCombat ? fighterRig.stanceRearFootX : 0);
  visual.rightLeg.hip.position.x = fighterRig.hipX + (inCombat ? fighterRig.stanceLeadFootX : 0);
  visual.leftLeg.hip.position.z = inCombat ? fighterRig.stanceRearFootZ : 0;
  visual.rightLeg.hip.position.z = inCombat ? fighterRig.stanceLeadFootZ : 0;
  visual.leftLeg.hip.rotation.x = plantedAlpha ? 0.06 : walkSwing - strafeSwing + Math.max(0, -moveZ) * 0.08;
  visual.rightLeg.hip.rotation.x = plantedAlpha ? -0.08 : -walkSwing - strafeSwing + Math.max(0, moveZ) * 0.05;
  visual.leftLeg.knee.rotation.x = plantedAlpha ? 0.08 : Math.max(0, -walkSwing) * 0.75 + Math.abs(moveX) * 0.08;
  visual.rightLeg.knee.rotation.x = plantedAlpha ? 0.08 : Math.max(0, walkSwing) * 0.75 + Math.abs(moveX) * 0.08;
  visual.leftLeg.hip.rotation.z = plantedAlpha ? -0.06 : -sway * 0.35 - moveX * 0.06;
  visual.rightLeg.hip.rotation.z = plantedAlpha ? 0.03 : sway * 0.35 - moveX * 0.06;

  visual.leftArm.shoulder.rotation.x = (inCombat ? fighterRig.stanceLeadShoulderX : 0) - walkSwing * 0.24 + moveZ * 0.06;
  visual.rightArm.shoulder.rotation.x = (inCombat ? fighterRig.stanceRearShoulderX : 0) + walkSwing * 0.24 - moveZ * 0.03;
  visual.leftArm.shoulder.rotation.y = inCombat ? fighterRig.stanceLeadShoulderY : 0;
  visual.rightArm.shoulder.rotation.y = inCombat ? fighterRig.stanceRearShoulderY : 0;
  visual.leftArm.elbow.rotation.x = inCombat ? fighterRig.stanceLeadElbowX : -0.08;
  visual.rightArm.elbow.rotation.x = inCombat ? fighterRig.stanceRearElbowX : -0.08;
  visual.leftArm.elbow.rotation.y = inCombat ? fighterRig.stanceLeadElbowY : 0;
  visual.rightArm.elbow.rotation.y = inCombat ? fighterRig.stanceRearElbowY : 0;
  visual.leftArm.shoulder.rotation.z = inCombat ? fighterRig.stanceLeadShoulderZ : -0.03;
  visual.rightArm.shoulder.rotation.z = inCombat ? fighterRig.stanceRearShoulderZ : 0.03;
  visual.torsoPivot.rotation.y = (inCombat ? fighterRig.stanceTorsoYaw : 0) + moveX * fighterRig.strafeLean + moveZ * fighterRig.pelvisTwist;
  visual.pelvis.rotation.y = (inCombat ? fighterRig.stancePelvisYaw : 0) + moveX * (fighterRig.pelvisTwist * 0.75);
  visual.leftArm.shoulder.rotation.y += moveX * 0.03;
  visual.rightArm.shoulder.rotation.y += moveX * 0.03;
  visual.headPivot.rotation.y = inCombat ? 0 : Math.sin(time * 1.4) * 0.03;

  if (fighter.action === "Jab" || fighter.action === "Right Cross" || fighter.action === "Lead Leg Kick") {
    const move = fighter.currentAttack?.move || (fighter.action === "Jab" ? fighter.jab : fighter.action === "Right Cross" ? fighter.straight : fighter.leadKick);
    const progress = move.duration > 0 ? fighter.attackElapsed / move.duration : 1;
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    if (fighter.action === "Lead Leg Kick") {
      applyLeadKickPose(visual, clamped);
    } else {
      applyPunchPose(visual, clamped, fighter.action === "Right Cross");
    }
  }

  if (isNpc) {
    const pulse = Math.sin(time * 2.2) * 0.04;
    visual.headPivot.rotation.z = pulse * 0.25;
    visual.torsoPivot.position.z = fighter.hitFlash > 0 ? 0.08 : 0;
    visual.materials.shirtMat.emissive.setHex(fighter.hitFlash > 0 ? 0x3a0d0d : 0x000000);
  } else {
    visual.headPivot.rotation.z = 0;
    visual.torsoPivot.position.z = 0;
  }
}

function applyPunchPose(visual, progress, isStraight) {
  const anticipation = Math.sin(Math.min(progress, 0.22) / 0.22 * Math.PI * 0.5);
  const strikeProgress = THREE.MathUtils.clamp((progress - 0.12) / 0.88, 0, 1);
  const peak = Math.sin(strikeProgress * Math.PI);

  const leftShoulder = visual.leftArm.shoulder;
  const leftElbow = visual.leftArm.elbow;
  const rightShoulder = visual.rightArm.shoulder;
  const rightElbow = visual.rightArm.elbow;

  if (isStraight) {
    rightShoulder.rotation.x = fighterRig.stanceRearShoulderX + 0.04 * anticipation - 0.72 * peak;
    rightElbow.rotation.x = fighterRig.stanceRearElbowX + 0.2 * anticipation + 0.92 * peak;
    rightShoulder.rotation.y = fighterRig.stanceRearShoulderY - 0.06 * peak;
    rightShoulder.rotation.z = fighterRig.stanceRearShoulderZ - 0.12 * peak;

    leftShoulder.rotation.x = fighterRig.stanceLeadShoulderX - 0.02 * anticipation + 0.03;
    leftElbow.rotation.x = fighterRig.stanceLeadElbowX + 0.08 * anticipation;
    leftShoulder.rotation.y = fighterRig.stanceLeadShoulderY + 0.01;
    leftShoulder.rotation.z = fighterRig.stanceLeadShoulderZ + 0.01;

    visual.torsoPivot.rotation.y = 0.08 * anticipation - 0.34 * peak;
    visual.pelvis.rotation.y = 0.03 * anticipation - 0.14 * peak;
    visual.headPivot.rotation.y = 0.12 * peak;
  } else {
    leftShoulder.rotation.x = fighterRig.stanceLeadShoulderX + 0.04 * anticipation - 0.58 * peak;
    leftElbow.rotation.x = fighterRig.stanceLeadElbowX + 0.18 * anticipation + 0.82 * peak;
    leftShoulder.rotation.y = fighterRig.stanceLeadShoulderY + 0.05 * peak;
    leftShoulder.rotation.z = fighterRig.stanceLeadShoulderZ + 0.08 * peak;

    rightShoulder.rotation.x = fighterRig.stanceRearShoulderX - 0.03 * anticipation + 0.02;
    rightElbow.rotation.x = fighterRig.stanceRearElbowX + 0.06 * anticipation;
    rightShoulder.rotation.y = fighterRig.stanceRearShoulderY - 0.01;
    rightShoulder.rotation.z = fighterRig.stanceRearShoulderZ - 0.01;

    visual.torsoPivot.rotation.y = -0.05 * anticipation + 0.12 * peak;
    visual.pelvis.rotation.y = -0.02 * anticipation + 0.05 * peak;
    visual.headPivot.rotation.y = -0.05 * peak;
  }
}

function applyLeadKickPose(visual, progress) {
  const anticipation = Math.sin(Math.min(progress, 0.3) / 0.3 * Math.PI * 0.5);
  const strikeProgress = THREE.MathUtils.clamp((progress - 0.12) / 0.88, 0, 1);
  const peak = Math.sin(strikeProgress * Math.PI);
  const recovery = Math.sin(strikeProgress * Math.PI * 0.5);

  visual.leftArm.shoulder.rotation.z = -0.18;
  visual.rightArm.shoulder.rotation.z = 0.18;
  visual.leftArm.elbow.rotation.x = -0.78;
  visual.rightArm.elbow.rotation.x = -0.55;

  visual.torsoPivot.rotation.x = fighterRig.stanceTorsoLean + 0.06 * anticipation - 0.08 * peak;
  visual.torsoPivot.rotation.y = -0.08 * anticipation - 0.14 * peak;
  visual.pelvis.rotation.y = -0.04 * anticipation - 0.08 * peak;

  visual.rightLeg.hip.rotation.x = 0.28 * anticipation - 0.95 * peak;
  visual.rightLeg.hip.rotation.z = 0.08 * peak;
  visual.rightLeg.knee.rotation.x = 0.18 + 0.28 * anticipation + 0.2 * recovery;

  visual.leftLeg.hip.rotation.x = -0.2 * anticipation + 0.18 * peak;
  visual.leftLeg.knee.rotation.x = 0.16 + 0.4 * peak;
}


function loadPlayerModel() {
  loader.load(
    characterConfig.playerModelUrl,
    (gltf) => {
      if (characterModels.player) {
        scene.remove(characterModels.player);
      }

      const modelRoot = new THREE.Group();
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      bounds.getSize(size);
      const sourceHeight = size.y || 1;
      const uniformScale = characterConfig.playerTargetHeight / sourceHeight;
      model.scale.setScalar(uniformScale * characterConfig.playerScale);
      model.traverse((child) => {
        if (!child.isMesh) {
          return;
        }
        child.castShadow = true;
        child.receiveShadow = true;
      });

      const scaledBounds = new THREE.Box3().setFromObject(model);
      const scaledCenter = new THREE.Vector3();
      scaledBounds.getCenter(scaledCenter);
      model.position.set(-scaledCenter.x, -scaledBounds.min.y, -scaledCenter.z);

      modelRoot.add(model);
      scene.add(modelRoot);
      characterModels.player = modelRoot;
      playerVisual.root.visible = false;
      if (controls.paused) {
        ui.roundStatus.textContent = "Player model ready.";
      }
    },
    undefined,
    () => {
      characterModels.player = null;
      playerVisual.root.visible = true;
      ui.roundStatus.textContent = "Player model failed to load. Using procedural fighter.";
    }
  );
}
function updateCamera() {
  const desiredTarget = new THREE.Vector3(player.position.x, 1.55, player.position.z);
  cameraState.target.lerp(desiredTarget, 0.14);
  const offset = new THREE.Vector3(
    Math.sin(controls.cameraYaw) * Math.cos(controls.cameraPitch) * controls.radius,
    Math.sin(controls.cameraPitch) * controls.radius + 1.05,
    Math.cos(controls.cameraYaw) * Math.cos(controls.cameraPitch) * controls.radius
  );

  camera.position.copy(cameraState.target).add(offset);
  camera.lookAt(cameraState.target);
}

function updateHud() {
  ui.playerHealthFill.style.width = `${player.health}%`;
  ui.playerStatus.textContent = `${Math.round(player.health)} / ${player.maxHealth}`;
  updateEnemyHeadBar();
}

function updateEnemyHeadBar() {
  if (!ui.enemyHealth || !ui.enemyHealthFill) {
    return;
  }

  if (controls.paused || npc.health <= 0) {
    ui.enemyHealth.classList.add("hidden");
    return;
  }

  const headPosition = npc.position.clone();
  headPosition.y = fighterRig.worldY + fighterRig.rootY + 2.9;
  headPosition.project(camera);

  const isVisible = headPosition.z > -1 && headPosition.z < 1;
  if (!isVisible) {
    ui.enemyHealth.classList.add("hidden");
    return;
  }

  const x = (headPosition.x * 0.5 + 0.5) * canvas.clientWidth;
  const y = (-headPosition.y * 0.5 + 0.5) * canvas.clientHeight;

  if (x < 0 || x > canvas.clientWidth || y < 0 || y > canvas.clientHeight) {
    ui.enemyHealth.classList.add("hidden");
    return;
  }

  ui.enemyHealth.classList.remove("hidden");
  ui.enemyHealth.style.left = `${x}px`;
  ui.enemyHealth.style.top = `${y}px`;
  ui.enemyHealthFill.style.width = `${(npc.health / npc.maxHealth) * 100}%`;
}

function resetScene() {
  matchState.over = false;
  matchState.winner = null;
  world.activePoi = null;
  player.position.copy(world.playerSpawn);
  player.velocity.set(0, 0, 0);
  player.facing = Math.PI;
  player.health = 100;
  player.attackCooldown = 0;
  player.attackTimer = 0;
  player.attackElapsed = 0;
  player.action = "Idle";
  player.combatMode = false;
  player.currentAttack = null;

  npc.position.copy(world.npcSpawn);
  npc.velocity.set(0, 0, 0);
  npc.health = 100;
  npc.action = "Idle";
  npc.facing = Math.PI;
  npc.hitFlash = 0;
  npc.attackCooldown = 0;
  npc.attackTimer = 0;
  npc.attackElapsed = 0;
  npc.currentAttack = null;
  npc.decisionTimer = 0.2;
  npc.strafeBias = Math.random() > 0.5 ? 1 : -1;

  controls.cameraYaw = Math.PI;
  controls.cameraPitch = 0.52;
  ui.roundStatus.textContent = controls.paused ? "Main menu ready." : "Scene reset.";
}


function loadMap() {
  if (world.loaded || world.loading) {
    return;
  }
  world.loading = true;
  showLoadingOverlay("Loading warehouse scene...");

  loader.load(
    mapConfig.url,
    (gltf) => {
      if (world.mapRoot) {
        scene.remove(world.mapRoot);
      }

      const mapScene = gltf.scene;
      mapScene.position.copy(mapConfig.position);
      mapScene.rotation.y = mapConfig.rotationY;
      mapScene.scale.setScalar(mapConfig.scale);
      mapScene.traverse((child) => {
        if (!child.isMesh) {
          return;
        }
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      scene.add(mapScene);
      world.mapRoot = mapScene;
      fallbackArena.visible = false;
      updateWorldFromMap(mapScene);
      world.loaded = true;
      world.loading = false;
      resetScene();
      ui.roundStatus.textContent = controls.paused
        ? "Map ready. Main menu loaded."
        : "Map loaded.";
    },
    undefined,
    () => {
      fallbackArena.visible = true;
      world.loaded = false;
      world.loading = false;
      world.bounds = { ...mapConfig.defaultBounds };
      world.playerSpawn.copy(mapConfig.defaultPlayerSpawn);
      world.npcSpawn.copy(mapConfig.defaultNpcSpawn);
      addMapPois(new THREE.Vector3(0, 0, 0), new THREE.Vector3(32, 0, 32));
      resetScene();
      ui.roundStatus.textContent = "Warehouse failed to load. Using fallback arena.";
    }
  );
}

function updateWorldFromMap(mapScene) {
  const markers = findMapMarkers(mapScene);
  const boundsBox = new THREE.Box3().setFromObject(mapScene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  boundsBox.getSize(size);
  boundsBox.getCenter(center);

  if (Number.isFinite(size.x) && Number.isFinite(size.z) && size.x > 1 && size.z > 1) {
    world.bounds = {
      minX: boundsBox.min.x + mapConfig.clampPadding,
      maxX: boundsBox.max.x - mapConfig.clampPadding,
      minZ: boundsBox.min.z + mapConfig.clampPadding,
      maxZ: boundsBox.max.z - mapConfig.clampPadding
    };
  } else {
    world.bounds = { ...mapConfig.defaultBounds };
  }

  if (markers.playerSpawn) {
    world.playerSpawn.copy(markers.playerSpawn);
  } else {
    world.playerSpawn.set(center.x, 0, center.z + Math.min(size.z * 0.18, 6));
  }

  if (markers.npcSpawn) {
    world.npcSpawn.copy(markers.npcSpawn);
  } else {
    world.npcSpawn.set(center.x, 0, center.z - Math.min(size.z * 0.18, 6));
  }

  if (markers.fightCenter) {
    ring.position.set(markers.fightCenter.x, 0.03, markers.fightCenter.z);
  } else {
    ring.position.set(center.x, 0.03, center.z);
  }

  addMapPois(center, size);
}

function findMapMarkers(root) {
  const markers = {
    playerSpawn: null,
    npcSpawn: null,
    fightCenter: null
  };

  root.traverse((child) => {
    if (!child.name) {
      return;
    }

    const lowerName = child.name.toLowerCase();
    if (!markers.playerSpawn && lowerName.includes("playerspawn")) {
      markers.playerSpawn = child.getWorldPosition(new THREE.Vector3());
      markers.playerSpawn.y = 0;
    } else if (!markers.npcSpawn && (lowerName.includes("npcspawn") || lowerName.includes("enemyspawn"))) {
      markers.npcSpawn = child.getWorldPosition(new THREE.Vector3());
      markers.npcSpawn.y = 0;
    } else if (!markers.fightCenter && (lowerName.includes("fightcenter") || lowerName.includes("arenacenter"))) {
      markers.fightCenter = child.getWorldPosition(new THREE.Vector3());
      markers.fightCenter.y = 0;
    }
  });

  return markers;
}
function showLoadingOverlay(message) {
  if (loadingStatus) {
    loadingStatus.textContent = message;
  }
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
  }
}

function hideLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
}

function onResize() {
  const viewportWidth = canvas.clientWidth || window.innerWidth;
  const viewportHeight = canvas.clientHeight || window.innerHeight;
  renderer.setSize(viewportWidth, viewportHeight, false);
  camera.aspect = viewportWidth / viewportHeight;
  camera.updateProjectionMatrix();
}



















