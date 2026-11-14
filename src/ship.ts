import * as THREE from 'three';
import { barrel, rounded, strut, tube } from './geometry';
import { paintModel } from './paint';
import { astraMaterial } from './astra-materials';

export function createShip(radar?:THREE.Texture){
  const ship=new THREE.Group(),interior=new THREE.Group(),exteriorTrim=new THREE.Group();
  ship.add(exteriorTrim);
  const hull=astraMaterial(0x687f85,'enamel',.42),edge=astraMaterial(0xaab4ad,'steel',.55),brass=astraMaterial(0xb68b57,'brass',.5),dark=astraMaterial(0x24343e,'steel',.3);
  const cyan=new THREE.MeshStandardMaterial({color:0x66e0f3,emissive:0x1b8ca9,emissiveIntensity:2,roughness:.65});
  interior.add(rounded([2.5,.16,3.9],.05,dark,[0,.23,.05]));
  for(let i=0;i<13;i++)interior.add(rounded([1.65,.025,.045],.008,edge,[0,.326,-1.55+i*.26]));
  for(const side of [-1,1])interior.add(tube([[side*1.1,.34,1.7],[side*1.13,.34,.5],[side*1.12,.4,-.8],[side*.92,.67,-1.25]],.025,brass));
  const shellGeometry=new THREE.SphereGeometry(1,32,18),shellVertices=shellGeometry.getAttribute('position'),shellIndices=shellGeometry.getIndex()!,kept:number[]=[];
  for(let i=0;i<shellIndices.count;i+=3){
    const ids=[shellIndices.getX(i),shellIndices.getX(i+1),shellIndices.getX(i+2)];
    const x=ids.reduce((sum,id)=>sum+shellVertices.getX(id),0)/3,z=ids.reduce((sum,id)=>sum+shellVertices.getZ(id),0)/3;
    if(!(Math.abs(x)<.36&&z<-.65))kept.push(...ids);
  }
  shellGeometry.setIndex(kept);
  const shell=new THREE.Mesh(shellGeometry,hull);shell.scale.set(1.65,.98,3);shell.position.y=1.05;ship.add(shell);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x153340,metalness:.5,roughness:.2,transparent:true,opacity:.36,depthWrite:false}));
  canopy.scale.set(1.36,1.2,2.25);canopy.position.set(0,1.28,-.45);ship.add(canopy);
  for(const side of [-1,1]){
    const wingShape=new THREE.Shape();wingShape.moveTo(1.15*side,-1.5);wingShape.lineTo(3.25*side,.9);wingShape.lineTo(2.7*side,2);wingShape.lineTo(1.1*side,1.6);wingShape.closePath();
    const wing=new THREE.Mesh(new THREE.ExtrudeGeometry(wingShape,{depth:.12,bevelEnabled:true,bevelSize:.08,bevelThickness:.05,bevelSegments:2,steps:1}),hull);wing.rotation.x=Math.PI/2;wing.position.y=1.1;ship.add(wing);
    ship.add(barrel(.43,3.7,hull,[side*1.82,.93,.4],'z'),barrel(.48,.15,brass,[side*1.82,.93,1.95],'z'),barrel(.33,.18,dark,[side*1.82,.93,2.09],'z'));
    for(let i=0;i<8;i++)ship.add(rounded([.13,.62,.19],.03,edge,[side*1.83+Math.sin(i*Math.PI/4)*.39,.93+Math.cos(i*Math.PI/4)*.39,1.2]));
    for(let i=0;i<12;i++){const a=i*Math.PI/6;const blade=rounded([.035,.21,.05],.007,edge,[side*1.82+Math.sin(a)*.23,.93+Math.cos(a)*.23,2.195]);blade.rotation.z=-a+.35;exteriorTrim.add(blade);}
    exteriorTrim.add(tube([[side*1.4,1.22,-.7],[side*1.6,1.4,-.2],[side*1.75,1.35,.4],[side*1.9,1.18,.7]],.023,brass));
    for(let i=0;i<7;i++)exteriorTrim.add(barrel(.443,.038,i%3===0?brass:edge,[side*1.82,.93,-1.15+i*.39],'z'));
    for(let i=0;i<5;i++)exteriorTrim.add(rounded([.22,.035,.43],.01,dark,[side*(1.85+i*.2),1.19,1.3]));
    for(const z of [-1.6,1.4]){
      ship.add(strut([side*.9,.8,z],[side*1.5,.12,z+.2],.065,edge),strut([side*1.3,.6,z],[side*1.5,.12,z+.2],.09,dark),rounded([.65,.12,.65],.07,hull,[side*1.5,.08,z+.2]));
    }
    ship.add(strut([side*1.3,1.25,1],[side*1.1,2.3,-1.3],.06,edge),strut([side*1.1,2.3,-1.3],[side*.82,1.4,-2.55],.065,hull));
    const console=rounded([.55,.42,2.1],.08,dark,[side*1.02,.75,-.35]);interior.add(console);
    for(let i=0;i<7;i++){
      interior.add(rounded([.25,.018,.07],.005,i%3?brass:cyan,[side*1.02,.97,-1.1+i*.21]));
      interior.add(barrel(.035,.06,edge,[side*.86,.98,-1.1+i*.21],'y',12));
    }
    interior.add(tube([[side*1.22,.6,.65],[side*1.3,1.1,.6],[side*1.28,1.7,-.3],[side*1.1,2.05,-1.5]],.035,brass));
    const glow=new THREE.PointLight(0x72d4eb,9,6,1.4);glow.position.set(side*.8,1.4,-.6);interior.add(glow);
  }
  const dashboard=rounded([2.1,.35,.58],.075,dark,[0,.83,-1.25]);dashboard.rotation.x=.2;interior.add(dashboard);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.82,.52),new THREE.MeshBasicMaterial({...(radar?{map:radar}:{}),color:radar?0xffffff:0x164655}));screen.position.set(0,1.035,-1.12);screen.rotation.x=-.48;interior.add(screen);
  for(const side of [-1,1]){
    interior.add(rounded([.42,.14,.12],.03,brass,[side*.65,1.05,-1.08]),strut([side*.57,.94,-.57],[side*.57,1.24,-.69],.035,dark));
    for(let i=0;i<4;i++)interior.add(rounded([.05,.02,.12],.005,cyan,[side*.83,.99,-1.28+i*.13]));
  }
  interior.add(strut([-1.2,2.25,-1.5],[1.2,2.25,-1.5],.08,hull),strut([-.82,1.4,-2.55],[.82,1.4,-2.55],.06,edge));
  // Scuffed metal seams and fasteners are geometry, attached to the actual hull.
  for(let i=0;i<20;i++){
    const angle=i/20*Math.PI*2;
    exteriorTrim.add(barrel(.035,.026,brass,[Math.cos(angle)*1.64,1.05+Math.sin(angle)*.96,.7],'z',8));
  }
  ship.add(interior);
  const hatch=new THREE.Group();hatch.position.set(0,.24,-2.53);
  hatch.add(rounded([1.04,1.8,.1],.04,hull,[0,.9,0]));
  for(let i=0;i<6;i++)hatch.add(rounded([.86,.03,.025],.007,edge,[0,.16+i*.19,-.065]));
  ship.add(hatch);
  const jets=[-1,1].map(side=>{
    const jet=new THREE.Mesh(new THREE.ConeGeometry(.28,1,24,1,true),new THREE.MeshBasicMaterial({color:0x78d9f4,transparent:true,opacity:.64,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    jet.rotation.x=Math.PI/2;jet.position.set(side*1.82,.93,2.6);ship.add(jet);return jet;
  });
  const downJets=[-1,1].map(side=>{
    const jet=new THREE.Mesh(new THREE.ConeGeometry(.4,1.6,20,1,true),new THREE.MeshBasicMaterial({color:0xffbb6d,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    jet.position.set(side*1.2,-.55,.6);ship.add(jet);return jet;
  });
  paintModel(ship,.9);
  return {ship,interior,hatch,jets,downJets,shell,canopy,exteriorTrim};
}
