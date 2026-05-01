import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// -----------------------------------------
// UI TOGGLE LOGIC
// -----------------------------------------
const physicsPanel = document.getElementById('physics-panel');
document.getElementById('physics-header').addEventListener('click', () => {
    physicsPanel.classList.toggle('collapsed');
    document.getElementById('physics-toggle').innerText = physicsPanel.classList.contains('collapsed') ? '▲' : '▼';
});

// -----------------------------------------
// 1. SCENE & CAMERA SETUP
// -----------------------------------------
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0008); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 120, 220); 

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.toneMapping = THREE.ACESFilmicToneMapping; 
renderer.toneMappingExposure = 1.5; 
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 2000;
controls.target.set(0, 0, 0); 
controls.update();

let isRecentering = true;
controls.addEventListener('start', () => {
    isRecentering = false; 
});

// -----------------------------------------
// 2. MATHEMATICAL N-BODY PHYSICS ENGINE
// -----------------------------------------
const G = 4000; 
const massA = 1.0;  
const massB = 0.5;  
const massP = 0.001; 

const distAB = 40; 
const vOrbitAB = Math.sqrt(G * (massA + massB) / distAB); 

const posA = new THREE.Vector3(13.333, 0, 0); 
const velA = new THREE.Vector3(0, 0, vOrbitAB * (massB / (massA + massB))); 

const posB = new THREE.Vector3(-26.666, 0, 0); 
const velB = new THREE.Vector3(0, 0, -vOrbitAB * (massA / (massA + massB))); 

const distP = 150;
const vOrbitP = Math.sqrt(G * (massA + massB) / distP); 
const posP = new THREE.Vector3(150, 0, 0);
const velP = new THREE.Vector3(0, 0, vOrbitP);

// -----------------------------------------
// 3. TEXTURES & MESHES
// -----------------------------------------
function createSolarTexture(baseHex, midHex, topHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; 
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = baseHex; 
    ctx.fillRect(0, 0, 1024, 1024);
    
    for(let i = 0; i < 150; i++) {
        const x = Math.random() * 1024, y = Math.random() * 1024, r = Math.random() * 50 + 20;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, 'rgba(10, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    for(let i = 0; i < 40000; i++) {
        const x = Math.random() * 1024, y = Math.random() * 1024, r = Math.random() * 6 + 1;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, topHex);
        gradient.addColorStop(0.5, midHex);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 4; 
    return texture;
}

const sunTexture = createSolarTexture('#1a0000', '#dd3300', '#ff8800'); 
const redDwarfTexture = createSolarTexture('#0a0000', '#990000', '#ff1100');

const starAGeo = new THREE.SphereGeometry(18, 64, 64); 
const starAMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: sunTexture, emissiveIntensity: 1.2, roughness: 1.0 }); 
const starA = new THREE.Mesh(starAGeo, starAMat);
const lightA = new THREE.PointLight(0xffeedd, 45000, 3000); 
starA.add(lightA);
scene.add(starA);

const starBGeo = new THREE.SphereGeometry(10, 64, 64); 
const starBMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: redDwarfTexture, emissiveIntensity: 1.2, roughness: 1.0 });
const starB = new THREE.Mesh(starBGeo, starBMat);
const lightB = new THREE.PointLight(0xff3311, 35000, 3000); 
starB.add(lightB);
scene.add(starB);

scene.add(new THREE.AmbientLight(0xffffff, 0.4)); 

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous'); 
const earthMap = textureLoader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/planets/earth_atmos_2048.jpg');
const earthNormal = textureLoader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/planets/earth_normal_2048.jpg');
const earthClouds = textureLoader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/planets/earth_clouds_1024.png');

const planetGeo = new THREE.SphereGeometry(6, 64, 64); 
const planetMat = new THREE.MeshStandardMaterial({ map: earthMap, normalMap: earthNormal, roughness: 0.7, metalness: 0.1 });
const planet = new THREE.Mesh(planetGeo, planetMat);
scene.add(planet);

const cloudGeo = new THREE.SphereGeometry(6.1, 64, 64); 
const cloudMat = new THREE.MeshStandardMaterial({ map: earthClouds, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
planet.add(clouds);

// -----------------------------------------
// 4. HELICAL ORBIT TRAILS & STARFIELD
// -----------------------------------------
function createTrail(colorHex) {
    const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 }); 
    const geo = new THREE.BufferGeometry();
    const points = new Float32Array(6000 * 3); 
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false; 
    scene.add(line);
    return line;
}
const trailA = createTrail(0xffaa00);
const trailB = createTrail(0xff4411);
const trailP = createTrail(0x8888ff);

function initTrail(trail, startPos) {
    const positions = trail.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = startPos.x;
        positions[i+1] = startPos.y;
        positions[i+2] = startPos.z;
    }
    trail.geometry.attributes.position.needsUpdate = true;
}
initTrail(trailA, posA);
initTrail(trailB, posB);
initTrail(trailP, posP);

function updateTrail(trail, pos) {
    const positions = trail.geometry.attributes.position.array;
    for (let i = positions.length - 1; i >= 3; i--) {
        positions[i] = positions[i - 3];
    }
    positions[0] = pos.x; positions[1] = pos.y; positions[2] = pos.z;
    trail.geometry.attributes.position.needsUpdate = true;
}

const starCount = 8000;
const bgStarGeo = new THREE.IcosahedronGeometry(1.2, 0); 
const bgStarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.8 });
const starField = new THREE.InstancedMesh(bgStarGeo, bgStarMat, starCount);
starField.frustumCulled = false;

const dummy = new THREE.Object3D();
const starData = [];

for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 6000; 
    const y = (Math.random() - 0.5) * 6000;
    const z = (Math.random() - 0.5) * 6000;
    const scale = Math.random() * 1.5 + 0.5;
    starData.push({ x, initialY: y, z, scale }); 
    dummy.position.set(x, y, z);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    starField.setMatrixAt(i, dummy.matrix);
}
scene.add(starField);

// -----------------------------------------
// 5. INTERACTION & PHYSICS LOOP
// -----------------------------------------
let isMovingThroughSpace = false;
let isPaused = false;
let targetFocus = null;
let currentGalacticVelocity = 0; 

const warpToggleBtn = document.getElementById('warp-toggle');
warpToggleBtn.addEventListener('click', () => {
    isMovingThroughSpace = !isMovingThroughSpace;
    warpToggleBtn.style.background = isMovingThroughSpace ? 'rgba(0, 255, 150, 0.4)' : 'rgba(255, 255, 255, 0.1)';

    if (!isMovingThroughSpace) {
        currentGalacticVelocity = 0;
        const barycenterY = (posA.y * massA + posB.y * massB) / (massA + massB);
        posA.y = 0; posB.y = 0; posP.y = 0;
        camera.position.y -= barycenterY;
        controls.target.y -= barycenterY;

        const squashTrail = (trail) => {
            const positions = trail.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] = 0; 
            }
            trail.geometry.attributes.position.needsUpdate = true;
        };
        squashTrail(trailA); squashTrail(trailB); squashTrail(trailP);
    }
});

const pauseToggleBtn = document.getElementById('pause-toggle');
pauseToggleBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseToggleBtn.innerText = isPaused ? "Resume Simulation" : "Pause Simulation";
    pauseToggleBtn.style.background = isPaused ? 'rgba(255, 100, 100, 0.4)' : 'rgba(255, 255, 255, 0.1)';
});

document.getElementById('focus-system').addEventListener('click', () => { targetFocus = null; isRecentering = true; });
document.getElementById('focus-planet').addEventListener('click', () => { targetFocus = planet; isRecentering = false; });
document.getElementById('focus-star-a').addEventListener('click', () => { targetFocus = starA; isRecentering = false; });
document.getElementById('focus-star-b').addEventListener('click', () => { targetFocus = starB; isRecentering = false; });

const clock = new THREE.Clock();
let frameCount = 0;

const elDistAB = document.getElementById('val-dist-ab');
const elDistAC = document.getElementById('val-dist-ac');
const elDistBC = document.getElementById('val-dist-bc');
const elDistPC = document.getElementById('val-dist-pc');
const elVelA = document.getElementById('val-vel-a');
const elVelB = document.getElementById('val-vel-b');
const elVelP = document.getElementById('val-vel-p');

const wrap = (val, min, max) => ((val - min) % (max - min) + (max - min)) % (max - min) + min;

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05); 
    frameCount++;
    let galacticY_Delta = 0;

    if (!isPaused) {
        if (isMovingThroughSpace) {
            currentGalacticVelocity = THREE.MathUtils.lerp(currentGalacticVelocity, 5, delta * 2);
        } else {
            currentGalacticVelocity = 0;
        }

        const timeScale = 6.0; 
        const physicsSteps = 10;
        const dt = (0.01 * timeScale) / physicsSteps;
        galacticY_Delta = currentGalacticVelocity * (0.01 * timeScale);

        for (let i = 0; i < physicsSteps; i++) {
            const rAB = new THREE.Vector3().subVectors(posB, posA);
            const rAP = new THREE.Vector3().subVectors(posP, posA);
            const rBP = new THREE.Vector3().subVectors(posP, posB);
            
            const distAB_sq = Math.max(rAB.lengthSq(), 1);
            const distAP_sq = Math.max(rAP.lengthSq(), 1);
            const distBP_sq = Math.max(rBP.lengthSq(), 1);

            const fAB = (G * massA * massB) / distAB_sq;
            const fAP = (G * massA * massP) / distAP_sq;
            const fBP = (G * massB * massP) / distBP_sq;

            const dirAB = rAB.clone().normalize();
            const dirAP = rAP.clone().normalize();
            const dirBP = rBP.clone().normalize();

            velA.add(dirAB.clone().multiplyScalar(fAB / massA * dt));
            velB.add(dirAB.clone().multiplyScalar(-fAB / massB * dt));
            velP.add(dirAP.clone().multiplyScalar(-fAP / massP * dt));
            velP.add(dirBP.clone().multiplyScalar(-fBP / massP * dt));

            posA.y += currentGalacticVelocity * dt;
            posB.y += currentGalacticVelocity * dt;
            posP.y += currentGalacticVelocity * dt;

            posA.add(velA.clone().multiplyScalar(dt));
            posB.add(velB.clone().multiplyScalar(dt));
            posP.add(velP.clone().multiplyScalar(dt));
        }

        starA.position.copy(posA);
        starB.position.copy(posB);
        planet.position.copy(posP);

        planet.rotation.y += delta * 0.5 * timeScale; 
        clouds.rotation.y += delta * 0.6 * timeScale; 
        starA.rotation.y += delta * 0.05 * timeScale;
        starB.rotation.y += delta * 0.08 * timeScale;

        updateTrail(trailA, posA);
        updateTrail(trailB, posB);
        updateTrail(trailP, posP);

        if (frameCount % 5 === 0) {
            const barycenter = posA.clone().multiplyScalar(massA).add(posB.clone().multiplyScalar(massB)).divideScalar(massA + massB);
            
            elDistAB.innerText = posA.distanceTo(posB).toFixed(3);
            elDistAC.innerText = posA.distanceTo(barycenter).toFixed(3);
            elDistBC.innerText = posB.distanceTo(barycenter).toFixed(3);
            elDistPC.innerText = posP.distanceTo(barycenter).toFixed(3);

            elVelA.innerText = velA.length().toFixed(3);
            elVelB.innerText = velB.length().toFixed(3);
            elVelP.innerText = velP.length().toFixed(3);
        }
    }

    const camY = camera.position.y;
    const stretchY = (isMovingThroughSpace && !isPaused) ? 10 : 1;

    for (let i = 0; i < starCount; i++) {
        let data = starData[i];
        let currentY = wrap(data.initialY, camY - 3000, camY + 3000);
        dummy.position.set(data.x, currentY, data.z);
        dummy.scale.set(data.scale, data.scale * stretchY, data.scale); 
        dummy.updateMatrix();
        starField.setMatrixAt(i, dummy.matrix);
    }
    starField.instanceMatrix.needsUpdate = true;

    camera.position.y += galacticY_Delta; 

    if (targetFocus) {
        controls.target.lerp(targetFocus.position, 0.1);
    } else {
        if (isRecentering) {
            const barycenterY = (posA.y * massA + posB.y * massB) / (massA + massB);
            const targetVec = new THREE.Vector3(0, barycenterY, 0);
            controls.target.lerp(targetVec, 0.1);
            if (controls.target.distanceTo(targetVec) < 0.5) { isRecentering = false; }
        } else {
            controls.target.y += galacticY_Delta;
        }
    }

    controls.update();
    renderer.render(scene, camera); 
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();