/** Subtle object-space pigment variation, preserving continuous light values. */
export const paintedFinishGLSL = `
  float strokeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  vec2 strokeCell(vec2 uv){
    // Staggered brush blocks keep marks attached to the object without a
    // nine-cell Voronoi search per fragment on every painted surface.
    vec2 cell=floor(uv+vec2(sin(floor(uv.y)*1.7)*.31,0.));
    return vec2(strokeHash(cell),strokeHash(cell+31.7));
  }
  vec2 surfaceStrokeUV(vec3 p){
    vec3 n=abs(normalize(cross(dFdx(p),dFdy(p))));
    return n.x>n.y&&n.x>n.z?p.yz:n.y>n.z?p.xz:p.xy;
  }
  vec3 paintedFinish(vec3 light,vec2 uv,vec3 shadowInk,vec3 edgeInk,float facing){
    float detail=1.-smoothstep(.2,.8,length(fwidth(uv)));
    float strokes=sin(uv.x*15.+sin(uv.y*4.)*.7)*sin(uv.y*1.9+uv.x*.4);
    // A small multiplicative variation cannot flatten shadows or draw a
    // bright outline across the ground at grazing camera angles.
    return light*(1.+strokes*.025*detail);
  }
`;
