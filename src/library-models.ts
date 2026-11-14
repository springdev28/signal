import * as THREE from 'three';
const mat=(c:number,m=.2)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:.66});
export function originalInstrument(id:string){
 const root=new THREE.Group(),white=mat(0xc9c9be,.3),gold=mat(0xa88045,.5),steel=mat(0x667e8d,.55),dark=mat(0x1c2932),blue=mat(0x233e59,.3);
 const box=(name:string,p:number[],s:number[],m:THREE.Material)=>{const e=new THREE.Mesh(new THREE.BoxGeometry(...s as [number,number,number]),m);e.name=name;e.position.set(...p as [number,number,number]);root.add(e);return e;};
 const cyl=(name:string,p:number[],radius:number,h:number,m:THREE.Material,r=radius)=>{const e=new THREE.Mesh(new THREE.CylinderGeometry(r,radius,h,32),m);e.name=name;e.position.set(...p as [number,number,number]);root.add(e);return e;};
 const rod=(name:string,a:number[],b:number[],r=.025,m=steel)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),e=cyl(name,av.clone().add(bv).multiplyScalar(.5).toArray(),r,bv.clone().sub(av).length(),m);e.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return e;};
 const sphere=(name:string,p:number[],s:number[],m:THREE.Material)=>{const e=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),m);e.name=name;e.position.set(...p as [number,number,number]);e.scale.set(...s as [number,number,number]);root.add(e);return e;};
 const cable=(name:string,points:number[][])=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const e=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.015,6,false),dark);e.name=name;root.add(e);};
 if(id==='sojourner'){
  box('Thermal body',[0,.45,0],[1,.4,1.45],gold);box('solar deck',[0,.68,0],[1.25,.06,1.7],white);
  for(let x=0;x<10;x++)for(let z=0;z<13;z++)box('solar cell',[(x-4.5)*.115,.716,(z-6)*.121],[.104,.007,.111],blue);
  for(const x of [-.72,.72])for(const z of [-.64,0,.64]){const w=cyl('wheel tire',[x,.25,z],.25,.15,dark);w.rotation.z=Math.PI/2;const hub=cyl('wheel hub',[x+Math.sign(x)*.08,.25,z],.13,.02,gold);hub.rotation.z=Math.PI/2;for(let k=0;k<16;k++){const a=k/16*Math.PI*2,r=box('wheel cleat',[x,.25+Math.cos(a)*.25,z+Math.sin(a)*.25],[.18,.026,.075],steel);r.rotation.x=a;}rod('suspension',[x,.25,z],[x*.7,.48,0],.045);}
  box('stereo camera assembly',[0,.52,-.78],[.70,.21,.12],white);for(const x of [-.23,.23]){const lens=cyl('camera lens',[x,.54,-.86],.065,.05,dark);lens.rotation.x=Math.PI/2;}
  rod('spectrometer arm',[0,.45,.7],[0,.20,.99],.04);const apxs=cyl('spectrometer',[0,.22,1.02],.14,.18,steel);apxs.rotation.x=Math.PI/2;rod('antenna',[.42,.72,.52],[.42,1.37,.52],.012);
 }else if(id==='surveyor'){
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,x=Math.sin(a)*1.4,z=Math.cos(a)*1.4;rod('landing leg',[x,.12,z],[x*.38,1.6,z*.38],.055,white);rod('landing brace',[x,.18,z],[-x*.24,.82,-z*.24],.035,white);cyl('landing footpad',[x,.07,z],.24,.07,steel);rod('landing frame',[Math.sin(a)*.48,1.5,Math.cos(a)*.48],[Math.sin(a+2.094)*.48,1.5,Math.cos(a+2.094)*.48],.045,white);}
  box('Electronics bay',[0,.95,0],[.8,.47,.62],gold);cyl('retro engine',[0,.48,0],.29,.50,dark,.12);rod('solar mast',[0,1.4,0],[0,2.85,0],.045,white);const panel=box('solar panel',[0,2.82,0],[1.3,.04,.63],blue);panel.rotation.x=.35;for(let i=0;i<10;i++)rod('solar grid',[-.6+i*.13,2.85,-.29],[-.6+i*.13,2.85,.29],.006,white);
  cyl('camera',[.35,1.78,-.12],.12,.65,white);sphere('camera mirror',[.35,2.12,-.12],[.14,.12,.14],steel);rod('sampler boom',[.25,.8,-.3],[.4,.48,-1.55],.06,white);box('sampler scoop',[.4,.3,-1.65],[.32,.25,.32],steel);cable('camera cable',[[.35,1.9,-.12],[.55,1.4,-.25],[.3,1,-.2]]);
 }else{
  box('Central station',[0,.32,0],[.8,.64,.65],gold);for(let i=0;i<9;i++)box('Station radiator',[-.36+i*.09,.66,0],[.025,.03,.61],white);rod('Station antenna',[0,.66,0],[0,1.7,0],.018);cyl('Station antenna dish',[0,1.7,0],.17,.035,white);
  cyl('generator core',[1.35,.38,.2],.18,.65,gold);for(let i=0;i<12;i++){const a=i/12*Math.PI*2,e=box('generator radiator fin',[1.35+Math.cos(a)*.16,.38,.2+Math.sin(a)*.16],[.36,.59,.02],dark);e.rotation.y=-a;}for(const dx of [-.23,.23])rod('generator support',[1.35+dx,.28,.2],[1.35+dx,.06,.2],.026);
  sphere('seismometer shield',[-1.3,.2,.35],[.4,.2,.4],white);cyl('seismometer base',[-1.3,.04,.35],.43,.08,steel);
  const x=-.65,z=-1.2;for(let i=0;i<3;i++){const a=i*2.094;rod('magnetometer tripod',[x,.85,z],[x+Math.sin(a)*.32,.02,z+Math.cos(a)*.32],.018,white);rod('magnetometer boom',[x,.85,z],[x+Math.sin(a)*.65,1.0,z+Math.cos(a)*.65],.018,white);box('magnetometer sensor',[x+Math.sin(a)*.65,1.0,z+Math.cos(a)*.65],[.13,.13,.13],gold);}
  cable('generator cable',[[.4,.02,0],[.8,.03,-.15],[1.35,.02,.1]]);cable('seismometer cable',[[-.4,.02,0],[-.9,.025,-.2],[-1.3,.02,.35]]);cable('magnetometer cable',[[0,.03,-.3],[-.1,.03,-.9],[x,.03,z]]);
 }
 root.traverse(n=>{if(n instanceof THREE.Mesh){n.castShadow=n.receiveShadow=true;}});return root;
}
