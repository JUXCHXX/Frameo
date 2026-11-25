import{t as e}from"./react.C1eXT9gT.js";import{t}from"./jsx-runtime.C67a1HSz.js";var n=e(),r=t(),i={color:`#F4F4F5`,eyeColor:`#09090B`},a={color:`#18181B`,eyeColor:`#F4F4F5`},o={color:`#7C5CFF`,eyeColor:`#FAFAFA`},s=[`#7C6AF7`,`#7DD3C7`,`#E8B4D4`];function c(){if(typeof document>`u`)return!1;let e=document.documentElement;if(e.classList.contains(`dark`))return!0;if(e.classList.contains(`light`))return!1;let t=e.getAttribute(`data-theme`);return t===`dark`||t!==`light`&&window.matchMedia(`(prefers-color-scheme: dark)`).matches}function l(e=`auto`){return e===`dark`||e!==`light`&&c()}function u(e){if(typeof document>`u`)return()=>{};let t=new MutationObserver(e);t.observe(document.documentElement,{attributes:!0,attributeFilter:[`class`,`data-theme`,`style`]});let n=window.matchMedia(`(prefers-color-scheme: dark)`);return n.addEventListener(`change`,e),()=>{t.disconnect(),n.removeEventListener(`change`,e)}}function d(e){return e?`white`:`black`}var f=`
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,p=`
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform vec2 u_look;
uniform float u_blink;
uniform float u_mode;
uniform vec3 u_body;
uniform vec3 u_eye;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec3 orient(vec3 p, vec2 look) {
  float yaw = look.x * 0.92;
  float pitch = -look.y * 0.78;
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cp = cos(pitch);
  float sp = sin(pitch);
  vec3 q = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  return vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);
}

float eyeMask(vec3 n, vec3 e, vec3 right, vec3 up, float halfH, float rad) {
  float facing = dot(n, e);
  float x = dot(n, right) - dot(e, right);
  float y = dot(n, up) - dot(e, up);
  y -= clamp(y, -halfH, halfH);
  float d = length(vec2(x, y)) - rad;
  float fill = 1.0 - smoothstep(-0.01, 0.01, d);
  return fill * smoothstep(0.12, 0.32, facing);
}

vec3 wash(vec3 n, float t) {
  vec2 q = n.xy * 2.2 + n.z * 0.85;
  vec2 w1 = vec2(
    fbm(q * 1.4 + vec2(t * 0.22, t * 0.18)),
    fbm(q * 1.4 + vec2(-t * 0.16, t * 0.24) + 4.1)
  );
  q += (w1 - 0.5) * 0.72;
  float f = fbm(q * 2.1 + vec2(0.0, t * 0.12));
  float g = fbm(q * 4.6 - vec2(t * 0.2, 0.0));
  vec3 col = mix(u_c1, u_c2, smoothstep(0.28, 0.72, f));
  return mix(col, u_c3, pow(smoothstep(0.42, 0.9, g), 1.4));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float radius = 0.94;
  vec2 p = uv / radius;
  float r2 = dot(p, p);
  float edge = 1.0 - smoothstep(0.985, 1.012, sqrt(max(r2, 0.0)));
  if (edge <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = normalize(vec3(p, z));

  vec2 look = u_look;
  float lm = length(look);
  if (lm > 1.0) look /= lm;

  vec3 right = orient(vec3(1.0, 0.0, 0.0), look);
  vec3 up = orient(vec3(0.0, 1.0, 0.0), look);
  vec3 eL = orient(normalize(vec3(-0.32, 0.08, 1.0)), look);
  vec3 eR = orient(normalize(vec3(0.32, 0.08, 1.0)), look);

  float halfH = mix(0.128, 0.012, u_blink);
  float rad = mix(0.054, 0.062, u_blink);
  float eyes = max(
    eyeMask(n, eL, right, up, halfH, rad),
    eyeMask(n, eR, right, up, halfH, rad)
  );

  vec3 body = u_mode > 0.5 ? wash(n, u_time * u_speed) : u_body;
  vec3 col = mix(body, u_eye, clamp(eyes, 0.0, 1.0));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), edge);
}
`;function m(){return typeof process<`u`&&!1}function h(e){let t=e.replace(`#`,``).trim(),n=t.length===3?t.split(``).map(e=>e+e).join(``):t.padEnd(6,`0`).slice(0,6),r=Number.parseInt(n,16);return Number.isNaN(r)?[.96,.96,.96]:[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}function g(e,t,n){let r=e.createShader(t);return r?(e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(m()&&console.warn(`LiveOrb: shader failed to compile
`,e.getShaderInfoLog(r)),e.deleteShader(r),null)):null}function _(e,t,n,r,c=!1){let l=i.color,u=i.eyeColor,f=0,p=s,m=e??d(c);return m===`black`?(l=a.color,u=a.eyeColor):m===`webgl`?(p=r&&r.length>0?r:s,l=p[1]??s[1],u=`#0C0C10`,f=1):m===`custom`&&(l=t??o.color,u=n??o.eyeColor),{body:l,eye:u,mode:f,palette:p}}function v(e){return e.mode===1?{backgroundImage:`linear-gradient(135deg, ${e.palette[0]??s[0]}, ${e.palette[1]??s[1]}, ${e.palette[2]??s[2]})`}:{backgroundColor:e.body}}var y=3e3,b={x:0,y:.08};function x(e,t={}){let n={interactive:!0,blink:!0,...t},r=l(n.theme),i={x:0,y:.08},a={x:0,y:.08},o={x:0,y:.08},c=e.getContext(`webgl`,{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,powerPreference:`high-performance`});if(!c)return null;let d=null,v=null,x=null,S=null,C=null,w=null,T=null,E=null,D=null,O=null,k=null,A=null,j=null,M=null,N=null,P=()=>{if(d=g(c,c.VERTEX_SHADER,f),v=g(c,c.FRAGMENT_SHADER,p),!d||!v)return!1;let t=c.createProgram();if(!t)return!1;if(x=t,c.attachShader(t,d),c.attachShader(t,v),c.linkProgram(t),!c.getProgramParameter(t,c.LINK_STATUS))return m()&&console.warn(`LiveOrb: program failed to link
`,c.getProgramInfoLog(t)),!1;c.useProgram(t),S=c.createBuffer(),c.bindBuffer(c.ARRAY_BUFFER,S),c.bufferData(c.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),c.STATIC_DRAW);let n=c.getAttribLocation(t,`a_position`);return c.enableVertexAttribArray(n),c.vertexAttribPointer(n,2,c.FLOAT,!1,0,0),C=c.getUniformLocation(t,`u_resolution`),w=c.getUniformLocation(t,`u_time`),T=c.getUniformLocation(t,`u_speed`),E=c.getUniformLocation(t,`u_look`),D=c.getUniformLocation(t,`u_blink`),O=c.getUniformLocation(t,`u_mode`),k=c.getUniformLocation(t,`u_body`),A=c.getUniformLocation(t,`u_eye`),j=c.getUniformLocation(t,`u_c1`),M=c.getUniformLocation(t,`u_c2`),N=c.getUniformLocation(t,`u_c3`),c.enable(c.BLEND),c.blendFunc(c.SRC_ALPHA,c.ONE_MINUS_SRC_ALPHA),c.viewport(0,0,e.width,e.height),!0};if(!P())return null;n.onHasGl?.(!0);let F=0,I=!1,L=!1,R=!0,z=0,B=0,V=1800+Math.random()*2400,H=-1e4,U=600+Math.random()*900,W=-1/0,G=()=>{let t=e.parentElement;if(!t)return!1;let n=Math.min(window.devicePixelRatio||1,2),r=t.clientWidth,i=t.clientHeight;if(r<=0||i<=0)return!1;let a=Math.max(1,Math.floor(r*n)),o=Math.max(1,Math.floor(i*n));return e.style.width=`${r}px`,e.style.height=`${i}px`,a===e.width&&o===e.height?!1:(e.width=a,e.height=o,c.viewport(0,0,e.width,e.height),!0)},K=window.matchMedia(`(prefers-reduced-motion: reduce)`),ee=()=>R&&!K.matches&&document.visibilityState!==`hidden`;function q(){F||I||L||(z=performance.now(),F=requestAnimationFrame(Y))}function te(){I||L||(cancelAnimationFrame(F),F=0,z=performance.now(),Y(z))}let J=t=>{if(!n.interactive)return;let r=e.parentElement;if(!r)return;let i=r.getBoundingClientRect();if(i.width<=0||i.height<=0)return;let o=(t.clientX-(i.left+i.width/2))/(i.width/2),s=(i.top+i.height/2-t.clientY)/(i.height/2);a.x=Math.min(1,Math.max(-1,o)),a.y=Math.min(1,Math.max(-1,s)),W=performance.now(),R&&q()};window.addEventListener(`pointermove`,J,{passive:!0});let Y=t=>{if(F=0,L)return;let l=Math.min(50,Math.max(0,t-z));z=t;let u=ee();u&&(B+=l);let d=K.matches,f=_(n.variant,n.color,n.eyeColor,n.colors,r),p=B/1e3,m=n.interactive&&t-W<y;if(!m&&u&&B>=U){let e=Math.random()<.3;o.x=e?0:(Math.random()*2-1)*.8,o.y=e?.08:(Math.random()*2-1)*.5,U=B+900+Math.random()*2100}let g=m?a:d?b:o,v=u?m?.16:.1:1;i.x+=(g.x-i.x)*v,i.y+=(g.y-i.y)*v,!d&&n.blink&&B>=V&&(H=B,V=B+2200+Math.random()*3800);let x=(B-H)/1e3,S=0;!d&&n.blink&&(x<.055?S=x/.055:x<.1?S=1:x<.18&&(S=1-(x-.1)/.08));let P=h(f.body),R=h(f.eye),G=[0,1,2].map(e=>h(f.palette[e%f.palette.length]??s[e]));c.clearColor(0,0,0,0),c.clear(c.COLOR_BUFFER_BIT),c.uniform2f(C,e.width,e.height),c.uniform1f(w,d?0:p),c.uniform1f(T,d?0:.55),c.uniform2f(E,i.x,i.y),c.uniform1f(D,S),c.uniform1f(O,f.mode),c.uniform3f(k,P[0],P[1],P[2]),c.uniform3f(A,R[0],R[1],R[2]),c.uniform3f(j,G[0][0],G[0][1],G[0][2]),c.uniform3f(M,G[1][0],G[1][1],G[1][2]),c.uniform3f(N,G[2][0],G[2][1],G[2][2]),c.drawArrays(c.TRIANGLES,0,6),u&&!I&&(F=requestAnimationFrame(Y))},X=new ResizeObserver(()=>{G()&&te()});e.parentElement&&X.observe(e.parentElement);let Z=new IntersectionObserver(([e])=>{R=e?.isIntersecting??!0,q()});Z.observe(e);let Q=()=>q();document.addEventListener(`visibilitychange`,Q);let $=()=>q();K.addEventListener(`change`,$);let ne=u(()=>{let e=l(n.theme);e!==r&&(r=e,q())}),re=t=>{t.preventDefault(),L=!0,cancelAnimationFrame(F),F=0,e.style.visibility=`hidden`,n.onHasGl?.(!1)},ie=()=>{I||P()&&(L=!1,e.style.visibility=``,n.onHasGl?.(!0),q())};return e.addEventListener(`webglcontextlost`,re),e.addEventListener(`webglcontextrestored`,ie),G(),q(),{setOptions(e){n={...n,...e},r=l(n.theme),q()},destroy(){I=!0,cancelAnimationFrame(F),F=0,X.disconnect(),Z.disconnect(),document.removeEventListener(`visibilitychange`,Q),K.removeEventListener(`change`,$),ne(),window.removeEventListener(`pointermove`,J),e.removeEventListener(`webglcontextlost`,re),e.removeEventListener(`webglcontextrestored`,ie),L&&(e.style.visibility=``),n.onHasGl?.(!1),c.deleteProgram(x),c.deleteShader(d),c.deleteShader(v),c.deleteBuffer(S);let t=c.getExtension(`WEBGL_lose_context`);queueMicrotask(()=>{!e.isConnected&&!c.isContextLost()&&t?.loseContext()})}}}function S({className:e,size:t=280,variant:i,color:a,eyeColor:o,colors:s,interactive:c=!0,blink:d=!0,theme:f=`auto`}){let p=(0,n.useRef)(null),m=(0,n.useRef)(null),[h,g]=(0,n.useState)(!1),[y,b]=(0,n.useState)(!1);(0,n.useEffect)(()=>{let e=()=>b(l(f));return e(),u(e)},[f]),(0,n.useEffect)(()=>{let e=p.current;if(e)return m.current=x(e,{variant:i,color:a,eyeColor:o,colors:s,interactive:c,blink:d,theme:f,onHasGl:g}),()=>{m.current?.destroy(),m.current=null}},[]),(0,n.useEffect)(()=>{m.current?.setOptions({variant:i,color:a,eyeColor:o,colors:s,interactive:c,blink:d,theme:f,onHasGl:g})},[i,a,o,s,c,d,f]);let S=_(i,a,o,s,y);return(0,r.jsxs)(`div`,{"data-slot":`live-orb`,role:`img`,"aria-label":`Orb character`,className:[`live-orb-root`,e].filter(Boolean).join(` `),style:{width:t,height:t,position:`relative`,flexShrink:0},children:[h?null:(0,r.jsxs)(`div`,{"aria-hidden":!0,style:{position:`absolute`,inset:`2%`,overflow:`hidden`,borderRadius:`9999px`,...v(S)},children:[(0,r.jsx)(`span`,{style:{position:`absolute`,borderRadius:`9999px`,backgroundColor:S.eye,width:`13%`,height:`28%`,left:`31%`,top:`34%`}}),(0,r.jsx)(`span`,{style:{position:`absolute`,borderRadius:`9999px`,backgroundColor:S.eye,width:`13%`,height:`28%`,left:`56%`,top:`34%`}})]}),(0,r.jsx)(`canvas`,{ref:p,style:{position:`absolute`,inset:0,width:`100%`,height:`100%`}})]})}var C=[`Carga tu video en /app. Frameo lo procesa local en tu navegador: nada se sube.`,`Elige PNG para máxima calidad o JPG para menor peso.`,`Los frames salen ordenados como frame_00001.png para que no se desordenen.`,`Al terminar descargas un ZIP. Todo pasa en tu dispositivo.`];function w(){let[e,t]=(0,n.useState)(!1),[i,a]=(0,n.useState)(0);return(0,r.jsxs)(`div`,{style:{position:`fixed`,right:20,bottom:20,zIndex:140,display:`flex`,flexDirection:`column`,alignItems:`flex-end`,gap:12},children:[(0,r.jsxs)(`div`,{style:{width:`min(320px, calc(100vw - 32px))`,padding:`16px 16px 14px`,borderRadius:18,background:`rgba(10,14,18,.88)`,border:`1px solid rgba(255,255,255,.1)`,backdropFilter:`blur(18px)`,boxShadow:`0 20px 50px rgba(0,0,0,.35)`,opacity:+!!e,transform:e?`translateY(0) scale(1)`:`translateY(10px) scale(.98)`,pointerEvents:e?`auto`:`none`,transition:`opacity .25s ease, transform .25s ease`},children:[(0,r.jsx)(`p`,{style:{margin:`0 0 6px`,fontSize:11,fontWeight:700,letterSpacing:`.1em`,textTransform:`uppercase`,color:`#bffcef`},children:`Guía Frameo`}),(0,r.jsx)(`p`,{style:{margin:0,fontSize:14,lineHeight:1.55,color:`rgba(255,255,255,.86)`},children:C[i]}),(0,r.jsxs)(`div`,{style:{display:`flex`,gap:14,marginTop:12},children:[(0,r.jsx)(`a`,{href:`/app`,style:{fontSize:12,fontWeight:600,color:`#C6FF3D`,textDecoration:`none`},children:`Ir a /app`}),(0,r.jsx)(`button`,{type:`button`,onClick:()=>a(e=>(e+1)%C.length),style:{fontSize:12,fontWeight:600,color:`#00F5D4`,background:`none`,border:0,padding:0,cursor:`pointer`},children:`Otro tip`})]})]}),(0,r.jsx)(`button`,{type:`button`,onClick:()=>t(e=>!e),"aria-label":`Abrir guía Frameo`,"aria-expanded":e,style:{background:`none`,border:0,padding:0,cursor:`pointer`,filter:`drop-shadow(0 12px 30px rgba(0,245,212,.22))`},children:(0,r.jsx)(S,{size:88,variant:`webgl`,colors:[`#00F5D4`,`#C6FF3D`,`#7CFFE8`],interactive:!0,blink:!0})})]})}export{w as default};