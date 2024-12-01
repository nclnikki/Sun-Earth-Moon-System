import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/examples/jsm/controls/OrbitControls.js";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm";

THREE.ColorManagement.enabled = false;

// Create scene, camera, and renderer
const gui = new GUI();
const canvas = document.querySelector("canvas");
const scene = new THREE.Scene();

// Load textures using TextureLoader
const textureLoader = new THREE.TextureLoader();

// Create Background
const backgroundTexture = textureLoader.load('textures/planet/2k_stars_milky_way.jpg'); 
scene.background = backgroundTexture;  

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(10, 10, 20);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; // Enable shadows

// Add controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Load the texture for the Sun 
const sunTexture = textureLoader.load('textures/planet/2k_sun.jpg');

// Create the Sun with texture
const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture,  
  emissive: "orange", 
  emissiveIntensity: 0.5, 
  roughness: 0.1, 
  metalness: 0.1, 
});
  
const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), sunMaterial);
scene.add(sun);
sun.castShadow = false; // Sun emits light but doesn't cast shadows

// Add Light
const directionalLight = new THREE.PointLight(0xffffff, 500, 100);
directionalLight.position.set(0, 0, 0); // Sunlight originates from Sun
directionalLight.castShadow = true; // Enable shadow casting for the light
scene.add(directionalLight);

// Configure shadow properties
directionalLight.shadow.mapSize.width = 2048; 
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5; // Start of shadow range
directionalLight.shadow.camera.far = 100;  // End of shadow range


// GUI controls for light
const lightFolder = gui.addFolder("Sun");


lightFolder.add(directionalLight, "intensity", 0, 1000, 10);


// Texture paths for the Earth and Moon
const texturesME = [
  'textures/planet/2k_earth_daymap.jpg',
  'textures/planet/2k_moon.jpg',        
];

// Add data for Earth and Moon
const dataME = [
  { size: 3, distance: 17, speed: 0.03 }, // Earth (around Sun)
  { size: 1, distance: 6, speed: 0.5 },  // Moon (around Earth)
];

// Create Sun orbit
const sunOrbit = new THREE.Object3D();
scene.add(sunOrbit);

// Create the Earth
const earthTexture = textureLoader.load(texturesME[0]);
const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.5 });
const earth = new THREE.Mesh(new THREE.SphereGeometry(dataME[0].size, 32, 32), earthMaterial);
earth.userData = { speed: dataME[0].speed, distance: dataME[0].distance };
earth.castShadow = true; // Earth casts shadows
earth.receiveShadow = true; // Earth receives shadows

// Add Earth's orbit to Sun's orbit
const earthOrbit = new THREE.Object3D();
earthOrbit.add(earth); // Earth is a child of its own orbit
sunOrbit.add(earthOrbit); // Earth's orbit revolves around the Sun

// Create the Moon
const moonTexture = textureLoader.load(texturesME[1]);
const moonMaterial = new THREE.MeshStandardMaterial({ 
  map: moonTexture, 
  roughness: 0.5, 
  emissive: "white", 
  emissiveIntensity: 0.2,  });
const moon = new THREE.Mesh(new THREE.SphereGeometry(dataME[1].size, 32, 32), moonMaterial);
moon.userData = { speed: dataME[1].speed, distance: dataME[1].distance };
moon.castShadow = true; // Moon casts shadows
moon.receiveShadow = true; // Moon receives shadow

// Create a separate spotlight for the Moon
const moonSpotLight = new THREE.SpotLight(0xaaaaaa, 700, 50, Math.PI / 4, 0.5, 2); // Light color, intensity, range, angle, penumbra, decay
moonSpotLight.position.set(earth.position.x + moon.position.x, earth.position.y + moon.position.y, earth.position.z + moon.position.z); // Position near the Moon
moonSpotLight.target = moon; // Target the Moon for a focused light
scene.add(moonSpotLight);

// Add Moon's orbit to Earth
const moonOrbit = new THREE.Object3D();
moonOrbit.add(moon); // Moon is a child of its own orbit
earth.add(moonOrbit); // Moon's orbit revolves around Earth

// Add GUI controls for material roughness
gui.add(earthMaterial, "roughness", 0, 1, 0.01).name("Earth Roughness");
gui.add(moonMaterial, "roughness", 0, 1, 0.01).name("Moon Roughness");

// Animation loop
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Rotate Earth's orbit around the Sun
  earthOrbit.rotation.y = elapsedTime * earth.userData.speed;

  // Rotate Moon's orbit around the Earth
  moonOrbit.rotation.y = elapsedTime * moon.userData.speed;

  // Position Earth and Moon relative to their respective orbits
  earth.position.x = earth.userData.distance; // Earth revolves around Sun
  moon.position.x = moon.userData.distance;  // Moon revolves around Earth

  // Rotate Earth and Moon on their axes
  earth.rotation.y += 0.01; // Earth's axial rotation
  moon.rotation.y += 0.02;  // Moon's axial rotation 
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// Handle resizing
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
});
