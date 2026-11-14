export type GroundDirection = 'forward' | 'backward' | 'left' | 'right';

export const movementKeys: Record<string, GroundDirection> = {
  w:'forward', arrowup:'forward', s:'backward', arrowdown:'backward',
  a:'left', arrowleft:'left', d:'right', arrowright:'right',
};

/** Camera azimuth is measured from +Z; forward always points into the view. */
export function relativeMovement(directions: Iterable<GroundDirection>, azimuth: number) {
  const held=new Set(directions);
  const forward=Number(held.has('forward'))-Number(held.has('backward'));
  const right=Number(held.has('right'))-Number(held.has('left'));
  const length=Math.max(1,Math.hypot(forward,right));
  return {
    x:(right*Math.cos(azimuth)-forward*Math.sin(azimuth))/length,
    z:(-right*Math.sin(azimuth)-forward*Math.cos(azimuth))/length,
  };
}

export function createGroundMotion(topSpeed: number) {
  let vx=0,vz=0;
  return {
    stop(){vx=vz=0;},
    step(x:number,z:number,seconds:number){
      const length=Math.hypot(x,z), magnitude=Math.max(1,length);
      const blend=1-Math.exp(-(length>.001?10:16)*seconds);
      vx+=(x/magnitude*topSpeed-vx)*blend;
      vz+=(z/magnitude*topSpeed-vz)*blend;
      if(length<.001&&Math.hypot(vx,vz)<.025)vx=vz=0;
      return {x:vx*seconds,z:vz*seconds,speed:Math.hypot(vx,vz),fraction:Math.hypot(vx,vz)/topSpeed};
    },
  };
}

export function turnToward(current:number,target:number,seconds:number){
  const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
  return current+delta*(1-Math.exp(-12*seconds));
}
