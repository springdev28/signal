import { evidence, rover } from './catalog';
import { atlasBar, photo } from './atlas-ui';
import { routeLink } from './ui';
import type { SolarisContext } from './solaris';
import { chartSurface } from './chart';

export function experimentMarkup() {
  return `<article class="shell experiment">
    ${atlasBar()}
    <div class="overview-heading">
      ${routeLink('opportunity','← Opportunity','back-link')}
      <h1>Dust and solar power</h1>
      <p>Change the dust level to see when Opportunity’s battery begins to drain. Values are normalized for this teaching model.</p>
    </div>
    <div class="experiment-grid">
      <section class="panel solar-visual">
        <div class="sim-scene" id="sim-scene" aria-hidden="true"><div class="sun"></div><div class="beam"></div><div class="solar-panel"></div><div class="dust"></div></div>
        <div class="experiment-controls">
          <label for="dust">Dust level <output id="dust-value" for="dust">0%</output></label>
          <input id="dust" type="range" min="0" max="100" value="0" step="1">
          <div class="mission-actions"><button class="button primary" id="play" aria-pressed="false">Play</button><button class="button outline" id="reset">Reset</button></div>
        </div>
      </section>
      <section class="panel experiment-readings">
        <h2>Power balance</h2>
        <dl><div><dt>Sunlight reaching panels</dt><dd id="light">100%</dd></div>
        <div><dt>Solar output</dt><dd id="power">100 units</dd></div>
        <div><dt>Net battery change</dt><dd id="net">+55 units</dd></div>
        <div><dt>Battery level</dt><dd id="charge">50%</dd></div></dl>
        <meter id="battery" min="0" max="100" value="50" aria-label="Battery level"></meter>
        <p id="balance" role="status">Charging</p>
        <figure class="power-figure"><canvas id="power-graph" width="550" height="224" role="img" aria-label="Solar output compared with demand"></canvas>
          <figcaption>Solar output by dust level. The dashed line marks demand at 45 units.</figcaption></figure>
      </section>
    </div>
    <section class="mission-record"><h2>Evidence from Opportunity</h2><div class="evidence">${photo(evidence.selfie)}</div></section>
  </article>`;
}

export function mountExperiment(context: SolarisContext) {
  const config = rover.simulation;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const dust = $<HTMLInputElement>('dust');
  const play = $<HTMLButtonElement>('play');
  const meter = $<HTMLMeterElement>('battery');
  const canvas = $<HTMLCanvasElement>('power-graph');
  let battery = config.initialBattery, playing = false, previous = 0, frame = 0;
  let resumeAfterChat = false;
  const ratio = () => Number(dust.value) / 100;
  const sunlight = () => 1 - config.dustLoss * ratio();
  const output = () => config.maxOutput * sunlight();
  const net = () => output() - config.demand;

  function drawGraph() {
    const surface = chartSurface(canvas, 208);
    if (!surface) return;
    const { context: graph, width, height, fontSize, color } = surface;
    const left = fontSize*2.5+8, right = width-fontSize*2, top = fontSize, bottom = height-fontSize*2.5;
    const x = (value: number) => left + value * (right - left);
    const y = (value: number) => bottom - value / 100 * (bottom - top);
    graph.fillStyle = color('--muted');
    graph.strokeStyle = color('--soft-line');
    for (const label of [0,50,100]) {
      graph.fillText(String(label),4,y(label)+5);
      graph.beginPath(); graph.moveTo(left,y(label)); graph.lineTo(right,y(label)); graph.stroke();
      graph.fillText(label+'%',x(label/100)-17,height-7);
    }
    graph.strokeStyle=color('--muted');
    graph.setLineDash([6,5]);
    graph.beginPath(); graph.moveTo(left,y(config.demand)); graph.lineTo(right,y(config.demand)); graph.stroke();
    graph.setLineDash([]);
    graph.strokeStyle=color('--cyan'); graph.lineWidth=3;
    graph.beginPath(); graph.moveTo(left,y(100)); graph.lineTo(right,y(100*(1-config.dustLoss))); graph.stroke();
    graph.lineWidth=1;
    graph.fillStyle=color('--cyan-strong');
    graph.beginPath(); graph.arc(x(ratio()),y(output()),7,0,Math.PI*2); graph.fill();
    canvas.setAttribute('aria-label',`At ${dust.value}% dust, solar output is ${Math.round(output())} units and demand is ${config.demand} units.`);
  }
  new ResizeObserver(drawGraph).observe(canvas);
  void document.fonts.ready.then(drawGraph);

  function renderReadings() {
    $('dust-value').textContent=dust.value+'%';
    $('sim-scene').style.setProperty('--dust',String(ratio()));
    $('light').textContent=Math.round(sunlight()*100)+'%';
    $('power').textContent=Math.round(output())+' units';
    $('net').textContent=(net()>=0?'+':'')+Number(net().toFixed(1))+' units';
    const balance=net()<0?'Battery draining':'Battery charging';
    $('balance').classList.toggle('warning',net()<0);
    if($('balance').textContent!==balance)$('balance').textContent=balance;
    drawGraph();
    renderBattery();
  }

  function renderBattery() {
    $('charge').textContent=Math.round(battery)+'%';
    meter.value=battery;
  }

  function tick(now: number) {
    if(!playing)return;
    if(previous)battery=Math.min(100,Math.max(0,battery+net()*config.unitsPerSecond*Math.min((now-previous)/1000,.1)));
    previous=now;
    renderBattery();
    frame=requestAnimationFrame(tick);
  }

  function setPlaying(next: boolean) {
    playing=next;
    previous=0;
    cancelAnimationFrame(frame);
    play.setAttribute('aria-pressed',String(playing));
    play.textContent=playing?'Pause':'Play';
    if(playing)frame=requestAnimationFrame(tick);
  }

  context.pause = paused => {
    if (paused) {
      resumeAfterChat = playing;
      if (playing) setPlaying(false);
    } else if (resumeAfterChat) {
      resumeAfterChat = false;
      setPlaying(true);
    }
  };
  play.addEventListener('click',()=>setPlaying(!playing));
  $('reset').addEventListener('click',()=>{
    setPlaying(false);
    dust.value='0';
    battery=config.initialBattery;
    renderReadings();
  });
  dust.addEventListener('input',renderReadings);
  document.addEventListener('visibilitychange',()=>{previous=0;});
  renderReadings();
}
