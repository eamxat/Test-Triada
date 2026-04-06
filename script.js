// ========================================================
// PROTECCIÓN ANTI-INSPECCIÓN Y CÓDIGO FUENTE
// ========================================================
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
    }
});

// ========================================================
// CODIGO CREADO POR EAM 96
// ========================================================
console.log("%cCODIGO CREADO POR EAM96 - EXCLUSIVAMENTE PARA USO PERSONAL.", "color: #ff8822; font-size: 14px; font-weight: bold; background-color: #15062a; padding: 10px; border-radius: 5px;");

// ========================================================
// SHADERS (Movidos aquí para evitar el Error 200 en GitHub)
// ========================================================
const vertexShaderCode = `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uElevation;
    uniform float uFrequency;
    varying vec2 vUv;
    varying float vElevation;

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0 );
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        float elevation = snoise(vec3(modelPosition.x * uFrequency, modelPosition.y * uFrequency, uTime * uSpeed)) * uElevation;
        elevation += snoise(vec3(modelPosition.x * uFrequency * 2.5, modelPosition.y * uFrequency * 2.5, uTime * uSpeed * 1.5)) * (uElevation * 0.2);
        modelPosition.z += elevation;
        vElevation = elevation;
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
`;

const fragmentShaderCode = `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uColorOffset;
    uniform float uColorMultiplier;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
        float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
        vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, mixStrength));
        color = mix(color, uColor3, smoothstep(0.5, 1.0, mixStrength));
        gl_FragColor = vec4(color, 1.0);
    }
`;

// ========================================================
// MOTOR THREE.JS
// ========================================================
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
        config.isPanelOpen = false;
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

    // Aquí pasamos los shaders desde las variables de texto en lugar del HTML
    material = new THREE.ShaderMaterial({
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode,
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
