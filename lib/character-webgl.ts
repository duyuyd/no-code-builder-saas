import type {CharacterModel} from "@/lib/character-model";
export type CameraView={yaw:number;pitch:number;distance:number};
export type CharacterRenderer={draw:(model:CharacterModel,camera:CameraView,phase:number)=>void;dispose:()=>void};
const vert=[
"attribute vec3 aPosition; attribute vec3 aNormal;",
"uniform vec3 uOffset; uniform vec3 uScale;",
"uniform float uBodyYaw,uOrbitYaw,uOrbitPitch,uDistance,uAspect;",
"varying float vLight;",
"void main(){",
"float c=cos(uBodyYaw),s=sin(uBodyYaw);",
"vec3 w=vec3(aPosition.x*uScale.x*c+aPosition.z*uScale.z*s,aPosition.y*uScale.y,-aPosition.x*uScale.x*s+aPosition.z*uScale.z*c)+uOffset;",
"vec3 p=w-vec3(0.0,1.75,0.0);float cy=cos(uOrbitYaw),sy=sin(uOrbitYaw);",
"vec3 r=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);float cp=cos(uOrbitPitch),sp=sin(uOrbitPitch);",
"vec3 camera=vec3(r.x,r.y*cp-r.z*sp,r.y*sp+r.z*cp);",
"float depth=max(0.2,uDistance-camera.z);",
"gl_Position=vec4(camera.x*2.0/max(uAspect,0.25),camera.y*2.0,depth-0.24,depth);",
"vec3 n=normalize(vec3(aNormal.x*c+aNormal.z*s,aNormal.y,-aNormal.x*s+aNormal.z*c));",
"vLight=clamp(0.53+0.43*max(dot(n,normalize(vec3(-0.4,0.9,0.65))),0.0),0.2,1.0);",
"}"].join("\n");
const frag=[
"precision mediump float;uniform vec4 uColor;varying float vLight;",
"void main(){gl_FragColor=vec4(uColor.rgb*vLight,uColor.a);}"].join("\n");
function cubeVertices(){
 const P=(x:number,y:number,z:number)=>[x,y,z];
 const sides:[number[][],number[]][]=[
  [[P(-.5,-.5,.5),P(.5,-.5,.5),P(.5,.5,.5),P(-.5,.5,.5)],[0,0,1]],
  [[P(.5,-.5,-.5),P(-.5,-.5,-.5),P(-.5,.5,-.5),P(.5,.5,-.5)],[0,0,-1]],
  [[P(.5,-.5,.5),P(.5,-.5,-.5),P(.5,.5,-.5),P(.5,.5,.5)],[1,0,0]],
  [[P(-.5,-.5,-.5),P(-.5,-.5,.5),P(-.5,.5,.5),P(-.5,.5,-.5)],[-1,0,0]],
  [[P(-.5,.5,.5),P(.5,.5,.5),P(.5,.5,-.5),P(-.5,.5,-.5)],[0,1,0]],
  [[P(-.5,-.5,-.5),P(.5,-.5,-.5),P(.5,-.5,.5),P(-.5,-.5,.5)],[0,-1,0]]
 ];
 const out:number[]=[];
 for(const [v,n] of sides)for(const i of [0,1,2,0,2,3])out.push(...v[i],...n);
 return new Float32Array(out);
}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function rgb(hex:string):[number,number,number]{
 if(!/^#[a-f0-9]{6}$/i.test(hex))return [.9,.9,.9];
 return [1,3,5].map(n=>parseInt(hex.slice(n,n+2),16)/255) as [number,number,number];
}
function compile(gl:WebGLRenderingContext,type:number,source:string){
 const shader=gl.createShader(type);
 if(!shader)throw Error("WebGL không thể cấp phát shader");
 gl.shaderSource(shader,source);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||"Shader không hợp lệ");
 return shader;
}
export function createCharacterRenderer(canvas:HTMLCanvasElement):CharacterRenderer{
 const gl=canvas.getContext("webgl",{alpha:false,antialias:true,preserveDrawingBuffer:true,powerPreference:"low-power"});
 if(!gl)throw Error("WebGL không khả dụng. Hãy bật tăng tốc đồ họa trình duyệt.");
 const vs=compile(gl,gl.VERTEX_SHADER,vert),fs=compile(gl,gl.FRAGMENT_SHADER,frag);
 const program=gl.createProgram();
 if(!program)throw Error("WebGL: không tạo được program");
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||"Lỗi kết nối shader");
 gl.deleteShader(vs);gl.deleteShader(fs);
 const buf=gl.createBuffer();if(!buf)throw Error("WebGL: thiếu vertex buffer");
 gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,cubeVertices(),gl.STATIC_DRAW);
 gl.useProgram(program);
 const p=gl.getAttribLocation(program,"aPosition"),n=gl.getAttribLocation(program,"aNormal");
 if(p<0||n<0)throw Error("WebGL: thiếu thuộc tính vertex");
 gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(n);
 gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(n,3,gl.FLOAT,false,24,12);
 const U=(k:string)=>gl.getUniformLocation(program,k);
 const u={offset:U("uOffset"),scale:U("uScale"),body:U("uBodyYaw"),yaw:U("uOrbitYaw"),pitch:U("uOrbitPitch"),distance:U("uDistance"),aspect:U("uAspect"),color:U("uColor")};
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const draw=(m:CharacterModel,camera:CameraView,phase:number)=>{
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(window.devicePixelRatio||1,1.5);
  const pw=Math.min(1600,Math.round(w*dpr)),ph=Math.min(1200,Math.round(h*dpr));
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
  gl.viewport(0,0,pw,ph);gl.clearColor(.045,.083,.145,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.uniform1f(u.yaw,camera.yaw);gl.uniform1f(u.pitch,camera.pitch);
  gl.uniform1f(u.distance,clamp(camera.distance,4.5,16));gl.uniform1f(u.aspect,w/h);
  const box=(c:string,x:number,y:number,z:number,bw:number,bh:number,bd:number,rotation=0,alpha=1)=>{
   const [r,g,b]=rgb(c);
   gl.uniform3f(u.offset,x,y,z);gl.uniform3f(u.scale,bw,bh,bd);gl.uniform1f(u.body,rotation);
   gl.uniform4f(u.color,r,g,b,alpha);gl.drawArrays(gl.TRIANGLES,0,36);
  };
  const scene=m.scene??"studio";
  const floors:Record<string,string>={studio:"#34445a",forest:"#325f3b",arena:"#3b4164",castle:"#55505a",stadium:"#1c6843"};
  box(floors[scene]??floors.studio,0,-.25,0,11,.35,11);
  if(scene==="forest"){
   for(const [x,z] of [[-3,-2],[-3,2],[3,-2],[3,2]]){
    box("#72543b",x,1.3,z,.36,2.6,.36);box("#2e8b57",x,3,z,1.4,2,1.4);
   }
  }else if(scene==="arena"||scene==="castle"){
   for(const x of [-3.5,3.5]){
    box("#847b78",x,1.55,-3.1,.65,3.1,.65);
    box(scene==="castle"?"#c3b8a4":"#e4b35d",x,3.12,-3.1,1,.3,1);
   }
   box("#2d2a32",0,2.4,-4,7,.18,.4);
  }else if(scene==="stadium"){
   box("#e5e7eb",0,.02,-3.5,4,.12,.14);
   box("#e5e7eb",-2,1,-3.5,.15,2,.16);box("#e5e7eb",2,1,-3.5,.15,2,.16);
   for(const x of [-3,3])box("#e5e7eb",x,.01,0,.10,.02,10);
  }else{
   for(const x of [-3,3])box("#5d718e",x,1.2,-3.6,.2,2.4,.2);
  }
  const t=phase*(m.timelineSpeed??1),motion=m.pose==="run"?Math.sin(t*4.2)*.39:m.pose==="combat"?Math.sin(t*2.8)*.22:0;
  const victory=m.pose==="victory"?Math.sin(t*2.5)*.22:0;
  const bob=m.pose==="run"?Math.abs(Math.sin(t*4.2))*.09:0;
  const torso=m.bodyWidth;
  box(m.outfit,0,2.13+bob,0,1.12*torso,1.24,.58);
  box(m.skin,0,2.81+bob,0,.37,.25,.34);
  box(m.skin,0,3.33+bob,0,.90*m.headSize,.96*m.headSize,.78*m.headSize);
  box(m.hair,0,3.81+bob,0,.94*m.headSize,.20*m.headSize,.83*m.headSize);
  box("#171923",-.19*m.headSize,3.4+bob,.415*m.headSize,.115,.115,.05);
  box("#171923",.19*m.headSize,3.4+bob,.415*m.headSize,.115,.115,.05);
  box(m.outfit,-.76*torso,2.1+bob+motion,0,.34,1.12*m.armLength,.41,motion*.35);
  box(m.outfit,.76*torso,2.1+bob-motion+victory,0,.34,1.12*m.armLength,.41,-motion*.35-victory);
  box(m.pants,-.31*torso,.85+motion,0,.43,1.26*m.legLength,.46,motion*.18);
  box(m.pants,.31*torso,.85-motion,0,.43,1.26*m.legLength,.46,-motion*.18);
  box(m.hair,-.31*torso,.17+motion,.24,.53,.30,.72);
  box(m.hair,.31*torso,.17-motion,.24,.53,.30,.72);
  if(m.equipment==="sword"){
   box("#7e6d50",.92,1.43,.18,.11,.59,.11,-.3+motion*.25);
   box("#d6d8e6",1,2.15,.19,.13,1.03,.10,-.3+motion*.25);
   box("#d5ac50",1,1.65,.19,.41,.10,.2);
  }else if(m.equipment==="staff"){
   box("#8a6039",1.05,1.58,.15,.15,2.5,.15,.2);box("#8c68ff",1.14,3,.15,.43,.45,.43);
  }else if(m.equipment==="shield"){
   box("#8b5cf6",1.06,1.9,.33,.75,1.03,.17);box("#fbbf24",1.06,1.9,.44,.39,.68,.11);
  }
  if(m.aura&&m.aura!=="none"){
   gl.depthMask(false);
   const color=m.aura==="flame"?"#f97316":m.aura==="electric"?"#5eead4":"#86efac";
   const scale=1+Math.sin(t*3)*.08;
   box(color,0,1.89,0,2.48*scale,3.86*scale,1.38*scale,0,.16);
   gl.depthMask(true);
  }
 };
 return {draw,dispose:()=>{gl.deleteBuffer(buf);gl.deleteProgram(program);}};
}
