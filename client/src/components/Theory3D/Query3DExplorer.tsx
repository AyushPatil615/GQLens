import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

export interface StageStep {
  id: string;
  name: string;
  sub: string;
  desc: string;
  code: string;
  color: string;
  pos: [number, number, number];
  type: 'earth' | 'gas_giant' | 'crater' | 'lava' | 'cyber';
}

// Spread out 3D Solar System Positions
const STAGE_STEPS: StageStep[] = [
  {
    id: 'client',
    name: '1. Client Planet (Origin)',
    sub: 'GraphQL query text dispatched over HTTP POST',
    desc: 'The frontend app constructs a query document string specifying exact fields required and sends it to /graphql.',
    code: 'fetch("/graphql", {\n  method: "POST",\n  body: JSON.stringify({ query: "{ student(id: \\"1\\") { name } }" })\n})',
    color: '#38bdf8',
    pos: [-14, 1, 3],
    type: 'earth',
  },
  {
    id: 'parser',
    name: '2. Parser Gas Giant',
    sub: 'Tokenizes string into Abstract Syntax Tree (AST)',
    desc: 'The GraphQL engine parses the query string into a structured Abstract Syntax Tree (AST). If syntax errors exist, execution halts here immediately.',
    code: '// AST Node\n{\n  kind: "Document",\n  definitions: [{\n    kind: "OperationDefinition",\n    operation: "query",\n    selectionSet: { ... }\n  }]\n}',
    color: '#a855f7',
    pos: [-7, 3.5, -3],
    type: 'gas_giant',
  },
  {
    id: 'validator',
    name: '3. Validator Moon',
    sub: 'Validates query AST against GraphQL Schema',
    desc: 'The validator verifies that requested fields and arguments exist in the Schema and adhere to strict field type contracts.',
    code: 'type Query {\n  student(id: ID!): Student\n}\n\ntype Student {\n  id: ID!\n  name: String!\n}',
    color: '#ec4899',
    pos: [0, -2.5, 2],
    type: 'crater',
  },
  {
    id: 'resolver',
    name: '4. Resolver Lava World',
    sub: 'Executes individual field resolver functions',
    desc: 'GraphQL dispatches field-level resolver functions. Resolvers receive parent, args, context, and info objects to fetch requested data.',
    code: 'const resolvers = {\n  Query: {\n    student: (parent, { id }, ctx) => {\n      return ctx.db.getStudent(id);\n    }\n  }\n};',
    color: '#f97316',
    pos: [7, 3.5, -2],
    type: 'lava',
  },
  {
    id: 'database',
    name: '5. Database Cyber Core',
    sub: 'SQL query execution & JSON payload serialization',
    desc: 'The resolver fetches SQL rows from SQLite database. GraphQL formats the returned data into exact JSON tree requested.',
    code: '-- SQL Executed:\nSELECT id, name FROM students WHERE id = \'1\';\n\n// Response JSON:\n{\n  "data": { "student": { "name": "Alex Rivera" } }\n}',
    color: '#22c55e',
    pos: [14, 0, 3],
    type: 'cyber',
  },
];

// Helper to generate procedural planet textures 🎨
function generatePlanetTexture(type: StageStep['type'], mainColorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = mainColorHex;
    ctx.fillRect(0, 0, 512, 256);

    if (type === 'earth') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#22c55e';
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const r = 25 + Math.random() * 45;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, 80, 512, 25);
      ctx.fillRect(0, 160, 512, 20);
    } else if (type === 'gas_giant') {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#581c87');
      grad.addColorStop(0.3, '#7e22ce');
      grad.addColorStop(0.5, '#c084fc');
      grad.addColorStop(0.7, '#9333ea');
      grad.addColorStop(1, '#3b0764');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
    } else if (type === 'crater') {
      ctx.fillStyle = '#db2777';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#831843';
      for (let i = 0; i < 35; i++) {
        ctx.beginPath();
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const r = 8 + Math.random() * 20;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'lava') {
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#ff4500';
      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 256, 15 + Math.random() * 30, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'cyber') {
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      }
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ── 3D Rocket Mesh Generator 🚀 ──
function createRocketMesh(): THREE.Group {
  const rocket = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.95, 16);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.7,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2;
  rocket.add(body);

  const coneGeo = new THREE.ConeGeometry(0.2, 0.5, 16);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = Math.PI / 2;
  cone.position.z = 0.72;
  rocket.add(cone);

  const finMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
  for (let i = 0; i < 4; i++) {
    const finGeo = new THREE.BoxGeometry(0.06, 0.38, 0.28);
    const fin = new THREE.Mesh(finGeo, finMat);
    const angle = (i * Math.PI) / 2;
    fin.position.x = Math.cos(angle) * 0.23;
    fin.position.y = Math.sin(angle) * 0.23;
    fin.position.z = -0.25;
    fin.rotation.z = angle;
    rocket.add(fin);
  }

  const fireGeo = new THREE.ConeGeometry(0.18, 0.6, 12);
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9 });
  const fire = new THREE.Mesh(fireGeo, fireMat);
  fire.rotation.x = -Math.PI / 2;
  fire.position.z = -0.75;
  rocket.add(fire);

  const fireLight = new THREE.PointLight(0xf59e0b, 4, 8);
  fireLight.position.z = -0.75;
  rocket.add(fireLight);

  rocket.scale.set(1.2, 1.2, 1.2);
  return rocket;
}

// ── Realistic 3D Planet Creator 🪐 ──
function createPlanetGroup(step: StageStep, stepIdx: number): THREE.Group {
  const group = new THREE.Group();

  const texture = generatePlanetTexture(step.type, step.color);
  const sphereGeo = new THREE.SphereGeometry(1.3, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.1,
  });
  const planet = new THREE.Mesh(sphereGeo, sphereMat);
  planet.name = `planet_${stepIdx}`;
  group.add(planet);

  if (step.type === 'gas_giant' || step.type === 'lava') {
    const ringGeo = new THREE.RingGeometry(1.6, 2.4, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(step.color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      roughness: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);
  }

  const atmoGeo = new THREE.SphereGeometry(1.5, 24, 24);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(step.color),
    transparent: true,
    opacity: 0.18,
    wireframe: true,
  });
  const atmo = new THREE.Mesh(atmoGeo, atmoMat);
  group.add(atmo);

  return group;
}

export function Query3DExplorer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [autoPilot, setAutoPilot] = useState<boolean>(true);
  const [isFlightInProgress, setIsFlightInProgress] = useState<boolean>(false);

  const activeStep = STAGE_STEPS[activeStepIdx];

  const activeStepRef = useRef(activeStepIdx);
  useEffect(() => {
    activeStepRef.current = activeStepIdx;
  }, [activeStepIdx]);

  const autoPilotRef = useRef(autoPilot);
  useEffect(() => {
    autoPilotRef.current = autoPilot;
  }, [autoPilot]);

  const targetStepRef = useRef(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 440;

    // ── Three.js Scene Setup ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050711');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(10, 20, 15);
    scene.add(sunLight);

    // Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 450;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 60;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xc7d2fe,
      transparent: true,
      opacity: 0.7,
    });
    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleMesh);

    // ── Build Spread Out Real Planets 🪐 ──
    const planetGroups: THREE.Group[] = [];
    STAGE_STEPS.forEach((step, idx) => {
      const planetGroup = createPlanetGroup(step, idx);
      planetGroup.position.set(...step.pos);
      scene.add(planetGroup);
      planetGroups.push(planetGroup);
    });

    // Flight Path Curve
    const curvePoints = STAGE_STEPS.map(s => new THREE.Vector3(...s.pos));
    curvePoints.push(new THREE.Vector3(...STAGE_STEPS[0].pos));

    const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);
    const tubeGeo = new THREE.TubeGeometry(curve, 140, 0.04, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    // 3D Rocket
    const rocketMesh = createRocketMesh();
    rocketMesh.position.set(...STAGE_STEPS[0].pos);
    scene.add(rocketMesh);

    // Raycaster for Direct 3D Planet Clicks
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && obj !== scene) {
          const matchedIdx = planetGroups.indexOf(obj as THREE.Group);
          if (matchedIdx !== -1) {
            setAutoPilot(false);
            setActiveStepIdx(matchedIdx);
            targetStepRef.current = matchedIdx;
            return;
          }
          obj = obj.parent;
        }
      }
    };
    container.addEventListener('click', handleCanvasClick);

    // Mouse tilt & pointer cursor on hover
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const isHoveringPlanet = intersects.some(hit => {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && obj !== scene) {
          if (planetGroups.includes(obj as THREE.Group)) return true;
          obj = obj.parent;
        }
        return false;
      });
      container.style.cursor = isHoveringPlanet ? 'pointer' : 'grab';
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Flight variables
    let animationFrameId: number;
    let currentT = 0;
    let autoPilotDwellTimer = 0;
    const DWELL_PAUSE_FRAMES = 120;

    // ── Render Loop ──
    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Rotate planets
      planetGroups.forEach((group, idx) => {
        group.rotation.y += 0.007;

        if (idx === activeStepRef.current) {
          const scale = 1 + Math.sin(Date.now() * 0.005) * 0.08;
          group.scale.set(scale, scale, scale);
        } else {
          group.scale.set(1, 1, 1);
        }
      });

      particleMesh.rotation.y += 0.0003;

      // Flight Movement
      if (autoPilotRef.current) {
        if (autoPilotDwellTimer > 0) {
          autoPilotDwellTimer--;
          const dockedPos = new THREE.Vector3(...STAGE_STEPS[activeStepRef.current].pos);
          const orbitOffset = new THREE.Vector3(
            Math.sin(Date.now() * 0.003) * 0.35,
            Math.cos(Date.now() * 0.003) * 0.35,
            0.6
          );
          rocketMesh.position.copy(dockedPos).add(orbitOffset);
          rocketMesh.rotation.y += 0.015;
          setIsFlightInProgress(false);
        } else {
          setIsFlightInProgress(true);
          currentT += 0.0006 * speedRef.current;
          if (currentT > 1) currentT = 0;

          const flightPos = curve.getPointAt(currentT);
          const flightAhead = curve.getPointAt((currentT + 0.008) % 1);

          rocketMesh.position.copy(flightPos);
          rocketMesh.lookAt(flightAhead);

          const currentSegment = Math.min(
            Math.floor(currentT * STAGE_STEPS.length),
            STAGE_STEPS.length - 1
          );

          if (currentSegment !== activeStepRef.current) {
            setActiveStepIdx(currentSegment);
            targetStepRef.current = currentSegment;

            const planetPos = new THREE.Vector3(...STAGE_STEPS[currentSegment].pos);
            if (flightPos.distanceTo(planetPos) < 1.2) {
              autoPilotDwellTimer = DWELL_PAUSE_FRAMES;
            }
          }
        }
      } else {
        // Manual Guided Launch to target planet (Ultra Smooth Slow Lerp)
        const targetPos = new THREE.Vector3(...STAGE_STEPS[targetStepRef.current].pos);
        const dist = rocketMesh.position.distanceTo(targetPos);

        if (dist > 0.4) {
          setIsFlightInProgress(true);
          // Slow lerp speed: 0.015 * speedRef
          rocketMesh.position.lerp(targetPos, 0.015 * speedRef.current);
          rocketMesh.lookAt(targetPos);
        } else {
          setIsFlightInProgress(false);
          const orbitOffset = new THREE.Vector3(
            Math.sin(Date.now() * 0.003) * 0.3,
            Math.cos(Date.now() * 0.003) * 0.3,
            0.6
          );
          rocketMesh.position.copy(targetPos).add(orbitOffset);
          rocketMesh.rotation.y += 0.015;
        }
      }

      // Smooth Camera Tracking
      const activePos = STAGE_STEPS[activeStepRef.current].pos;
      const camTargetX = activePos[0] * 0.4 + mouseX * 2;
      const camTargetY = 4 + mouseY * 1.5;

      camera.position.x += (camTargetX - camera.position.x) * 0.04;
      camera.position.y += (camTargetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    render();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('click', handleCanvasClick);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const launchToPlanet = (targetIdx: number) => {
    setAutoPilot(false);
    setActiveStepIdx(targetIdx);
    targetStepRef.current = targetIdx;
  };

  return (
    <div style={{
      background: '#050711',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 28,
      position: 'relative',
    }}>
      {/* ── Top Control Bar ── */}
      <div style={{
        padding: '12px 18px',
        background: '#0b0f19',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🪐</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
            Real 3D Solar System Traversal
          </span>
          <span style={{
            fontSize: 9.5, fontWeight: 800,
            background: isFlightInProgress ? '#312e81' : '#166534',
            color: isFlightInProgress ? '#a5b4fc' : '#86efac',
            padding: '2px 8px', borderRadius: 20,
            border: isFlightInProgress ? '1px solid #4338ca' : '1px solid #22c55e',
            transition: 'all 0.2s',
          }}>
            {isFlightInProgress ? '🚀 IN FLIGHT TO NEXT PLANET…' : `🪐 DOCKED AT ${activeStep.name.toUpperCase()}`}
          </span>
        </div>

        {/* Flight Mode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setAutoPilot(!autoPilot)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '2px solid #000',
              background: autoPilot ? '#fef08a' : '#c084fc',
              color: '#000',
              fontSize: 11, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '2px 2px 0 #000',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {autoPilot ? '⏸ Pause Auto-Pilot' : '✈️ Auto-Pilot Loop'}
          </button>
        </div>
      </div>

      {/* ── Chain Launch Buttons ── */}
      <div style={{
        padding: '10px 16px',
        background: '#0b0f19',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
          Click Any Planet or Button:
        </span>
        {STAGE_STEPS.map((step, idx) => {
          const isActive = idx === activeStepIdx;
          return (
            <button
              key={step.id}
              onClick={() => launchToPlanet(idx)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '2px solid #000',
                background: isActive ? step.color : '#1e293b',
                color: isActive ? '#000' : '#94a3b8',
                fontSize: 11, fontWeight: 800,
                cursor: 'pointer',
                boxShadow: isActive ? '2px 2px 0 #000' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>🚀</span>
              <span>{step.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3D Stage Container (Clickable Raycast Canvas) ── */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: 420,
          position: 'relative',
        }}
      />

      {/* ── Dynamic Explanation Card Overlay (Flicker-Free Inline Fade) ── */}
      <AnimatePresence>
        <motion.div
          key={activeStep.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            padding: '16px 20px',
            background: '#0b0f19',
            borderTop: '2px solid #1e293b',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {/* Explanation Text */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: activeStep.color,
                boxShadow: `0 0 10px ${activeStep.color}`,
              }} />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                {activeStep.name}
              </h4>
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 11.5, fontWeight: 700, color: activeStep.color }}>
              {activeStep.sub}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              {activeStep.desc}
            </p>
          </div>

          {/* Real Code Snippet Box */}
          <div style={{
            background: '#020617',
            border: `1.5px solid ${activeStep.color}`,
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '3px 3px 0 #000',
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Under the Hood Code
            </div>
            <pre style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.6,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {activeStep.code}
            </pre>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
