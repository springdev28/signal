import * as pc from 'playcanvas';
import {beam,material,primitive,color,texture} from './world';
import {asset} from '../catalog';
import {landing,type Expedition} from './state';
export function cockpit(app:pc.AppBase,camera:pc.Entity,host:HTMLElement){
 const root=new pc.Entity('Modeled survey cockpit');camera.addChild(root);root.setLocalPosition(0,.16,-.14);
 const alloy=material(0x33434a,.65,.42),rim=material(0x9b865d,.65,.46),dark=material(0x101c23,.5,.3),edge=material(0x6a7c80,.7,.4);
 const cyan=material(0x8adce0,.2,.5);cyan.emissive.copy(color(0x62aeb7));cyan.emissiveIntensity=1.2;cyan.update();
 // Worn physical console, with sloped wings and a raised instrument binnacle.
 void texture(app,asset('painted-surface.jpg')).then(t=>{for(const m of [alloy,rim,dark,edge]){m.diffuseMap=t;m.diffuseMapTiling.set(3,2);m.update();}});
 const deck=primitive(root,'Console chassis','box',[0,-1.42,-1.5],[3.7,.56,.58],alloy,[14,0,0]);
 const left=primitive(root,'Left instrument plinth','box',[-.74,-.77,-1.63],[.65,.4,.2],dark,[0,0,-7]);
 const right=primitive(root,'Right instrument plinth','box',[.77,-.77,-1.63],[.73,.4,.2],dark,[0,0,7]);
 beam(root,[-1.9,-.91,-1.7],[-.40,-.86,-1.7],.032,rim);beam(root,[.4,-.86,-1.7],[1.9,-.91,-1.7],.032,rim);
 for(const s of [-1,1]){
  beam(root,[s*1.76,-1.12,-1.4],[s*1.64,.85,-1.7],.085,alloy);beam(root,[s*1.64,.85,-1.7],[s*.75,1.10,-1.75],.065,edge);
  beam(root,[s*1.65,-.5,-1.67],[s*1.63,.7,-1.72],.014,rim);
  for(let i=0;i<10;i++)primitive(root,'Canopy fastener','sphere',[s*1.67,-.50+i*.13,-1.60],[.021,.021,.012],rim);
  primitive(root,'Cold console lamp','box',[s*.65,-.52,-1.68],[.36,.017,.026],cyan);
 }
 beam(root,[-.75,1.10,-1.75],[.75,1.10,-1.75],.075,alloy);
 const radarNode=new pc.Entity('Circular radar housing');root.addChild(radarNode);radarNode.setLocalPosition(0,-.67,-1.55);
 primitive(radarNode,'Radar housing','cylinder',[0,0,-.03],[.69,.10,.69],alloy,[90,0,0]);
 primitive(radarNode,'Radar metal bevel','cylinder',[0,0,.025],[.64,.022,.64],rim,[90,0,0]);
 function screen(parent:pc.Entity,name:string,w:number,h:number,p:number[],size=512){const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d')!;const tex=new pc.Texture(app.graphicsDevice,{width:size,height:size,mipmaps:false,minFilter:pc.FILTER_LINEAR,magFilter:pc.FILTER_LINEAR});tex.setSource(canvas);const mat=material(0x000000);mat.useLighting=false;mat.emissive.set(1,1,1);mat.emissiveMap=tex;mat.emissiveIntensity=1.2;mat.opacityMap=tex;mat.opacityMapChannel='a';mat.blendType=pc.BLEND_NORMAL;mat.useFog=false;mat.update();const e=primitive(parent,name,'plane',p,[w,1,h],mat,[90,0,0]);e.render!.castShadows=false;return{canvas,ctx,tex,e};}
 const radar=screen(radarNode,'Radar phosphor',.60,.60,[0,0,.041]);
 const readout=screen(root,'Heading and altitude glass',.39,.30,[-.68,-.71,-1.50],256);
 const status=screen(root,'Contact readout',.33,.18,[.47,-.63,-1.48],256);
 const pivot=new pc.Entity('Throttle lever pivot');root.addChild(pivot);pivot.setLocalPosition(.91,-.92,-1.36);
 primitive(root,'Throttle gate','box',[.91,-.80,-1.5],[.12,.4,.055],dark);
 for(let i=0;i<=5;i++)primitive(root,'Throttle detent','box',[.84,-.92+i*.052,-1.459],[.025,.008,.008],rim);
 beam(pivot,[0,0,0],[0,.28,0],.024,edge,'Throttle shaft');primitive(pivot,'Throttle grip','box',[0,.28,0],[.14,.07,.09],alloy);primitive(pivot,'Throttle light','box',[0,.28,.05],[.10,.014,.008],cyan);
 const throttleLabel=screen(root,'Throttle percentage',.15,.12,[.91,-.51,-1.48],128);
 const targets:Record<string,pc.Entity>={};const buttons:Record<string,HTMLButtonElement>={};
 for(const [id,x,label]of [['scan',.42,'SCAN'],['lock',.62,'LOCK']] as const){
  const b=primitive(root,label+' switch bezel','cylinder',[x,-.84,-1.44],[.15,.046,.15],rim,[90,0,0]);
  primitive(b,label+' switch cap','cylinder',[0,.54,0],[.84,.30,.84],alloy);
  const face=screen(root,label+' engraved label',.15,.15,[x,-.84,-1.408],128);face.ctx.fillStyle='#112731';face.ctx.fillRect(0,0,128,128);face.ctx.strokeStyle='#8bb5bd';face.ctx.lineWidth=2;face.ctx.strokeRect(4,4,120,120);face.ctx.fillStyle='#c8e8e9';face.ctx.font='bold 25px monospace';face.ctx.textAlign='center';face.ctx.fillText(label,64,73);face.tex.upload();targets[id]=face.e;
  const button=document.createElement('button');button.className='pc-physical-hit';button.id='pc-'+id;button.setAttribute('aria-label',id==='scan'?'Scan':'Lock contact');button.innerHTML=`<span class="sr-only">${label}</span>`;host.append(button);buttons[id]=button;
 }
 const lever=document.createElement('input');lever.type='range';lever.min='0';lever.max='100';lever.value='0';lever.id='pc-throttle';lever.className='pc-throttle-hit';lever.setAttribute('aria-label','Throttle');lever.setAttribute('orient','vertical');host.append(lever);
 function dragLever(e:PointerEvent){const r=lever.getBoundingClientRect();lever.value=String(Math.round(Math.max(0,Math.min(100,(1-(e.clientY-r.top)/r.height)*100))));lever.dispatchEvent(new Event('input',{bubbles:true}));}
 lever.addEventListener('pointerdown',e=>{e.preventDefault();lever.setPointerCapture(e.pointerId);dragLever(e);});lever.addEventListener('pointermove',e=>{if(lever.hasPointerCapture(e.pointerId)){e.preventDefault();dragLever(e);}});
 const point=new pc.Vec3();let lastLayout=0;
 const light=new pc.Entity('Instrument light');light.addComponent('light',{type:'omni',color:color(0x6aa2ba),intensity:1.7,range:3});light.setLocalPosition(0,-.37,-1.1);root.addChild(light);
 function positionHit(el:HTMLElement,e:pc.Entity,w:number,h=w){camera.camera!.worldToScreen(e.getPosition(),point);el.style.left=point.x+'px';el.style.top=point.y+'px';el.style.width=w+'px';el.style.height=h+'px';}
 let pressed=0;buttons.scan.addEventListener('click',()=>pressed=.13);
 function update(s:Expedition,time:number,throttle:number,speed:number,bank:number,selected:number){
  const aspect=app.graphicsDevice.width/app.graphicsDevice.height,phone=aspect<.85;
  // Instruments retain their circular form and physical depth on phone screens.
  root.setLocalEulerAngles(0,0,bank*.18);radarNode.setLocalScale(phone?.72:1,phone?.72:1,1);radarNode.setLocalPosition(phone?-.02:0,phone?-.70:-.67,-1.55);
  readout.e.setLocalPosition(phone?-.35:-.68,phone?-.64:-.71,-1.50);readout.e.setLocalScale(phone?.20:.39,1,phone?.24:.30);
  status.e.setLocalPosition(phone?.31:.47,phone?-.62:-.63,-1.48);status.e.setLocalScale(phone?.18:.33,1,.16);
  targets.scan.setLocalPosition(phone?.20:.42,phone?-.82:-.84,-1.408);targets.lock.setLocalPosition(phone?.36:.62,phone?-.82:-.84,-1.408);
  // Associated switch geometry follows the engraved faces, so hit targets never float.
  for(const id of ['scan','lock']){const n=root.findByName((id==='scan'?'SCAN':'LOCK')+' switch bezel')!;n.setLocalPosition(targets[id].getLocalPosition().clone().add(new pc.Vec3(0,0,-.032)));}
  pivot.setLocalPosition(phone?-.37:.91,-.94,-1.36);pivot.setLocalEulerAngles(-35+throttle*.65,0,0);
  throttleLabel.e.setLocalPosition(phone?-.37:.91,phone?-.86:-.51,-1.32);throttleLabel.e.setLocalScale(phone?.12:.15,1,.10);
  left.setLocalScale(phone?.45:.65,.4,.2);right.setLocalScale(phone?.45:.73,.4,.2);deck.setLocalScale(3.7,.56,.58);
  pressed=Math.max(0,pressed-1/60);targets.scan.setLocalPosition(targets.scan.getLocalPosition().add(new pc.Vec3(0,0,-pressed*.1)));
  const c=s.contacts[selected],g=radar.ctx;g.clearRect(0,0,512,512);g.save();g.translate(256,256);g.beginPath();g.arc(0,0,249,0,Math.PI*2);g.clip();g.fillStyle='#06151d';g.fillRect(-256,-256,512,512);
  g.strokeStyle='#386373';g.lineWidth=1.5;for(const r of [62,124,186,245]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}for(let a=0;a<Math.PI*2;a+=Math.PI/6){g.beginPath();g.moveTo(Math.sin(a)*40,Math.cos(a)*40);g.lineTo(Math.sin(a)*245,Math.cos(a)*245);g.stroke();}
  const sweep=time*1.35;for(let i=0;i<28;i++){g.strokeStyle=`rgba(103,217,221,${.22*(1-i/28)})`;g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(Math.sin(sweep-i*.025)*244,-Math.cos(sweep-i*.025)*244);g.stroke();}
  const factor=1.10;for(const contact of s.contacts){if(!contact.samples.length)continue;const dx=contact.x-s.x,dz=contact.z-s.z,rad=s.heading*Math.PI/180;const x=(dx*Math.cos(rad)+dz*Math.sin(rad))*factor,y=(-dx*Math.sin(rad)+dz*Math.cos(rad))*factor;if(Math.hypot(x,y)>238)continue;g.strokeStyle=contact.locked?'#84e5e6':'#e8b672';g.fillStyle=contact.locked?'#84e5e6':'#e8b672';g.lineWidth=2;g.beginPath();g.arc(x,y,Math.max(5,contact.radius*factor),0,Math.PI*2);g.stroke();g.fillRect(x-2,y-2,4,4);}
  if(s.stage==='approach'){const dx=landing.x-s.x,dz=landing.z-s.z,a=s.heading*Math.PI/180;g.strokeStyle='#fff';g.strokeRect((dx*Math.cos(a)+dz*Math.sin(a))*factor-5,(-dx*Math.sin(a)+dz*Math.cos(a))*factor-5,10,10);}
  g.fillStyle='#d7eeee';g.beginPath();g.moveTo(0,-9);g.lineTo(-6,7);g.lineTo(6,7);g.fill();g.restore();g.fillStyle='#b9d9df';g.font='23px monospace';g.textAlign='center';g.fillText('N',256-Math.sin(s.heading*Math.PI/180)*220,256-Math.cos(s.heading*Math.PI/180)*220);g.fillText('220 m',256,487);radar.tex.upload();
  const r=readout.ctx;r.fillStyle='#071b24';r.fillRect(0,0,256,256);r.textAlign='left';r.fillStyle='#93bfc6';r.font='25px monospace';r.fillText('HDG',16,35);r.fillText('ALT',16,147);r.fillStyle='#d2f3f4';r.font='bold 51px monospace';r.fillText(String((Math.round(s.heading)%360+360)%360).padStart(3,'0')+'°',14,94);r.fillText(Math.round(s.altitude)+'m',14,205);readout.tex.upload();
  const st=status.ctx;st.fillStyle='#071b24';st.fillRect(0,0,256,256);st.textAlign='center';st.fillStyle='#9bc5c9';st.font='27px monospace';st.fillText(`${selected+1}/3 ${c.locked?'PIN':c.samples.length?'RETURN':'SEARCH'}`,128,50);st.fillStyle=c.locked?'#7de0db':'#e4c08b';st.font='bold 44px monospace';st.fillText(c.samples.length?'±'+c.radius.toFixed(1)+'m':'—',128,119);st.fillStyle='#c0d4d4';st.font='25px monospace';st.fillText(speed.toFixed(1)+' m/s',128,194);status.tex.upload();
  const th=throttleLabel.ctx;th.fillStyle='#071b24';th.fillRect(0,0,128,128);th.fillStyle='#a9e3e5';th.textAlign='center';th.font='bold 35px monospace';th.fillText(Math.round(throttle)+'%',64,82);throttleLabel.tex.upload();
  if(time-lastLayout>.05){for(const [id,e]of Object.entries(targets))positionHit(buttons[id],e,phone?48:60);positionHit(lever,pivot,phone?55:75,110);lastLayout=time;}
 }
 return {root,buttons,lever,update};
}
