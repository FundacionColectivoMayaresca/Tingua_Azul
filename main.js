// Tingua Azul – Humedal 3D

// ---------- VARIABLES GLOBALES --------------
let scene, camera, renderer, clock;
let bird;
let birdYVelocity = 0;
let isOnGround = false;

const gravity = -12;
const moveSpeed = 6;
const jumpSpeed = 7;
const birdBaseHeight = -0.2;
const cameraOffset = new THREE.Vector3(0, 7, -12);

const keys = { w: false, a: false, s: false, d: false };

// Joystick
let joystickActive = false;
const joystickCenter = { x: 0, y: 0 };
const joystickVector = { x: 0, y: 0 };

// Orbes / datos
let orbs = [];
let totalOrbs = 0;
let collectedCount = 0;

// Colores del entorno
let environmentMeshes = [];
let currentColorProgress = 0;

// Partes de la tingua
let birdWings = [];
let birdLegs = [];
let wingFlapPhase = 0;
let walkPhase = 0;

// HUD
let factsCountSpan, factsTotalSpan;
let factPanel, factTitle, factText;
let allCompletedMessageShown = false;

// Minimapa
let miniCamera;

// Audio
let bgm = null;
let sfxJump = null;
let sfxOrb = null;
let sfxFrog = null;
let audioInitialized = false;

// Ciclo día/noche y clima
const DAY_LENGTH = 160;
const skyDay = new THREE.Color(0xb3e5fc);
const skyNight = new THREE.Color(0x020311);
let timeOfDay = 0;

let dirLight;
let sun, moon, stars;
let clouds = [];
let rainDrops = [];
let rainEnabled = false;
let weatherTime = 0;
let rainIntensity = 0;

// Arcoiris
let rainbowGroup = null;

// Gran humedal principal (más grande)
const LAGOON_X = 0;
const LAGOON_Z = 35;
const LAGOON_RADIUS = 45;

// Fauna animada
let ducks = [];
let herons = [];
let frogs = [];

// Tiempo total
let elapsedTime = 0;

// Cinemática final
let cinematicActive = false;
let cinematicTime = 0;

// Fauna/flora extra al completar orbes
let extraLifeSpawned = false;

// Textos de paneles
const HUMEDAL_INFO_HTML = `
<strong>Nivel 1 – Humedal Santa María del Lago</strong><br><br>
• Ubicado en la localidad de Engativá, Bogotá D.C.<br>
• Es un humedal urbano que hace parte de la Estructura Ecológica Principal de la ciudad.<br>
• Alberga aves acuáticas como la tingua azul, patos, garzas y muchas otras especies de insectos y plantas.<br>
• Ayuda a regular inundaciones, almacenar agua lluvia y mejorar la calidad del aire en la zona.<br><br>
En este nivel acompañas a la tingua azul a recorrer el humedal, aprender sobre su importancia y descubrir cómo podemos cuidarlo.
`;

const GLOSARIO_HTML = `
<strong>Humedal:</strong> Ecosistema donde el agua está presente de forma permanente o temporal, creando un hogar para plantas y animales acuáticos.<br><br>
<strong>Tingua:</strong> Nombre común de varias aves acuáticas que caminan entre la vegetación flotante y los juncos.<br><br>
<strong>Zona de ronda:</strong> Franja de protección alrededor del humedal que debe mantenerse libre de construcciones.<br><br>
<strong>Vegetación emergente:</strong> Plantas que enraízan en el fondo pero sobresalen por encima del agua, como los juncos y eneas.<br><br>
<strong>Conectividad ecológica:</strong> Conexión entre diferentes ecosistemas que permite el paso de especies y el flujo de agua y nutrientes.<br><br>
<strong>Espejo de agua:</strong> Parte abierta del humedal donde se ve el agua como una “laguna” sin tanta vegetación en la superficie.<br><br>
<strong>Biodiversidad:</strong> Variedad de especies de plantas, animales y microorganismos que conviven en un ecosistema.<br><br>
<strong>RAMSAR:</strong> Convenio internacional para proteger humedales de importancia mundial, promoviendo su uso racional y conservación.<br><br>
<strong>Zona de amortiguación:</strong> Franja alrededor del humedal que ayuda a reducir el impacto de ruido, construcciones y contaminación.<br><br>
<strong>Sendero ecológico:</strong> Camino diseñado para que las personas recorran el humedal sin dañar la vegetación ni la fauna.
`;

const GALLERY_HTML = `
<strong>Galería – Santa María del Lago</strong><br><br>
<strong>Imagen 1 – Espejo de agua y sendero ecológico</strong><br>
Descripción: Vista del humedal con el agua tranquila, rodeada de árboles y un sendero para visitantes.<br><br>
<strong>Imagen 2 – Aves en el humedal</strong><br>
Descripción: Tinguas y patos descansando entre la vegetación acuática.<br><br>
<strong>Imagen 3 – Vegetación típica</strong><br>
Descripción: Juncos, eneas y otras plantas que ayudan a filtrar el agua y dan refugio a la fauna.<br><br>
<em>Puedes reemplazar estas descripciones por fotos reales del humedal cuando tengas el material.</em>
`;

const CONSEJOS_HTML = `
<strong>Consejos para cuidar y proteger los humedales</strong><br><br>
• <strong>No botar basura:</strong> Lleva tus residuos de vuelta a casa o deposítalos en canecas. Una botella puede flotar años en el agua.<br><br>
• <strong>Respetar los senderos:</strong> No ingresar a zonas restringidas ni pisar la vegetación de orilla, allí anidan aves y viven pequeños animales.<br><br>
• <strong>Mascotas con correa:</strong> Los perros sueltos pueden perseguir o lastimar a aves y otros animales del humedal.<br><br>
• <strong>No alimentar a la fauna:</strong> Dar pan o comida procesada a las aves puede enfermarles y alterar su comportamiento natural.<br><br>
• <strong>Cero ruidos fuertes:</strong> La música muy alta y los gritos espantan a las aves y otros animales que necesitan tranquilidad.<br><br>
• <strong>Participar en jornadas:</strong> Vincúlate a caminatas ecológicas, limpiezas y procesos de educación ambiental en los humedales de tu ciudad.<br><br>
• <strong>Defenderlos con la voz:</strong> Si ves rellenos ilegales, escombros o contaminación, repórtalos a las autoridades ambientales y difunde la importancia del humedal.<br><br>
Cada acción cuenta: los humedales son como pulmones y esponjas de la ciudad. Cuidarlos es cuidarnos también a nosotros.
`;

// ---------- INICIALIZACIÓN ------------------

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = skyDay.clone();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("game-root").appendChild(renderer.domElement);

  clock = new THREE.Clock();

  setupLights();
  createTerrain();
  createBigLagoon();
  createFlora();
  createFauna();
  createBird();
  createInfoOrbs();
  createMiniCamera();
  setupHUD();

  camera.position.set(
    bird.position.x + cameraOffset.x,
    bird.position.y + cameraOffset.y,
    bird.position.z + cameraOffset.z
  );
  camera.lookAt(bird.position.x, bird.position.y + 0.8, bird.position.z);

  window.addEventListener("resize", onWindowResize);
  setupKeyboardControls();
}

// ---------- AUDIO ----------------------------

function initAudio() {
  if (audioInitialized) return;
  audioInitialized = true;

  bgm = new Audio("audio/humedal_ambiente.mp3");
  bgm.loop = true;
  bgm.volume = 0.4;
  bgm.play().catch(() => {});

  sfxJump = new Audio("audio/salto.mp3");
  sfxJump.volume = 0.7;

  sfxOrb = new Audio("audio/orbe.mp3");
  sfxOrb.volume = 0.8;

  sfxFrog = new Audio("audio/rana.mp3");
  sfxFrog.volume = 0.35;
}

// ---------- LUCES, CIELO, NUBES, LLUVIA, ARCOIRIS -------------

function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 30, -5);
  scene.add(dirLight);

  createSkyObjects();
  createClouds();
  createRain();
  createRainbow();
}

function createSkyObjects() {
  const sunGeo = new THREE.SphereGeometry(3, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff176 });
  sun = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sun);

  const moonGeo = new THREE.SphereGeometry(2.3, 16, 16);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0x90caf9 });
  moon = new THREE.Mesh(moonGeo, moonMat);
  scene.add(moon);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 400;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 180;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.0,
  });
  stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

function createClouds() {
  const cloudCount = 55;
  for (let i = 0; i < cloudCount; i++) {
    const cloud = new THREE.Group();
    const puffCount = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < puffCount; j++) {
      const puffGeo = new THREE.SphereGeometry(2 + Math.random(), 8, 8);
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        flatShading: true,
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 2
      );
      cloud.add(puff);
    }
    const range = 260;
    const x = (Math.random() - 0.5) * range;
    const z = (Math.random() - 0.5) * range;
    const y = 35 + Math.random() * 10;
    cloud.position.set(x, y, z);
    scene.add(cloud);
    clouds.push(cloud);
  }
}

function createRain() {
  const dropCount = 220;
  for (let i = 0; i < dropCount; i++) {
    const geo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x90caf9 });
    const drop = new THREE.Mesh(geo, mat);
    resetDrop(drop);
    rainDrops.push(drop);
    scene.add(drop);
  }
}

function resetDrop(drop) {
  const range = 160;
  drop.position.set(
    (Math.random() - 0.5) * range,
    40 + Math.random() * 30,
    (Math.random() - 0.5) * range
  );
}

// 🌈 Arcoiris más grande y bien orientado
function createRainbow() {
  rainbowGroup = new THREE.Group();
  const colors = [0xf44336, 0xff9800, 0xffeb3b, 0x4caf50, 0x2196f3, 0x9c27b0];

  const baseRadius = LAGOON_RADIUS * 0.7; // ancho relativo al lago
  const tubeRadius = 0.9;
  const steps = 48;

  colors.forEach((color, index) => {
    const r = baseRadius + index * 0.9;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      const z = 0;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 64, tubeRadius, 8, false);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    rainbowGroup.add(mesh);
  });

  rainbowGroup.position.set(LAGOON_X, 0, LAGOON_Z);
  rainbowGroup.rotation.y = Math.PI; // abre hacia la cámara
  rainbowGroup.visible = false;
  scene.add(rainbowGroup);
}

function updateEnvironment(delta) {
  timeOfDay = (timeOfDay + delta / DAY_LENGTH) % 1;
  const angle = timeOfDay * Math.PI * 2;
  const dayFactor = 0.5 - 0.5 * Math.cos(angle);

  const skyColor = skyNight.clone().lerp(skyDay, dayFactor);
  scene.background = skyColor;

  if (dirLight) {
    dirLight.intensity = 0.25 + 0.9 * dayFactor;
    dirLight.position.set(Math.cos(angle) * 60, 40, Math.sin(angle) * 60);
  }

  if (sun && moon) {
    const radius = 140;
    sun.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      Math.sin(angle) * radius
    );
    moon.position.set(
      Math.cos(angle + Math.PI) * radius,
      Math.sin(angle + Math.PI) * radius,
      Math.sin(angle + Math.PI) * radius
    );
    sun.visible = dayFactor > 0.15;
    moon.visible = dayFactor < 0.85;
  }

  if (stars) {
    const nightFactor = 1 - dayFactor;
    stars.material.opacity = nightFactor;
  }

  updateClouds(delta);
  updateRain(delta, dayFactor);
}

function updateClouds(delta) {
  const speed = 4;
  const range = 260;
  clouds.forEach((c) => {
    c.position.x += delta * speed;
    if (c.position.x > range) c.position.x = -range;
  });
}

function updateRain(delta, dayFactor) {
  weatherTime += delta;
  const WEATHER_CHANGE_EVERY = 45;

  if (weatherTime > WEATHER_CHANGE_EVERY) {
    weatherTime = 0;
    rainEnabled = Math.random() < 0.5;
  }

  const targetIntensity = rainEnabled && dayFactor > 0.2 ? 1 : 0;
  rainIntensity += (targetIntensity - rainIntensity) * delta * 1.5;

  rainDrops.forEach((drop) => {
    drop.visible = rainIntensity > 0.05;
    if (!drop.visible) return;
    drop.position.y -= delta * 25 * rainIntensity;
    const groundY = terrainHeight(drop.position.x, drop.position.z);
    if (drop.position.y < groundY + 0.2) {
      resetDrop(drop);
    }
  });
}

// ---------- TERRENO Y HUMEDAL GRANDE ----------

function terrainHeight(x, z) {
  const s = 0.12;
  return Math.sin(x * s) * 0.8 + Math.cos(z * s * 1.1) * 0.6;
}

function createTerrain() {
  const geo = new THREE.PlaneGeometry(220, 220, 180, 180);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    flatShading: true,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.receiveShadow = true;
  scene.add(terrain);

  registerEnvMesh(terrain, 0x3a7f3a, 0xaaaaaa);
}

function createBigLagoon() {
  const geo = new THREE.CircleGeometry(LAGOON_RADIUS, 64);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9fbddc,
    transparent: true,
    opacity: 0.75,
  });
  const lagoon = new THREE.Mesh(geo, mat);
  const baseY = terrainHeight(LAGOON_X, LAGOON_Z) + 0.03;
  lagoon.position.set(LAGOON_X, baseY, LAGOON_Z);
  scene.add(lagoon);

  registerEnvMesh(lagoon, 0x4fc3f7, 0xb0bec5);
}

// ---------- FLOTA Y ARBOLES ------------------

function createFlora() {
  const treePositions = [
    [-10, 5],
    [8, 10],
    [-15, -8],
    [15, -12],
    [0, 15],
    [20, 5],
    [-20, 12],
    [12, -18],
    [-25, -15],
    [25, 18],
    [30, -10],
    [-30, 8],
  ];

  treePositions.forEach(([x, z], i) => {
    const r = i % 3;
    if (r === 0) createTreeType1(x, z);
    else if (r === 1) createTreeType2(x, z);
    else createTreeType3(x, z);
  });

  // árboles aleatorios, dejando libre el lago grande
  for (let i = 0; i < 150; i++) {
    const x = (Math.random() - 0.5) * 220;
    const z = (Math.random() - 0.5) * 220;
    const dist = Math.hypot(x - LAGOON_X, z - LAGOON_Z);
    if (dist < LAGOON_RADIUS - 4) continue;

    const r = i % 3;
    if (r === 0) createTreeType1(x, z, true);
    else if (r === 1) createTreeType2(x, z, true);
    else createTreeType3(x, z, true);
  }

  // arbustos
  for (let i = 0; i < 130; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    createBush(x, z);
  }

  // charcos pequeños
  for (let i = 0; i < 8; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    createPond(x, z);
  }
}

function createTreeType1(x, z, randomScale = false) {
  let trunkHeight = 3.5 + Math.random() * 2.0;
  if (!randomScale) trunkHeight = 4.0;

  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.55, trunkHeight, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    flatShading: true,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);

  const topGeo = new THREE.DodecahedronGeometry(2.3, 0);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    flatShading: true,
  });
  const top = new THREE.Mesh(topGeo, topMat);

  if (randomScale) {
    const s = 1.2 + Math.random() * 1.2;
    top.scale.set(s, s, s);
  }

  const baseY = terrainHeight(x, z);
  trunk.position.set(x, baseY + trunkHeight / 2, z);
  top.position.set(x, baseY + trunkHeight + 1.8, z);

  scene.add(trunk);
  scene.add(top);

  registerEnvMesh(trunk, 0x5d4037, 0x777777);
  registerEnvMesh(top, 0x66bb6a, 0x999999);
}

function createTreeType2(x, z, randomScale = false) {
  let trunkHeight = 3.0 + Math.random() * 1.8;
  if (!randomScale) trunkHeight = 3.4;

  const trunkGeo = new THREE.BoxGeometry(0.4, trunkHeight, 0.4);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    flatShading: true,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);

  const topGeo = new THREE.SphereGeometry(1.9, 10, 8);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    flatShading: true,
  });
  const top = new THREE.Mesh(topGeo, topMat);

  if (randomScale) {
    const s = 1.1 + Math.random() * 1.3;
    top.scale.set(s, s, s);
  }

  const baseY = terrainHeight(x, z);
  trunk.position.set(x, baseY + trunkHeight / 2, z);
  top.position.set(x, baseY + trunkHeight + 1.5, z);

  scene.add(trunk);
  scene.add(top);

  registerEnvMesh(trunk, 0x6d4c41, 0x777777);
  registerEnvMesh(top, 0x81c784, 0x888888);
}

function createTreeType3(x, z, randomScale = false) {
  let trunkHeight = 4.0 + Math.random() * 2.5;
  if (!randomScale) trunkHeight = 4.8;

  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.35, trunkHeight, 10);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6d6d6d,
    flatShading: true,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);

  const topGeo = new THREE.ConeGeometry(1.3, 2.6, 10);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x8bc34a,
    flatShading: true,
  });
  const top = new THREE.Mesh(topGeo, topMat);

  if (randomScale) {
    const s = 1.1 + Math.random() * 1.3;
    top.scale.set(s, s, s);
  }

  const baseY = terrainHeight(x, z);
  trunk.position.set(x, baseY + trunkHeight / 2, z);
  top.position.set(x, baseY + trunkHeight + 1.8, z);

  scene.add(trunk);
  scene.add(top);

  registerEnvMesh(trunk, 0x795548, 0x6d6d6d);
  registerEnvMesh(top, 0x8bc34a, 0xa0a0a0);
}

function createBush(x, z) {
  const geo = new THREE.SphereGeometry(0.6, 8, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    flatShading: true,
  });
  const bush = new THREE.Mesh(geo, mat);

  const baseY = terrainHeight(x, z);
  bush.position.set(x, baseY + 0.5, z);

  scene.add(bush);
  registerEnvMesh(bush, 0x9ccc65, 0x888888);
}

function createPond(x, z) {
  const radius = 3 + Math.random() * 2;
  const geo = new THREE.CircleGeometry(radius, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9fbddc,
    transparent: true,
    opacity: 0.6,
  });
  const pond = new THREE.Mesh(geo, mat);

  const baseY = terrainHeight(x, z) + 0.02;
  pond.position.set(x, baseY, z);

  scene.add(pond);
  registerEnvMesh(pond, 0x4fc3f7, 0xb0bec5);
}

function registerEnvMesh(mesh, baseColorHex, grayColorHex) {
  mesh.material = mesh.material.clone();
  mesh.userData.baseColor = new THREE.Color(baseColorHex);
  mesh.userData.grayColor = new THREE.Color(
    grayColorHex !== undefined ? grayColorHex : 0xdddddd
  );
  const c = mesh.userData.grayColor.clone().lerp(
    mesh.userData.baseColor,
    currentColorProgress
  );
  mesh.material.color.copy(c);
  environmentMeshes.push(mesh);
}

function setColorProgress(t) {
  currentColorProgress = t;
  environmentMeshes.forEach((mesh) => {
    const base = mesh.userData.baseColor;
    const gray = mesh.userData.grayColor;
    if (!base || !gray) return;
    const c = gray.clone().lerp(base, t);
    mesh.material.color.copy(c);
  });
}

// ---------- FAUNA (patos, garzas, sapos) ------

function createFauna() {
  const duckPositions = [
    [5, 5],
    [-8, 12],
    [10, -6],
    [-15, -14],
    [18, 20],
    [-22, 18],
  ];
  duckPositions.forEach(([x, z]) => createDuck(x, z));

  const heronPositions = [
    [-20, -5],
    [22, 10],
    [0, -22],
    [30, -25],
  ];
  heronPositions.forEach(([x, z]) => createHeron(x, z));

  createFrogsAlongLagoon();
}

function createDuck(x, z) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.7, 0.4, 0.9);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffcc80,
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.4;

  const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffe082,
    flatShading: true,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.75, 0.35);

  const beakGeo = new THREE.BoxGeometry(0.18, 0.12, 0.3);
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xffb300,
    flatShading: true,
  });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, 0.7, 0.65);

  const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.8, 0.45);
  eyeR.position.set(0.12, 0.8, 0.45);

  group.add(body, head, beak, eyeL, eyeR);

  const baseY = terrainHeight(x, z) + 0.05;
  group.position.set(x, baseY, z);

  scene.add(group);

  group.userData.baseY = baseY;
  group.userData.phase = Math.random() * Math.PI * 2;
  ducks.push(group);
}

function createHeron(x, z) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.1;

  const neckGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
  const neckMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    flatShading: true,
  });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.set(0, 1.6, 0.15);

  const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    flatShading: true,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 1.95, 0.35);

  const beakGeo = new THREE.BoxGeometry(0.12, 0.12, 0.45);
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xffb74d,
    flatShading: true,
  });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, 1.9, 0.7);

  const legGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0xffb74d,
    flatShading: true,
  });
  const legL = new THREE.Mesh(legGeo, legMat);
  const legR = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.15, 0.5, 0.1);
  legR.position.set(0.15, 0.5, 0.1);

  const footGeo = new THREE.BoxGeometry(0.2, 0.08, 0.3);
  const footMat = new THREE.MeshStandardMaterial({
    color: 0xffb74d,
    flatShading: true,
  });
  const footL = new THREE.Mesh(footGeo, footMat);
  const footR = new THREE.Mesh(footGeo, footMat);
  footL.position.set(-0.15, 0.14, 0.18);
  footR.position.set(0.15, 0.14, 0.18);

  group.add(body, neck, head, beak, legL, legR, footL, footR);

  const baseY = terrainHeight(x, z) - 0.1;
  group.position.set(x, baseY, z);

  scene.add(group);

  group.userData.baseY = baseY;
  group.userData.phase = Math.random() * Math.PI * 2;
  herons.push(group);
}

function createFrogsAlongLagoon() {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = LAGOON_RADIUS + (Math.random() * 6 - 3);
    const x = LAGOON_X + Math.cos(angle) * r;
    const z = LAGOON_Z + Math.sin(angle) * r;
    createFrog(x, z);
  }
}

// 🐸 Ranas un poco más realistas (cuerpo, cabeza, patas)
function createFrog(x, z) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(0.35, 10, 10);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x43a047,
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.28;

  const bellyGeo = new THREE.SphereGeometry(0.28, 10, 10);
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xa5d6a7,
    flatShading: true,
  });
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.scale.set(1, 0.55, 1);
  belly.position.set(0, 0.15, 0);

  const headGeo = new THREE.SphereGeometry(0.25, 10, 10);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x66bb6a,
    flatShading: true,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.5, 0.15);

  const eyeGeo = new THREE.SphereGeometry(0.07, 10, 10);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.6, 0.22);
  eyeR.position.set(0.12, 0.6, 0.22);

  const mouthGeo = new THREE.BoxGeometry(0.22, 0.03, 0.08);
  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    flatShading: true,
  });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.45, 0.26);

  // patas traseras
  const backLegGeo = new THREE.BoxGeometry(0.16, 0.22, 0.35);
  const backLegMat = new THREE.MeshStandardMaterial({
    color: 0x388e3c,
    flatShading: true,
  });
  const backL = new THREE.Mesh(backLegGeo, backLegMat);
  const backR = new THREE.Mesh(backLegGeo, backLegMat);
  backL.position.set(-0.23, 0.14, -0.02);
  backR.position.set(0.23, 0.14, -0.02);
  backL.rotation.x = -0.5;
  backR.rotation.x = -0.5;

  // patas delanteras
  const frontLegGeo = new THREE.BoxGeometry(0.1, 0.18, 0.22);
  const frontLegMat = new THREE.MeshStandardMaterial({
    color: 0x43a047,
    flatShading: true,
  });
  const frontL = new THREE.Mesh(frontLegGeo, frontLegMat);
  const frontR = new THREE.Mesh(frontLegGeo, frontLegMat);
  frontL.position.set(-0.14, 0.14, 0.18);
  frontR.position.set(0.14, 0.14, 0.18);
  frontL.rotation.x = -0.3;
  frontR.rotation.x = -0.3;

  group.add(
    body,
    belly,
    head,
    eyeL,
    eyeR,
    mouth,
    backL,
    backR,
    frontL,
    frontR
  );

  const baseY = terrainHeight(x, z) + 0.02;
  group.position.set(x, baseY, z);

  scene.add(group);

  group.userData.baseY = baseY;
  group.userData.phase = Math.random() * Math.PI * 2;
  group.userData.hopSpeed = 3 + Math.random() * 2;
  frogs.push(group);
}

function updateFauna(t, delta) {
  ducks.forEach((duck) => {
    const baseY = duck.userData.baseY || duck.position.y;
    const phase = duck.userData.phase || 0;
    duck.position.y = baseY + 0.05 + Math.sin(t * 1.5 + phase) * 0.08;
    duck.rotation.y += 0.02 * Math.sin(t * 0.5 + phase);
  });

  herons.forEach((heron) => {
    const baseY = heron.userData.baseY || heron.position.y;
    const phase = heron.userData.phase || 0;
    heron.position.y = baseY + 0.03 * Math.sin(t * 1.2 + phase);
    heron.rotation.z = 0.03 * Math.sin(t * 0.8 + phase);
  });

  frogs.forEach((frog) => {
    const baseY = frog.userData.baseY || frog.position.y;
    const phase = frog.userData.phase || 0;
    const hopSpeed = frog.userData.hopSpeed || 3;
    const hop = Math.max(0, Math.sin(t * hopSpeed + phase));
    frog.position.y = baseY + hop * 0.7;
  });

  if (sfxFrog && frogs.length > 0 && Math.random() < delta * 0.35) {
    sfxFrog.currentTime = 0;
    sfxFrog.play().catch(() => {});
  }
}

// ---------- TINGUA AZUL ----------------------

function createBird() {
  const group = new THREE.Group();

  const bodyColor = 0x1e88e5;
  const neckColor = 0x1976d2;
  const legColor = 0xffb74d;
  const beakColor = 0xff5252;
  const eyeColor = 0x000000;

  const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    flatShading: true,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;

  const neckGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
  const neckMat = new THREE.MeshStandardMaterial({
    color: neckColor,
    flatShading: true,
  });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.set(0, 1.5, 0.25);

  const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  const headMat = new THREE.MeshStandardMaterial({
    color: neckColor,
    flatShading: true,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 1.9, 0.4);

  const beakGeo = new THREE.BoxGeometry(0.14, 0.14, 0.5);
  const beakMat = new THREE.MeshStandardMaterial({
    color: beakColor,
    flatShading: true,
  });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, 1.85, 0.75);

  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.13, 1.93, 0.52);
  eyeR.position.set(0.13, 1.93, 0.52);

  const wingGeo = new THREE.BoxGeometry(0.7, 0.15, 0.4);
  const wingMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    flatShading: true,
  });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.6, 0.9, 0.1);
  wingR.position.set(0.6, 0.9, 0.1);

  birdWings = [wingL, wingR];

  const legGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
  const legMat = new THREE.MeshStandardMaterial({
    color: legColor,
    flatShading: true,
  });
  const legL = new THREE.Mesh(legGeo, legMat);
  const legR = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.2, 0.45, 0.2);
  legR.position.set(0.2, 0.45, 0.2);

  const footGeo = new THREE.BoxGeometry(0.3, 0.1, 0.4);
  const footMat = new THREE.MeshStandardMaterial({
    color: legColor,
    flatShading: true,
  });
  const footL = new THREE.Mesh(footGeo, footMat);
  const footR = new THREE.Mesh(footGeo, footMat);
  footL.position.set(-0.2, 0.18, 0.25);
  footR.position.set(0.2, 0.18, 0.25);

  birdLegs = [legL, legR];

  group.add(
    body,
    neck,
    head,
    beak,
    eyeL,
    eyeR,
    wingL,
    wingR,
    legL,
    legR,
    footL,
    footR
  );

  const startX = 0;
  const startZ = 0;
  const baseY = terrainHeight(startX, startZ) + birdBaseHeight;
  group.position.set(startX, baseY, startZ);

  scene.add(group);
  bird = group;
}

// ---------- ORBES DE INFORMACIÓN --------------

function createInfoOrbs() {
  const infoData = [
    {
      title: "La tingua azul",
      text:
        "La tingua azul es un ave acuática que visita los humedales de Bogotá. Prefiere aguas tranquilas con mucha vegetación.",
    },
    {
      title: "Importancia de los humedales",
      text:
        "Los humedales funcionan como esponjas: regulan inundaciones, filtran el agua y son hogar de cientos de especies.",
    },
    {
      title: "Migraciones",
      text:
        "Muchas tinguas se desplazan entre lagunas y humedales. Los humedales urbanos son paraderos clave en sus rutas.",
    },
    {
      title: "Amenazas",
      text:
        "La contaminación, el relleno ilegal y las mascotas sueltas ponen en riesgo la vida de la tingua y otras especies.",
    },
    {
      title: "Vegetación de orilla",
      text:
        "En la orilla del humedal crecen juncos, eneas y otras plantas que filtran el agua y dan refugio a peces y anfibios.",
    },
    {
      title: "Conexión ecológica",
      text:
        "Los humedales se conectan con ríos, quebradas y parques. Si uno se degrada, afecta a toda la red ecológica.",
    },
    {
      title: "Acciones ciudadanas",
      text:
        "No botar basura, participar en jornadas de limpieza y respetar los senderos ayuda a que el humedal se mantenga sano.",
    },
    {
      title: "Residuos",
      text:
        "El plástico y el icopor pueden quedarse flotando por años, confundiendo a las aves y afectando la calidad del agua.",
    },
    {
      title: "Fauna nocturna",
      text:
        "En la noche aparecen murciélagos, búhos y otros animales que también dependen del humedal para alimentarse.",
    },
    {
      title: "Humedales y RAMSAR",
      text:
        "La Convención RAMSAR es un acuerdo internacional para proteger humedales. Bogotá avanza en reconocer su valor ecológico.",
    },
  ];

  totalOrbs = infoData.length;

  infoData.forEach((data, index) => {
    const angle = (index / infoData.length) * Math.PI * 2;
    const radius = 55; // un poco más afuera por el lago grande
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = terrainHeight(x, z) + 1.6;

    const mesh = createOrbMesh();
    mesh.position.set(x, y, z);
    scene.add(mesh);

    orbs.push({ mesh, data, collected: false });
  });
}

function createOrbMesh() {
  const geo = new THREE.SphereGeometry(0.45, 16, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffc107,
    emissive: 0x555555,
    emissiveIntensity: 0.6,
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

// ---------- HUD, MINIMAPA Y CONTROLES --------

function setupHUD() {
  factsCountSpan = document.getElementById("facts-count");
  factsTotalSpan = document.getElementById("facts-total");
  factPanel = document.getElementById("fact-panel");
  factTitle = document.getElementById("fact-title");
  factText = document.getElementById("fact-text");
  const factClose = document.getElementById("fact-close");
  const factCloseIcon = document.getElementById("panel-close-icon");

  factsTotalSpan.textContent = totalOrbs.toString();
  factsCountSpan.textContent = collectedCount.toString();

  function hidePanel() {
    factPanel.classList.add("hidden");
    if (collectedCount === totalOrbs && !allCompletedMessageShown) {
      startFinalCinematic();
    }
  }

  factClose.addEventListener("click", hidePanel);
  factCloseIcon.addEventListener("click", hidePanel);

  const helpBtn = document.getElementById("btn-help");
  helpBtn.addEventListener("click", () => {
    initAudio();
    showFact(
      "Cómo jugar",
      "Mueve a la tingua azul con el joystick (en celular) o con WASD/flechas (en PC). Toca JUMP o la barra espaciadora para saltar. Si saltas varias veces, la tingua puede volar un poco más alto. Recorre el humedal y recolecta todos los orbes de información para que el mapa se llene de color."
    );
  });

  const jumpBtn = document.getElementById("btn-jump");
  jumpBtn.addEventListener("click", () => {
    initAudio();
    onJump();
  });
  jumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    initAudio();
    onJump();
  });

  const joystickBase = document.getElementById("joystick-base");
  const joystickStick = document.getElementById("joystick-stick");

  function startJoystick(e) {
    initAudio();
    joystickActive = true;
    const rect = joystickBase.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;
    updateJoystick(e);
    e.preventDefault();
  }

  function moveJoystick(e) {
    if (!joystickActive) return;
    updateJoystick(e);
    e.preventDefault();
  }

  function endJoystick() {
    joystickActive = false;
    joystickVector.x = 0;
    joystickVector.y = 0;
    joystickStick.style.transform = "translate(0px, 0px)";
  }

  function updateJoystick(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let dx = clientX - joystickCenter.x;
    let dy = clientY - joystickCenter.y;

    const maxRadius = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      const k = maxRadius / dist;
      dx *= k;
      dy *= k;
    }

    joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;

    joystickVector.x = -dx / maxRadius;
    joystickVector.y = -dy / maxRadius;
  }

  joystickBase.addEventListener("mousedown", startJoystick);
  window.addEventListener("mousemove", moveJoystick);
  window.addEventListener("mouseup", endJoystick);

  joystickBase.addEventListener("touchstart", startJoystick, { passive: false });
  window.addEventListener("touchmove", moveJoystick, { passive: false });
  window.addEventListener("touchend", endJoystick);

  const btnInfoHumedal = document.getElementById("btn-info-humedal");
  const btnGlosario = document.getElementById("btn-glosario");
  const btnGaleria = document.getElementById("btn-galeria");
  const btnConsejos = document.getElementById("btn-consejos");

  btnInfoHumedal.addEventListener("click", () => {
    initAudio();
    showFact("Humedal Santa María del Lago", HUMEDAL_INFO_HTML);
  });

  btnGlosario.addEventListener("click", () => {
    initAudio();
    showFact("Glosario de humedales", GLOSARIO_HTML);
  });

  btnGaleria.addEventListener("click", () => {
    initAudio();
    showFact("Galería de imágenes", GALLERY_HTML);
  });

  btnConsejos.addEventListener("click", () => {
    initAudio();
    showFact("Consejos para cuidar los humedales", CONSEJOS_HTML);
  });

  setColorProgress(0);
}

function setupKeyboardControls() {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") keys.w = true;
    if (k === "a" || k === "arrowleft") keys.a = true;
    if (k === "s" || k === "arrowdown") keys.s = true;
    if (k === "d" || k === "arrowright") keys.d = true;
    if (k === " ") {
      e.preventDefault();
      initAudio();
      onJump();
    }
  });

  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "w" || k === "arrowup") keys.w = false;
    if (k === "a" || k === "arrowleft") keys.a = false;
    if (k === "s" || k === "arrowdown") keys.s = false;
    if (k === "d" || k === "arrowright") keys.d = false;
  });
}

function onJump() {
  if (!bird || cinematicActive) return;

  const groundY = terrainHeight(bird.position.x, bird.position.z) + birdBaseHeight;
  const heightAboveGround = bird.position.y - groundY;

  if (heightAboveGround < 0.05) {
    birdYVelocity = jumpSpeed;
    isOnGround = false;
  } else if (heightAboveGround < 12) {
    birdYVelocity += 3.5;
  }

  if (sfxJump) {
    sfxJump.currentTime = 0;
    sfxJump.play().catch(() => {});
  }
}

function showFact(title, textOrHtml) {
  factTitle.textContent = title;
  factText.innerHTML = textOrHtml;
  factPanel.classList.remove("hidden");
}

// ---------- MINIMAPA -------------------------

function createMiniCamera() {
  const half = 120;
  miniCamera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 600);
  miniCamera.position.set(0, 200, 0);
  miniCamera.lookAt(0, 0, 0);
}

// ---------- CINEMÁTICA FINAL -----------------

function startFinalCinematic() {
  cinematicActive = true;
  cinematicTime = 0;
  allCompletedMessageShown = true;
  if (rainbowGroup) rainbowGroup.visible = true;

  showFact(
    "¡Humedal lleno de vida!",
    "Has descubierto todos los datos y el humedal se ha llenado de color. La tingua azul ahora sobrevuela su hogar, y tú te conviertes en guardián de los humedales."
  );
}

function updateFinalCinematic(delta) {
  if (!bird) return;

  cinematicTime += delta;

  const radius = 25;
  const speed = 0.35;
  const angle = cinematicTime * speed;

  const targetX = LAGOON_X + Math.cos(angle) * radius;
  const targetZ = LAGOON_Z + Math.sin(angle) * radius;
  const groundY = terrainHeight(targetX, targetZ);

  bird.position.x = targetX;
  bird.position.z = targetZ;
  bird.position.y = groundY + 8 + Math.sin(cinematicTime * 2.2) * 1.5;
  bird.rotation.y = angle + Math.PI / 2;

  wingFlapPhase += delta * 12;
  const flap = Math.sin(wingFlapPhase) * 0.8;
  if (birdWings[0]) {
    birdWings[0].rotation.z = flap;
    birdWings[1].rotation.z = -flap;
  }

  const camRadius = 52;
  const camAngle = cinematicTime * 0.25;
  camera.position.set(
    LAGOON_X + Math.cos(camAngle) * camRadius,
    25 + Math.sin(cinematicTime * 0.8) * 6,
    LAGOON_Z + Math.sin(camAngle) * camRadius
  );
  camera.lookAt(LAGOON_X, groundY + 4, LAGOON_Z);

  if (miniCamera) {
    miniCamera.position.set(bird.position.x, 220, bird.position.z);
    miniCamera.lookAt(bird.position.x, 0, bird.position.z);
  }

  if (cinematicTime > 18) {
    cinematicActive = false;
    cinematicTime = 0;

    const behind = new THREE.Vector3(
      bird.position.x + cameraOffset.x,
      bird.position.y + cameraOffset.y,
      bird.position.z + cameraOffset.z
    );
    camera.position.copy(behind);
    camera.lookAt(bird.position.x, bird.position.y + 0.8, bird.position.z);
  }
}

// ---------- VIDA EXTRA AL COMPLETAR ORBES ----

function spawnExtraLife() {
  if (extraLifeSpawned) return;
  extraLifeSpawned = true;

  // Muchísimos más árboles
  for (let i = 0; i < 180; i++) {
    const x = (Math.random() - 0.5) * 220;
    const z = (Math.random() - 0.5) * 220;
    const dist = Math.hypot(x - LAGOON_X, z - LAGOON_Z);
    if (dist < LAGOON_RADIUS - 4) continue;
    const r = i % 3;
    if (r === 0) createTreeType1(x, z, true);
    else if (r === 1) createTreeType2(x, z, true);
    else createTreeType3(x, z, true);
  }

  // Más arbustos y charcos
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    createBush(x, z);
  }

  for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    createPond(x, z);
  }

  // Más patos alrededor del lago
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = LAGOON_RADIUS * 0.5 + Math.random() * 12;
    const x = LAGOON_X + Math.cos(angle) * r;
    const z = LAGOON_Z + Math.sin(angle) * r;
    createDuck(x, z);
  }

  // Más garzas
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = LAGOON_RADIUS * 0.7 + Math.random() * 15;
    const x = LAGOON_X + Math.cos(angle) * r;
    const z = LAGOON_Z + Math.sin(angle) * r;
    createHeron(x, z);
  }

  // Más ranas alrededor
  createFrogsAlongLagoon();

  // Asegurar que todo queda en el color final
  setColorProgress(currentColorProgress);
}

// ---------- BUCLE PRINCIPAL ------------------

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  elapsedTime += delta;

  if (cinematicActive) {
    updateFinalCinematic(delta);
  } else {
    updatePlayer(delta);
  }

  updateOrbs(delta);
  updateEnvironment(delta);
  updateFauna(elapsedTime, delta);

  const dpr = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
  const fullW = window.innerWidth * dpr;
  const fullH = window.innerHeight * dpr;

  renderer.setViewport(0, 0, fullW, fullH);
  renderer.setScissorTest(false);
  renderer.render(scene, camera);

  if (miniCamera) {
    renderer.clearDepth();
    renderer.setScissorTest(true);

    const miniSizeCss = 110;
    const miniXCss = window.innerWidth - miniSizeCss - 10;
    const miniYCssFromTop = 70;
    const miniYCss = window.innerHeight - miniYCssFromTop - miniSizeCss;

    const miniSize = miniSizeCss * dpr;
    const miniX = miniXCss * dpr;
    const miniY = miniYCss * dpr;

    renderer.setViewport(miniX, miniY, miniSize, miniSize);
    renderer.setScissor(miniX, miniY, miniSize, miniSize);
    renderer.render(scene, miniCamera);
    renderer.setScissorTest(false);
  }
}

// Movimiento de la tingua y cámara (con patas animadas)
function updatePlayer(delta) {
  if (!bird) return;

  let moveX = 0;
  let moveZ = 0;

  if (keys.w) moveZ += 1;
  if (keys.s) moveZ -= 1;
  if (keys.a) moveX += 1;
  if (keys.d) moveX -= 1;

  moveX += joystickVector.x;
  moveZ += joystickVector.y;

  const len = Math.hypot(moveX, moveZ);
  const moving = len > 0.001;

  if (moving) {
    const nx = moveX / len;
    const nz = moveZ / len;

    const dx = nx * moveSpeed * delta;
    const dz = nz * moveSpeed * delta;

    let newX = bird.position.x + dx;
    let newZ = bird.position.z + dz;

    const limit = 100;
    if (newX < -limit) newX = -limit;
    if (newX > limit) newX = limit;
    if (newZ < -limit) newZ = -limit;
    if (newZ > limit) newZ = limit;

    bird.position.x = newX;
    bird.position.z = newZ;

    const angle = Math.atan2(nx, nz);
    bird.rotation.y = angle;
  }

  const baseY = terrainHeight(bird.position.x, bird.position.z) + birdBaseHeight;

  birdYVelocity += gravity * delta;
  bird.position.y += birdYVelocity * delta;

  if (bird.position.y <= baseY) {
    bird.position.y = baseY;
    birdYVelocity = 0;
    isOnGround = true;
  } else {
    isOnGround = false;
  }

  // Animación de alas (vuelo)
  if (!isOnGround) {
    wingFlapPhase += delta * 10;
    const flap = Math.sin(wingFlapPhase) * 0.6;
    if (birdWings[0]) {
      birdWings[0].rotation.z = flap;
      birdWings[1].rotation.z = -flap;
    }
  } else {
    if (birdWings[0]) {
      birdWings[0].rotation.z *= 0.8;
      birdWings[1].rotation.z *= 0.8;
    }
  }

  // Animación de patas al caminar
  if (isOnGround && moving && birdLegs[0]) {
    walkPhase += delta * 10;
    const step = Math.sin(walkPhase) * 0.6;
    birdLegs[0].rotation.x = step;
    birdLegs[1].rotation.x = -step;
  } else if (birdLegs[0]) {
    birdLegs[0].rotation.x *= 0.7;
    birdLegs[1].rotation.x *= 0.7;
  }

  const desiredCamPos = new THREE.Vector3(
    bird.position.x + cameraOffset.x,
    bird.position.y + cameraOffset.y,
    bird.position.z + cameraOffset.z
  );
  camera.position.lerp(desiredCamPos, 0.1);
  camera.lookAt(bird.position.x, bird.position.y + 0.8, bird.position.z);

  if (miniCamera) {
    miniCamera.position.set(bird.position.x, 220, bird.position.z);
    miniCamera.lookAt(bird.position.x, 0, bird.position.z);
  }
}

// Orbes
function updateOrbs(delta) {
  if (!bird) return;
  orbs.forEach((o) => {
    if (!o.mesh) return;
    o.mesh.rotation.y += delta;

    if (o.collected) return;

    const dist = bird.position.distanceTo(o.mesh.position);
    if (dist < 1.8) {
      o.collected = true;
      scene.remove(o.mesh);
      o.mesh = null;

      collectedCount++;
      factsCountSpan.textContent = collectedCount.toString();

      const t = collectedCount / totalOrbs;
      setColorProgress(t);

      if (sfxOrb) {
        sfxOrb.currentTime = 0;
        sfxOrb.play().catch(() => {});
      }

      // Cuando se completa el último orbe, llenar de vida
      if (collectedCount === totalOrbs && !extraLifeSpawned) {
        spawnExtraLife();
      }

      showFact(o.data.title, o.data.text);
    }
  });
}

// ---------- OTROS ----------------------------

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
