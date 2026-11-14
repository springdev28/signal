export function springAngle(){
  let angle=0,velocity=0;
  return (target:number,dt:number,frequency=15,damping=.65)=>{
    const count=Math.max(1,Math.ceil(dt/.008)),h=dt/count;
    for(let i=0;i<count;i++){velocity+=(frequency*frequency*(target-angle)-2*damping*frequency*velocity)*h;angle+=velocity*h;}
    return angle;
  };
}
