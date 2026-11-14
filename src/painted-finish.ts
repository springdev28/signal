/** Shared object-space marks: irregular painted planes, broken hatching and
 * halftone patches. Coordinates come from the mesh, never the screen. */
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
    vec2 brush=strokeCell(uv);
    float value=max(dot(light,vec3(.2126,.7152,.0722)),.001);
    float plane=floor(value*4.5+brush.x*.55)/4.5;
    vec3 color=light*mix(1.,max(.035,plane)/value,.34);
    color*=.86+brush.y*.26;
    color=mix(shadowInk*.42,color,smoothstep(.004,.075,value));
    float strokeLine=abs(fract((uv.x+uv.y*.58)*11.)-.5);
    float aa=max(fwidth(strokeLine),.015);
    float hatch=1.-smoothstep(.085-aa,.085+aa,strokeLine);
    float dotDistance=length(fract(uv*8.)-.5);
    float dots=1.-smoothstep(.16,.16+max(fwidth(dotDistance),.015),dotDistance);
    float middle=step(.12,value)*(1.-step(.95,value));
    float marks=middle*(step(.66,brush.x)*hatch*.2+step(brush.x,.22)*dots*.14);
    color=mix(color,shadowInk,marks);
    float dryEdge=step(.5,brush.y)*step(.88,1.-facing);
    color=mix(color,edgeInk,dryEdge*.26);
    return color;
  }
`;
