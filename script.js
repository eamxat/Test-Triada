/**
 * CODIGO CREADO POR EAM96
 */

console.log("%cCODIGO CREADO POR EAM96 - EXCLUSIVAMENTE PARA USO PERSONAL.", "color: #ff8822; font-size: 14px; font-weight: bold; background-color: #15062a; padding: 10px; border-radius: 5px;");

let scene, camera, renderer, material, mesh;
let clock = new THREE.Clock();
let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
const STORAGE_KEY = 'organic_bg_config_xat';

const defaultConfig = {
    color1: '#15062a',
    color2: '#91165b',
    color3: '#ff8822',
    speed: 0.15,
    elevation: 1.4,
    frequency: 0.25,
    colorOffset: 0.6,
    colorMultiplier: 1.1,
    wireframe: false,
    isPanelOpen: false 
};

let config = { ...defaultConfig };
let saveTimeout = null;

const controlsList = [
    { id: 'ctrl-color1', ind: 'ind-color1', key: 'color1', type: 'color', uniform: 'uColor1' },
    { id: 'ctrl-color2', ind: 'ind-color2', key: 'color2', type: 'color', uniform: 'uColor2' },
    { id: 'ctrl-color3', ind: 'ind-color3', key: 'color3', type: 'color', uniform: 'uColor3' },
    { id: 'ctrl-offset', key: 'colorOffset', type: 'float', uniform: 'uColorOffset' },
    { id: 'ctrl-contrast', key: 'colorMultiplier', type: 'float', uniform: 'uColorMultiplier' },
    { id: 'ctrl-speed', key: 'speed', type: 'float', uniform: 'uSpeed' },
    { id: 'ctrl-elevation', key: 'elevation', type: 'float', uniform: 'uElevation' },
    { id: 'ctrl-frequency', key: 'frequency', type: 'float', uniform: 'uFrequency' },
    { id: 'ctrl-wireframe', key: 'wireframe', type: 'bool' }
];

function loadConfig() {
    try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
            config = { ...config, ...JSON.parse(savedConfig) };
        }
        config.isPanelOpen = false; // Inicia siempre cerrado
    } catch (e) {
        console.error("Error al cargar config", e);
    }
}

function requestSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }, 500); 
}

function init() {
    loadConfig();
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, -1, 5); 
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    container.appendChild(renderer.domElement);

    material = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: config.speed },
            uElevation: { value: config.elevation },
            uFrequency: { value: config.frequency },
            uColor1: { value: new THREE.Color(config.color1) },
            uColor2: { value: new THREE.Color(config.color2) },
            uColor3: { value: new THREE.Color(config.color3) },
            uColorOffset: { value: config.colorOffset },
            uColorMultiplier: { value: config.colorMultiplier }
        },
        wireframe: config.wireframe,
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(25, 25, 256, 256);
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI * 0.25; 
    scene.add(mesh);

    setupUIValues();

    window.addEventListener('resize', onWindowResize, { passive: true });
    document.addEventListener('mousemove', onMouseMove, { passive: true });

    animate();
    setInterval(pollDOMAndSync, 50); 
}

function setupUIValues() {
    const toggleBtn = document.getElementById('panel-toggle');
    const closeBtn = document.getElementById('close-btn');
    const toolbar = document.getElementById('horizontal-toolbar');

    const updateVisibility = () => {
        if (config.isPanelOpen) toolbar.classList.remove('collapsed');
        else toolbar.classList.add('collapsed');
    };

    updateVisibility();

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        config.isPanelOpen = !config.isPanelOpen;
        requestSave();
        updateVisibility();
    }, { capture: true });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        config.isPanelOpen = false;
        requestSave();
        updateVisibility();
    }, { capture: true });

    controlsList.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) {
            if (c.type === 'bool') el.checked = !!config[c.key];
            else el.value = config[c.key];

            if (c.type === 'color' && c.ind) {
                const indEl = document.getElementById(c.ind);
                if (indEl) indEl.style.backgroundColor = config[c.key];
            }
        }
    });
}

function pollDOMAndSync() {
    if (!material) return;
    let changesDetected = false;

    controlsList.forEach(c => {
        const el = document.getElementById(c.id);
        if (!el) return;

        if (c.type === 'color') {
            const val = el.value.trim();
            if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(val)) {
                if (val !== config[c.key]) {
                    config[c.key] = val;
                    material.uniforms[c.uniform].value.set(val);
                    el.classList.remove('error');
                    changesDetected = true;
                }
                if (c.ind) {
                    const indEl = document.getElementById(c.ind);
                    if (indEl) indEl.style.backgroundColor = val;
                }
            } else if (val !== config[c.key]) {
                el.classList.add('error');
            }
        } 
        else if (c.type === 'float') {
            const val = parseFloat(el.value);
            if (!isNaN(val) && val !== config[c.key]) {
                config[c.key] = val;
                material.uniforms[c.uniform].value = val;
                changesDetected = true;
            }
        } 
        else if (c.type === 'bool') {
            const val = el.checked;
            if (val !== config[c.key]) {
                config[c.key] = val;
                material.wireframe = val;
                material.needsUpdate = true;
                changesDetected = true;
            }
        }
    });

    if (changesDetected) requestSave();
}

function onMouseMove(event) {
    targetX = (event.clientX / window.innerWidth) * 2 - 1;
    targetY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    if(!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (!material || !renderer) return;

    const elapsedTime = clock.getElapsedTime();
    material.uniforms.uTime.value = elapsedTime;

    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;
    camera.position.x = mouseX * 1.5;
    camera.position.y = (mouseY * 0.5) - 1.0; 
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

window.onload = init;
