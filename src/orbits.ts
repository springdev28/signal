import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { asset, link, sources, type WorldId } from './catalog';
import { bindOrbitButtons, mountViewport } from './scene';
import { icon, sourceLink, viewButtons } from './ui';
import { createCelestialEnvironment, illustratePlanet } from './celestial-scene';
import type { SolarisContext } from './solaris';

export function orbitMarkup(odyssey = false, home = false) {
  return `<section class="orbital-interface" aria-label="Orbital navigation">
    <div id="orbital-space" class="simulation-canvas"><p class="view-state" role="status">Opening orbital navigation…</p></div>
    <header class="orbit-heading"><p class="eyebrow">${odyssey ? 'Odyssey · Signal search' : home ? 'Survey • Explore • Recover' : 'Omnecarta'}</p>
      <h1>${odyssey ? 'A signal from Mars.' : home ? 'The silence<br>has a signal.' : 'Chart your descent.'}</h1>
      <p>${odyssey ? 'Locate Mars. Find the transmission. Deploy Astra.' : 'Choose a world in orbit. Find a site. Step onto the surface.'}</p>
    </header>
    ${!home?`<a class="library-link" href="${link('atlas')}?resource=apollo">Mission library · 13 NASA groups ↗</a>`:''}
    <div class="orbital-targets" aria-label="Destinations">
      <button class="world-target" data-world="moon" aria-pressed="false"><span class="target-disc" style="background-image:url('${asset('moon-albedo.webp')}')"></span><span>Moon<small>Hadley–Apennine</small></span>${icon('arrow',18)}</button>
      <button class="world-target" data-world="mars" aria-pressed="false"><span class="target-disc" style="background-image:url('${asset('mars-albedo.webp')}')"></span><span>Mars<small>${odyssey ? 'Unresolved transmission' : 'Meridiani Planum'}</small></span>${icon('arrow',18)}</button>
    </div>
    <section class="orbit-inspector hud-panel" id="orbit-selection" hidden aria-live="polite">
      <button class="close" id="close-orbit-selection" aria-label="Clear destination">×</button>
      <p class="eyebrow">Destination acquired</p><h2 id="orbit-world-name"></h2><p id="orbit-world-detail"></p>
      <a class="button primary" id="approach-world" href="${link('moon')}">Approach world ${icon('arrow',18)}</a>
    </section>
    <div class="orbit-bottom">
      <div class="orbit-time hud-panel"><button class="icon-button" id="pause-orbits" aria-label="Pause orbits">Ⅱ</button>
        <label>Time scale<select id="orbit-speed" aria-label="Orbit speed"><option value="1">1 day / sec</option><option value="8" selected>8 days / sec</option><option value="32">32 days / sec</option></select></label>
        <output id="orbit-day">Day 0.0</output><button class="icon-button" id="reset-orbits" aria-label="Reset simulation time">${icon('reset',18)}</button>
      </div>
      <div class="orbit-view">${viewButtons(true)}</div>
      <p class="orbit-disclosure">Kepler orbit model · sizes and distances compressed<br>${sourceLink(sources.archive,'NASA orbital data')}</p>
    </div>
    <div class="scene-key">Compressed orbits <span>·</span> Drag to orbit <span>·</span> Scroll or pinch to zoom</div>
  </section>`;
}

// Kepler's equation produces faster motion near periapsis. Epoch angles are illustrative.
export function orbitalPoint(days: number, period: number, radius: number, eccentricity: number, phase: number, inclination = 0) {
  const mean = phase + days / period * Math.PI * 2;
  let eccentric = mean;
  for (let i = 0; i < 6; i++) eccentric -= (eccentric - eccentricity * Math.sin(eccentric) - mean) / (1 - eccentricity * Math.cos(eccentric));
  return new THREE.Vector3(radius * (Math.cos(eccentric) - eccentricity), 0,
    radius * Math.sqrt(1 - eccentricity ** 2) * Math.sin(eccentric)).applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
}

function orbitLine(radius: number, eccentricity: number, color: number, inclination = 0) {
  const points = Array.from({ length: 257 }, (_, i) => orbitalPoint(i, 256, radius, eccentricity, 0, inclination));
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .43 }));
}

function atmosphere(radius: number, color: number) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.07, 48, 32), new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(color) } }, transparent: true, depthWrite: false, side: THREE.BackSide,
    vertexShader: 'varying vec3 n; varying vec3 p; void main(){n=normalize(normalMatrix*normal);vec4 v=modelViewMatrix*vec4(position,1.);p=v.xyz;gl_Position=projectionMatrix*v;}',
    fragmentShader: 'uniform vec3 tint;varying vec3 n;varying vec3 p;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(-p))),3.);gl_FragColor=vec4(tint,rim*.55);}',
  }));
}

export async function mountOrbits(context: SolarisContext, odyssey = false) {
  const host = document.querySelector<HTMLElement>('#orbital-space')!;
  const frame = document.querySelector<HTMLElement>('.orbital-interface')!;
  const loader = new THREE.TextureLoader();
  const [moonMap, marsMap, earthMap] = await Promise.all(['moon-albedo.webp','mars-albedo.webp','earth-albedo.jpg'].map(name => loader.loadAsync(asset(name))));
  for (const map of [moonMap, marsMap, earthMap]) { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06151c);
  const environment = createCelestialEnvironment(scene, 270);
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 600);
  let controls: OrbitControls | undefined;
  const reset = () => {
    camera.position.set(0, 25, 35).multiplyScalar(Math.max(1,1.0/camera.aspect));
    controls?.target.set(0, 0, 0);
    controls?.update();
  };
  const renderer = mountViewport(host, camera, reset);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minDistance = 4;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI * .84;
  reset();
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), new THREE.ShaderMaterial({
    vertexShader:'varying vec3 p;varying vec3 n;void main(){p=position;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 p;varying vec3 n;
    void main(){float veins=sin(p.x*31.+sin(p.z*23.)*2.)*sin(p.y*29.+sin(p.x*14.));
    float spots=sin(p.x*101.)*sin(p.y*89.)*sin(p.z*93.);
    vec3 color=mix(vec3(.93,.30,.065),vec3(1.,.79,.39),.6+.18*veins+.06*spots);
    color*=.68+.32*max(0.,n.z);gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
    }`,
  }));
  scene.add(sun, new THREE.PointLight(0xffe5c7, 700, 0, 1.55), new THREE.AmbientLight(0x8babc3, .68));
  const glowCanvas = document.createElement('canvas');glowCanvas.width = glowCanvas.height = 128;
  const brush = glowCanvas.getContext('2d')!;
  const gradient = brush.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'#fff2c0ff');gradient.addColorStop(.17,'#eab577b0');gradient.addColorStop(.45,'#df76452a');gradient.addColorStop(1,'#df764500');
  brush.fillStyle = gradient;brush.fillRect(0,0,128,128);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(12,12,1);scene.add(glow);
  scene.add(orbitLine(8.6,.0167,0xe2b56b),orbitLine(14.6,.0935,0xc78f50,THREE.MathUtils.degToRad(1.848)));
  const earth = new THREE.Group();
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(1.05,48,32),illustratePlanet(new THREE.MeshStandardMaterial({map:earthMap,roughness:.9}),false)),atmosphere(1.05,0x5dbeee));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(.48,48,32),illustratePlanet(new THREE.MeshStandardMaterial({map:moonMap,color:0xffe7b8,roughness:1})));
  const mars = new THREE.Group();
  mars.add(new THREE.Mesh(new THREE.SphereGeometry(.87,48,32),illustratePlanet(new THREE.MeshStandardMaterial({map:marsMap,color:0xf3c29e,roughness:1}))),atmosphere(.87,0xce855e));
  const lunarOrbit = orbitLine(2.0,.0549,0x7e9cab,THREE.MathUtils.degToRad(5.145));
  scene.add(earth,moon,mars,lunarOrbit);
  const labels = new Map<string,HTMLButtonElement>();
  for (const name of ['Earth','Moon','Mars']) {
    const label = document.createElement('button');
    label.className = 'space-label';label.textContent = name;
    label.setAttribute('aria-label',name === 'Earth' ? 'Focus Earth and Moon orbit' : 'Locate ' + name);
    label.addEventListener('click', () => name === 'Earth' ? focusEarth() : select(name.toLowerCase() as WorldId));
    host.append(label);labels.set(name.toLowerCase(),label);
  }
  let days = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, last = 0, selected: WorldId | null = null;
  let transition: { start: number; from: THREE.Vector3; target: THREE.Vector3; destination: THREE.Vector3 } | null = null;
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause-orbits')!;
  const updatePause = () => { pauseButton.textContent = paused ? '▷' : 'Ⅱ';pauseButton.setAttribute('aria-label', paused ? 'Play orbits' : 'Pause orbits'); };
  updatePause();
  pauseButton.addEventListener('click',()=>{paused=!paused;updatePause();});
  document.querySelector('#reset-orbits')!.addEventListener('click',()=>{days=0;});
  const moveCamera = (point: THREE.Vector3, distance: number) => {
    transition = {start:performance.now(),from:camera.position.clone(),target:controls!.target.clone(),destination:point.clone()};
    transition.destination.y += distance * .65;
    transition.destination.z += distance;
  };
  let tracking:THREE.Object3D|undefined;
  const priorTracked=new THREE.Vector3();
  function focusEarth() { selected=null;tracking=earth;priorTracked.copy(earth.position);paused=true;updatePause();moveCamera(earth.position,8); }
  function select(id: WorldId) {
    selected=id;paused=true;updatePause();
    tracking=id==='moon'?earth:mars;priorTracked.copy(tracking.position);
    context.selection=id;context.subject=(id==='moon'?'Moon':'Mars')+' · Orbital approach';
    const name = id==='moon'?'Moon':'Mars';
    document.querySelector('#orbit-selection')!.removeAttribute('hidden');
    document.querySelector('#orbit-world-name')!.textContent=name;
    document.querySelector('#orbit-world-detail')!.textContent=id==='moon'?'A trail from Apollo 15 leads to Hadley–Apennine. Approach to locate the landing site.':odyssey?'A weak transmission is coming from the surface. Approach Mars to locate its source.':'Find Opportunity’s landing site and explore the terrain at Meridiani Planum.';
    const approach=document.querySelector<HTMLAnchorElement>('#approach-world')!;
    approach.href=link(id)+(odyssey&&id==='mars'?'?mission=odyssey':'');
    approach.innerHTML='Approach '+name+' '+icon('arrow',18);
    for(const button of frame.querySelectorAll<HTMLButtonElement>('[data-world]'))button.setAttribute('aria-pressed',String(button.dataset.world===id));
    moveCamera(id==='moon'?earth.position:mars.position,id==='moon'?8:6);
    frame.dataset.target=id;
  }
  for (const button of frame.querySelectorAll<HTMLButtonElement>('[data-world]'))button.addEventListener('click',()=>select(button.dataset.world as WorldId));
  document.querySelector('#close-orbit-selection')!.addEventListener('click',()=>{
    selected=null;tracking=undefined;transition=null;delete frame.dataset.target;document.querySelector('#orbit-selection')!.setAttribute('hidden','');reset();
    for(const button of frame.querySelectorAll<HTMLButtonElement>('[data-world]'))button.setAttribute('aria-pressed','false');
  });
  bindOrbitButtons(frame,controls,reset,()=>{transition=null;});
  renderer.domElement.removeAttribute('aria-hidden');renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Orbital view. Arrow keys rotate, plus and minus zoom, Home resets the view.');
  renderer.domElement.addEventListener('keydown',event=>{
    const actions:Record<string,string>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'reset'};
    const action=actions[event.key];
    if(action){event.preventDefault();frame.querySelector<HTMLButtonElement>(`[data-view="${action}"]`)!.click();}
  });
  frame.querySelector('[data-view-actions]')!.removeAttribute('hidden');
  controls.addEventListener('start',()=>{transition=null;});
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let down=[0,0];
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);
    if(ray.intersectObject(moon,true).length)select('moon');
    else if(ray.intersectObject(mars,true).length)select('mars');
    else if(ray.intersectObject(earth,true).length)focusEarth();
  });
  const projected=new THREE.Vector3();
  let animation=0, ambienceTime=0;
  function draw(now:number) {
    const delta=last?Math.min(.06,(now-last)/1000):0;last=now;
    if(!paused&&!document.hidden&&!document.querySelector('dialog[open]')) { days+=delta*Number(document.querySelector<HTMLSelectElement>('#orbit-speed')!.value); ambienceTime+=delta; }
    environment.update(ambienceTime);
    earth.position.copy(orbitalPoint(days,365.256,8.6,.0167,2.15));
    lunarOrbit.position.copy(earth.position);
    moon.position.copy(earth.position).add(orbitalPoint(days,27.3217,2,.0549,-.4,THREE.MathUtils.degToRad(5.145)));
    mars.position.copy(orbitalPoint(days,686.98,14.6,.0935,-.52,THREE.MathUtils.degToRad(1.848)));
    earth.children[0].rotation.y=days*Math.PI*2;
    moon.rotation.y=days*Math.PI*2/27.3217;
    mars.children[0].rotation.y=days*Math.PI*2/1.026;
    if(tracking&&!transition){camera.position.add(tracking.position.clone().sub(priorTracked));controls!.target.copy(tracking.position);}
    if(tracking)priorTracked.copy(tracking.position);
    if(transition){
      const t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-transition.start)/1100);
      const ease=t*t*(3-2*t);
      camera.position.lerpVectors(transition.from,transition.destination,ease);
      controls!.target.lerpVectors(transition.target,selected==='mars'?mars.position:earth.position,ease);
      if(t===1)transition=null;
    }
    controls!.update();renderer.render(scene,camera);
    // Projected labels yield to real controls and to each other as the orbit moves.
    // Destination buttons remain available when a label has no clear screen space.
    const hudBounds = [...frame.querySelectorAll<HTMLElement>('.orbit-heading,.orbital-targets,.orbit-inspector,.orbit-bottom'), document.querySelector<HTMLElement>('.topbar')!]
      .filter(element => element.offsetWidth > 0 && element.offsetHeight > 0 && getComputedStyle(element).visibility !== 'hidden')
      .map(element => element.getBoundingClientRect());
    const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right + 6 && a.right > b.left - 6 && a.top < b.bottom + 6 && a.bottom > b.top - 6;
    for(const [id,object] of [['earth',earth],['moon',moon],['mars',mars]] as const){
      projected.copy(object.position).project(camera);
      const label=labels.get(id)!;
      label.hidden=Math.abs(projected.x)>.92||Math.abs(projected.y)>.82||projected.z>1;
      label.style.left=`calc(${(projected.x+1)*50}% + ${id==='moon'?18:id==='earth'?-14:0}px)`;label.style.top=(1-projected.y)*50+'%';
      label.dataset.selected=String(id===selected);
      if (!label.hidden) {
        const bounds = label.getBoundingClientRect();
        label.hidden = bounds.left < 6 || bounds.right > host.clientWidth - 6 || hudBounds.some(rect => overlaps(bounds, rect));
        if (!label.hidden) hudBounds.push(bounds);
      }
    }
    document.querySelector('#orbit-day')!.textContent='Day '+days.toFixed(1);
    frame.dataset.simulatedDays=days.toFixed(3);
    animation=requestAnimationFrame(draw);
  }
  host.querySelector('.view-state')!.remove();host.classList.add('view-ready');draw(performance.now());
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(animation);environment.dispose();controls!.dispose();renderer.dispose();},{once:true});
}
