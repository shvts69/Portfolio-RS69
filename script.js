/* =============================================================
   ROSS PORTFOLIO — LIVING COSMOS v6
   Volumetric WebGL nebula + storm galaxies + black-hole cursor
   ============================================================= */

(function rs69Signal(){
  const t = 'font:18px Orbitron,monospace;color:#a78bfa;text-shadow:0 0 8px #7c3aed';
  const s = 'font:11px monospace;color:#60a5fa';
  console.log('%cRS69 — ROGUE SIGNAL', t);
  console.log('%cVanilla JS · WebGL shaders · Canvas 2D · zero frameworks.\nCurious devs welcome — say hi: shvts69@gmail.com', s);
})();

const IS_MOBILE = innerWidth <= 768 || (matchMedia && matchMedia('(pointer: coarse)').matches);
// Weak hardware detection — covers Windows laptops with slow CPUs / low RAM that
// don't trip the mobile check but still choke on full-fat particle counts.
const HW_CORES = navigator.hardwareConcurrency || 0;
const HW_MEM = navigator.deviceMemory || 0; // Chrome-only, returns 0 elsewhere
const IS_LOW_END = (HW_CORES > 0 && HW_CORES <= 4) || (HW_MEM > 0 && HW_MEM <= 4);
const IS_LOW_POWER = IS_MOBILE || IS_LOW_END;

/* ===== 1. WEBGL HELIX NEBULA (Eye of God) ===== */
(function initNebula() {
  const canvas = document.getElementById('nebula-canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  // Downsample on mobile — fragment shader is heavy
  const PIX_SCALE = IS_LOW_POWER ? 0.55 : 1;

  function resize() {
    canvas.width = Math.round(innerWidth * PIX_SCALE);
    canvas.height = Math.round(innerHeight * PIX_SCALE);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize(); addEventListener('resize', resize);

  const vSrc = `attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;

  const NEB_SCALE = IS_LOW_POWER ? 2.2 : 1.0;
  const MOTION_MUL = IS_LOW_POWER ? 1.0 : 1.8;

  const fSrc = `
  precision highp float;
  uniform float u_t;
  uniform vec2 u_r;
  #define NEB_SCALE ${NEB_SCALE.toFixed(3)}
  #define MOTION_MUL ${MOTION_MUL.toFixed(3)}

  // --- noise toolkit ---
  float hash(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p+19.19);return fract(p.x*p.y);}
  float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){
    float v=0.0,a=0.5;mat2 m=mat2(0.8,0.6,-0.6,0.8);
    for(int i=0;i<7;i++){v+=a*noise(p);p=m*p*2.0;a*=0.5;}return v;
  }
  float fbm4(vec2 p){
    float v=0.0,a=0.5;mat2 m=mat2(0.8,0.6,-0.6,0.8);
    for(int i=0;i<4;i++){v+=a*noise(p);p=m*p*2.0;a*=0.5;}return v;
  }

  void main(){
    vec2 uv=gl_FragCoord.xy/u_r;
    float aspect=u_r.x/u_r.y;
    vec2 uvA=vec2((uv.x-0.5)*aspect,uv.y-0.5); // centered coords
    uvA *= NEB_SCALE; // mobile: zoom out so nebula shrinks to galaxy-canvas size
    float t=u_t*0.038*MOTION_MUL; // desktop: speed up nebula wobble

    // === Eye center — dramatic drift ===
    vec2 center=vec2(0.06+0.06*sin(t*0.4)+0.025*cos(t*0.75)+0.015*sin(t*1.1),-0.08+0.04*cos(t*0.3)+0.018*sin(t*0.6)+0.01*cos(t*0.95));
    vec2 p=uvA-center;

    // heavy breathing tilt — the eye rocks dramatically
    float tilt=0.38*sin(t*0.22)+0.18*cos(t*0.37)+0.08*sin(t*0.6);
    float cs=cos(tilt),sn=sin(tilt);
    p=vec2(p.x*cs-p.y*sn,p.x*sn+p.y*cs);
    float squeeze=1.15+0.12*sin(t*0.26)+0.05*cos(t*0.45); // deep breathing
    p.y*=squeeze;

    float dist=length(p);
    float ang=atan(p.y,p.x);

    // === RING GEOMETRY ===
    // The ring radius with organic wobble
    float ringR=0.18+0.035*sin(ang*3.0+t*1.8)+0.025*cos(ang*5.0-t*2.2)+0.018*sin(ang*7.0+t*1.3)+0.01*cos(ang*11.0-t*0.7);
    ringR+=fbm4(vec2(ang*1.5,t*1.2))*0.065; // heavy organic edge

    float ringDist=abs(dist-ringR); // distance from ring centerline
    float ringWidth=0.11+0.045*sin(ang*2.0+t*1.5)+0.025*cos(ang*4.0-t*1.1)+0.015*sin(ang*6.0+t*0.6); // dramatic pulsing

    // === RING MASK — bright inner ring ===
    float ringMask=smoothstep(ringWidth,ringWidth*0.15,ringDist);
    // outer ring glow — wider, dimmer
    float outerGlow=smoothstep(ringWidth*3.0,ringWidth*0.5,ringDist)*0.4;
    // inner edge is sharper than outer
    float innerEdge=smoothstep(ringR-ringWidth*0.3,ringR,dist);
    float outerEdge=smoothstep(ringR+ringWidth*2.5,ringR,dist);

    // === FILAMENT DETAIL — fine radial tendrils like the real Helix ===
    vec2 warpP=vec2(ang*3.0+t*0.8,dist*8.0);
    float filament1=fbm(warpP*2.5+t*1.1);
    float filament2=fbm(warpP*4.0-t*0.8+vec2(3.7,1.2));
    float filFine=pow(abs(filament1-0.5)*2.0,0.4);
    float filCoarse=pow(abs(filament2-0.5)*2.0,0.28);

    // radial streaks emanating from ring — like the Helix tendrils
    float radialNoise=fbm(vec2(ang*6.0,dist*3.0)+t*0.55);
    float tendrils=pow(abs(radialNoise-0.5)*2.0,0.2)*smoothstep(0.6,0.15,ringDist);

    // === DOMAIN WARPING — dramatic sweeping currents ===
    vec2 q=vec2(fbm(uvA*3.0+t*1.2),fbm(uvA*3.0+vec2(5.2,1.3)+t*1.05));
    vec2 r2=vec2(fbm(uvA*4.0+q+t*0.85),fbm(uvA*4.0+q+vec2(1.7,9.2)+t*0.9));
    float warp=fbm(uvA*5.0+r2*3.0);

    // === COLOR — Helix Nebula palette ===
    vec3 col=vec3(0);

    // 1. INNER RING — golden/orange hot core
    vec3 gold=vec3(1.0,0.7,0.15);
    vec3 hotOrange=vec3(1.0,0.45,0.05);
    vec3 white=vec3(1.0,0.95,0.85);
    // vary color around the ring
    float ringZone=ang+t*0.15;
    vec3 ringCol=mix(gold,hotOrange,0.5+0.5*sin(ringZone*1.5));
    ringCol=mix(ringCol,white,filFine*0.3); // bright filaments are whiter
    // brightest at the inner edge of the ring
    float ringBrightness=ringMask*(0.4+0.6*filCoarse)*(0.7+0.3*filFine);
    ringBrightness+=ringMask*tendrils*0.4;
    col+=ringCol*ringBrightness*0.8;

    // 2. OUTER HALO — deep crimson red wisps
    vec3 deepRed=vec3(0.6,0.08,0.02);
    vec3 darkCrimson=vec3(0.35,0.04,0.01);
    float haloMask=smoothstep(0.62,0.18,dist)*smoothstep(0.0,0.1,dist);
    haloMask*=(1.0-ringMask*0.8); // don't cover the ring
    float haloDetail=fbm(uvA*6.0+q*1.5+t*0.2);
    vec3 haloCol=mix(darkCrimson,deepRed,haloDetail);
    haloCol=mix(haloCol,hotOrange*0.3,outerGlow); // orange tint near ring
    col+=haloCol*haloMask*(0.2+0.5*haloDetail)*0.45;

    // 3. RED TENDRILS — wispy outer filaments
    float outerTendrils=fbm(vec2(ang*4.0,dist*6.0)+t*0.5);
    float tendrilMask=smoothstep(0.62,0.14,dist)*smoothstep(0.03,0.1,dist);
    tendrilMask*=pow(abs(outerTendrils-0.5)*2.0,0.3)*0.6;
    col+=vec3(0.7,0.1,0.04)*tendrilMask;

    // 4. DARK CENTER — the eye's dark blue pupil
    float centerDark=smoothstep(ringR-ringWidth*0.5,ringR-ringWidth*1.5,dist);
    // slight blue tint in the center (like the real Helix center)
    vec3 centerCol=vec3(0.02,0.04,0.12);
    col=mix(col,centerCol,centerDark*0.7);

    // 5. BRIGHT KNOTS along the ring — clumpy detail
    float knots=pow(fbm(vec2(ang*8.0,dist*12.0)+t*0.65),1.5);
    col+=vec3(1.0,0.8,0.3)*knots*ringMask*0.45;

    // 6. outer glow — reddish, expansive
    float farGlow=smoothstep(0.75,0.12,dist)*0.08;
    col+=vec3(0.35,0.04,0.015)*farGlow;

    // final output — keep as overlay (mix-blend-mode: screen in CSS)
    col=clamp(col,0.0,1.0);
    gl_FragColor=vec4(col,1.0);
  }
  `;

  function compile(type,src){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));}
    return s;
  }
  const prog=gl.createProgram();
  gl.attachShader(prog,compile(gl.VERTEX_SHADER,vSrc));
  gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fSrc));
  gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(prog,'a');
  gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const uT=gl.getUniformLocation(prog,'u_t'),uR=gl.getUniformLocation(prog,'u_r');

  function draw(t){
    gl.uniform1f(uT,t*0.001);gl.uniform2f(uR,canvas.width,canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    // Mobile: 20fps on nebula — it's ambient, no one notices
    setTimeout(()=>requestAnimationFrame(draw),IS_LOW_POWER?50:16);
  }
  requestAnimationFrame(draw);
})();


/* ===== 2. STARS + BLACK HOLE CURSOR + SPARKLE TRAIL ===== */
(function initStars(){
  const c=document.getElementById('stars-canvas');
  const ctx=c.getContext('2d');
  let stars=[];const N=IS_LOW_POWER?180:1100;
  const PAL=[[255,255,255],[167,139,250],[96,165,250],[251,191,146],[196,181,253]];
  let mx=-999,my=-999,pmx=-999,pmy=-999,mouseStill=0;
  const PUSH_R=80,PUSH_F=1.8;
  // Mobile: longer hold required before BH forms — prevents accidental triggers while scrolling/reading
  const VORTEX_R=200,VORTEX_F=0.45,VORTEX_TH=IS_LOW_POWER?30:25;
  const sparkles=[];const MAX_SP=IS_LOW_POWER?0:50;let spT=0;

  // Track if cursor is over a galaxy CANVAS (not the text area)
  let overGalaxy=false;
  document.querySelectorAll('.galaxy__orbit').forEach(g=>{
    g.addEventListener('mouseenter',()=>{overGalaxy=true;});
    g.addEventListener('mouseleave',()=>{overGalaxy=false;});
  });

  document.addEventListener('mousemove',(e)=>{pmx=mx;pmy=my;mx=e.clientX;my=e.clientY;mouseStill=0;});
  document.addEventListener('mouseleave',()=>{mx=-999;my=-999;mouseStill=0;});
  // Touch support (mobile): hold finger = BH forms; release = BH dies, stars return
  document.addEventListener('touchstart',(e)=>{const t=e.touches[0];if(t){pmx=mx;pmy=my;mx=t.clientX;my=t.clientY;mouseStill=0;}},{passive:true});
  document.addEventListener('touchmove',(e)=>{const t=e.touches[0];if(t){pmx=mx;pmy=my;mx=t.clientX;my=t.clientY;mouseStill=0;}},{passive:true});
  document.addEventListener('touchend',()=>{mx=-999;my=-999;mouseStill=0;},{passive:true});
  document.addEventListener('touchcancel',()=>{mx=-999;my=-999;mouseStill=0;},{passive:true});
  function resize(){c.width=innerWidth;c.height=innerHeight;build();}
  function build(){
    stars=[];
    for(let i=0;i<N;i++){
      const cl=PAL[Math.random()*PAL.length|0];
      const x=Math.random()*c.width,y=Math.random()*c.height;
      stars.push({x,y,homeX:x,homeY:y,vx:0,vy:0,r:Math.random()*1.4+0.2,cl,
        a:Math.random()*0.7+0.3,sp:Math.random()*0.012+0.002,d:Math.random()>0.5?1:-1});
    }
  }
  function addSp(){
    if(mx<0||pmx<0)return;const speed=Math.hypot(mx-pmx,my-pmy);if(speed<3)return;
    const cnt=Math.min(Math.floor(speed*0.25),4);
    for(let i=0;i<cnt;i++){
      if(sparkles.length>=MAX_SP)sparkles.shift();
      const ang=Math.random()*Math.PI*2,spd=0.3+Math.random()*1.2;
      sparkles.push({x:mx+(Math.random()-0.5)*8,y:my+(Math.random()-0.5)*8,
        vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,r:0.4+Math.random()*1.3,
        life:1,decay:0.018+Math.random()*0.025,cl:PAL[Math.random()*PAL.length|0]});
    }
  }

  // ===== BLACK HOLE — event horizon + swirling star belt + star contour =====
  const BELT_TILT=0.17;
  const BELT_IN_M=1.08, BELT_OUT_M=3.0;
  const BELT_LIFT=0.10; // fraction of R_EH to shift belt up, so its upper rim meets contour
  const BH_STATE={phase:0};
  const TAU=Math.PI*2;

  // Accretion disk — front half tilts below horizontal; back half is gravitationally
  // lensed UP, forming an arch that wraps over the event horizon (Interstellar look).
  function drawStarBelt(cx,cy,R_EH,sz,phase){
    const BELT_IN=R_EH*BELT_IN_M;
    const BELT_SPAN=R_EH*(BELT_OUT_M-BELT_IN_M);
    const lift=R_EH*BELT_LIFT;
    const N=IS_LOW_POWER?260:2800;
    const p5=phase*5;
    for(let i=0;i<N;i++){
      const s1=(i*0.6180339887)%1;
      const s2=(i*0.7548776662)%1;
      const s3=(i*0.1270170)%1;
      const rT=Math.pow(s1,0.7);
      const orbR=BELT_IN+BELT_SPAN*rT;
      const rotSpd=1.0-rT*0.35;
      const ang=s2*TAU+phase*rotSpd;
      const sn=Math.sin(ang);
      const cs=Math.cos(ang);
      let x,y;
      if(sn>=0){
        // Front half — gentle tilt under the BH silhouette
        x=cx+cs*orbR;
        y=cy+sn*orbR*BELT_TILT;
      } else {
        // Back half — lensed into a narrow arch hugging the BH's waist from above.
        // sideSqueeze blends continuously from 1 (no squeeze) at sides to 0.78 at top,
        // removing the x-jump where arch meets belt.
        const topAmt=-sn;
        const sideSqueeze=1-0.22*Math.pow(topAmt,0.5);
        x=cx+cs*orbR*sideSqueeze;
        const archK=0.98+0.30*rT;
        const archY=cy-R_EH*Math.pow(topAmt,1.1)*archK;
        // near sides continue the belt's tilt upward so the arch rolls smoothly out of the belt
        const tiltY=cy+sn*orbR*BELT_TILT;
        const w=Math.pow(topAmt,0.5);
        y=archY*w+tiltY*(1-w);
      }
      y-=lift;
      const tw=0.65+0.35*Math.sin(p5+s3*11);
      // Back-half stars slightly brighter — that's the Doppler-boosted side in the reference
      const brightBoost=sn<0?1.15:1.0;
      const a=(0.55+0.35*(1-rT))*tw*sz*brightBoost;
      const rad=0.34+0.44*(1-rT)+s3*0.42;
      const tint=s3<0.25?[255,225,185]:s3<0.6?[255,240,215]:[255,250,245];
      ctx.fillStyle=`rgba(${tint[0]},${tint[1]},${tint[2]},${a})`;
      ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();
      if(!IS_LOW_POWER && rad>0.75){
        ctx.fillStyle=`rgba(${tint[0]},${tint[1]},${tint[2]},${a*0.26})`;
        ctx.beginPath();ctx.arc(x,y,rad*2.1,0,TAU);ctx.fill();
      }
    }
  }

  // Photon shell — very thick on top, thin on bottom, flares out at sides to meet the belt.
  function drawStarContour(cx,cy,R_EH,sz,phase){
    const N=IS_LOW_POWER?100:780;
    const p7=phase*7;
    for(let i=0;i<N;i++){
      const s1=(i*0.6180339887)%1;
      const s2=(i*0.7548776662)%1;
      const s3=(i*0.1270170)%1;
      const ang=s1*TAU+phase;
      const sn=Math.sin(ang),cs=Math.cos(ang);
      // smooth weights — Math.abs kinks at sn=0 create visible corners at the sides;
      // pow(topF,0.8) rounds the top rise and |cs| is a smooth bell instead of triangle
      const topF=Math.pow(Math.max(0,-sn),0.8);
      const sideF=Math.abs(cs);
      const botF=Math.pow(Math.max(0,sn),1.2);
      // drop density on bottom half
      if(botF>0.12 && s3<botF*0.58)continue;
      const innerM=1.03;
      const outerM=1.10+topF*0.52+sideF*0.15;
      const rM=innerM+s2*(outerM-innerM);
      const r=R_EH*rM;
      const x=cx+cs*r;
      const y=cy+sn*r;
      const tw=0.7+0.3*Math.sin(p7+s3*9);
      const bright=0.32+topF*0.75+sideF*0.32;
      const a=bright*tw*sz;
      const rad=0.45+s3*0.55+topF*0.35;
      ctx.fillStyle=`rgba(255,248,230,${a})`;
      ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();
      if(!IS_LOW_POWER && rad>0.8){
        ctx.fillStyle=`rgba(255,215,160,${a*0.45})`;
        ctx.beginPath();ctx.arc(x,y,rad*2.6,0,TAU);ctx.fill();
      }
    }
  }

  function drawBlackHole(vStr,phase){
    if(vStr<0.05)return;
    const cx=mx,cy=my,sz=vStr;
    const R_EH=28*sz;

    ctx.save();

    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000';
    ctx.beginPath();ctx.arc(cx,cy,R_EH,0,TAU);ctx.fill();
    const ehE=ctx.createRadialGradient(cx,cy,R_EH*0.95,cx,cy,R_EH*1.14);
    ehE.addColorStop(0,'rgba(0,0,0,1)');
    ehE.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ehE;
    ctx.beginPath();ctx.arc(cx,cy,R_EH*1.14,0,TAU);ctx.fill();

    ctx.globalCompositeOperation='lighter';
    drawStarContour(cx,cy,R_EH,sz,phase);

    drawStarBelt(cx,cy,R_EH,sz,phase);

    ctx.restore();
  }

  // === SHOOTING STARS — realistic meteors ===
  const shooters=[];
  let shootNext=IS_LOW_POWER?(300+Math.random()*500):(50+Math.random()*140); // frames until next shooting star
  let shootFrame=0;

  function spawnShooter(){
    // random angle — mostly diagonal, slight variation
    const baseAng=-0.6-Math.random()*0.5; // ~30-60 degrees downward
    const speed=8+Math.random()*12; // fast!
    const startX=Math.random()*c.width*1.2-c.width*0.1;
    const startY=-10-Math.random()*100; // start above screen
    const maxLife=30+Math.random()*40;
    shooters.push({
      x:startX,y:startY,
      vx:Math.cos(baseAng)*speed,vy:-Math.sin(baseAng)*speed,
      life:1,maxLife,age:0,
      len:40+Math.random()*80, // tail length
      brightness:0.6+Math.random()*0.4,
      width:0.8+Math.random()*1.5,
      // color: white-blue core
      r:200+Math.random()*55,g:210+Math.random()*45,b:255,
    });
  }

  function drawShooters(){
    for(let i=shooters.length-1;i>=0;i--){
      const s=shooters[i];
      s.x+=s.vx;s.y+=s.vy;s.age++;
      // fade in quickly, stay, then fade out
      if(s.age<5)s.life=s.age/5;
      else if(s.age>s.maxLife-10)s.life=Math.max(0,(s.maxLife-s.age)/10);
      else s.life=1;
      if(s.age>=s.maxLife||s.y>c.height+50||s.x>c.width+50){
        shooters.splice(i,1);continue;
      }
      const dir=Math.hypot(s.vx,s.vy);
      const nx=s.vx/dir,ny=s.vy/dir;
      const a=s.life*s.brightness;

      // outer diffuse trail — wide, faint
      const outerTailX=s.x-nx*s.len*1.15;
      const outerTailY=s.y-ny*s.len*1.15;
      const outerGrad=ctx.createLinearGradient(s.x,s.y,outerTailX,outerTailY);
      outerGrad.addColorStop(0,`rgba(${s.r|0},${s.g|0},${s.b|0},${a*0.15})`);
      outerGrad.addColorStop(0.4,`rgba(${s.r|0},${s.g|0},${s.b|0},${a*0.06})`);
      outerGrad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.strokeStyle=outerGrad;
      ctx.lineWidth=s.width*4;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(outerTailX,outerTailY);ctx.stroke();

      // main tail — core gradient
      const tailX=s.x-nx*s.len;
      const tailY=s.y-ny*s.len;
      const grad=ctx.createLinearGradient(s.x,s.y,tailX,tailY);
      grad.addColorStop(0,`rgba(255,255,255,${a})`);
      grad.addColorStop(0.08,`rgba(${s.r|0},${s.g|0},${s.b|0},${a*0.85})`);
      grad.addColorStop(0.3,`rgba(${s.r|0},${s.g|0},${s.b|0},${a*0.35})`);
      grad.addColorStop(0.6,`rgba(${s.r|0},${(s.g*0.6)|0},${(s.b*0.7)|0},${a*0.12})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.strokeStyle=grad;
      ctx.lineWidth=s.width;
      ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(tailX,tailY);ctx.stroke();

      // inner bright core line — thin white
      const coreLen=s.len*0.4;
      ctx.strokeStyle=`rgba(255,255,255,${a*0.7})`;
      ctx.lineWidth=s.width*0.4;
      ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-nx*coreLen,s.y-ny*coreLen);ctx.stroke();

      // bright head glow — layered
      ctx.globalCompositeOperation='lighter';
      ctx.beginPath();ctx.arc(s.x,s.y,s.width*3.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(${s.r|0},${s.g|0},${s.b|0},${a*0.12})`;ctx.fill();
      ctx.beginPath();ctx.arc(s.x,s.y,s.width*1.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${a*0.4})`;ctx.fill();
      ctx.globalCompositeOperation='source-over';
    }
  }

  function draw(){
    ctx.clearRect(0,0,c.width,c.height);mouseStill++;spT++;
    if(spT%2===0)addSp();
    const isV=mouseStill>VORTEX_TH&&mx>0&&!overGalaxy;
    const vStr=isV?Math.min((mouseStill-VORTEX_TH)/(IS_LOW_POWER?16:40),1):0;
    window.__bh={active:isV,str:vStr,mx,my};

    // Advance BH rotation phase once per frame — used by belt, contour, captured stars.
    if(isV&&vStr>=0.05){BH_STATE.phase+=IS_LOW_POWER?0.085:0.028;}
    const phase=BH_STATE.phase;

    // cursor glow (when not black hole)
    if(mx>0&&vStr<0.3){
      const gA=0.05*(1-vStr*3);
      const glow=ctx.createRadialGradient(mx,my,0,mx,my,70);
      glow.addColorStop(0,'rgba(167,139,250,'+gA+')');
      glow.addColorStop(0.5,'rgba(96,165,250,'+(gA*0.4)+')');
      glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;
      ctx.beginPath();ctx.arc(mx,my,70,0,Math.PI*2);ctx.fill();
    }

    for(const s of stars){
      s.a+=s.sp*s.d;if(s.a>=1){s.a=1;s.d=-1;}else if(s.a<=0.1){s.a=0.1;s.d=1;}

      if(mx>0){
        const dx=s.x-mx,dy=s.y-my,dist=Math.hypot(dx,dy);
        if(!isV&&dist<PUSH_R&&dist>0){
          const f=(1-dist/PUSH_R)*PUSH_F;
          s.vx+=(dx/dist)*f;s.vy+=(dy/dist)*f;
        }
        if(isV&&dist<VORTEX_R&&dist>3){
          const tx=-dy/dist,ty=dx/dist;
          const falloff=Math.pow(1-dist/VORTEX_R,1.5);
          const tangF=VORTEX_F*vStr*falloff;
          const pullF=VORTEX_F*0.5*vStr*falloff;
          s.vx+=tx*tangF-(dx/dist)*pullF;
          s.vy+=ty*tangF-(dy/dist)*pullF;
          if(dist<60*vStr){s.a=Math.min(s.a+0.08*vStr,1);}
        }
      }
      const homeF=isV?0.001:0.006;
      s.vx+=(s.homeX-s.x)*homeF;s.vy+=(s.homeY-s.y)*homeF;
      s.vx*=0.95;s.vy*=0.95;s.x+=s.vx;s.y+=s.vy;

      // Hide stars that would fall behind the event horizon shadow
      const rx=s.x, ry=s.y;
      if(isV){
        const dxL=s.x-mx, dyL=s.y-my;
        if(dxL*dxL+dyL*dyL<=(28*vStr)*(28*vStr)){continue;}
      }

      // near black hole: draw as streak instead of dot
      if(isV){
        const dxB=rx-mx,dyB=ry-my,toBH2=dxB*dxB+dyB*dyB;
        if(toBH2<(120*vStr)*(120*vStr)&&toBH2>9){
          const speed=Math.hypot(s.vx,s.vy);
          const streakLen=Math.min(speed*4,16)*vStr;
          if(streakLen>1){
            const ndx=s.vx/(speed||1),ndy=s.vy/(speed||1);
            ctx.strokeStyle=`rgba(${s.cl[0]},${s.cl[1]},${s.cl[2]},${s.a})`;
            ctx.lineWidth=s.r*0.8;
            ctx.beginPath();ctx.moveTo(rx-ndx*streakLen,ry-ndy*streakLen);ctx.lineTo(rx,ry);ctx.stroke();
            continue;
          }
        }
      }
      ctx.beginPath();ctx.arc(rx,ry,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${s.cl[0]},${s.cl[1]},${s.cl[2]},${s.a})`;ctx.fill();
      if(s.r>1){ctx.beginPath();ctx.arc(rx,ry,s.r*2.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(${s.cl[0]},${s.cl[1]},${s.cl[2]},${s.a*0.1})`;ctx.fill();}
    }

    drawBlackHole(vStr,phase);

    // sparkles
    ctx.globalCompositeOperation='lighter';
    for(let i=sparkles.length-1;i>=0;i--){
      const sp=sparkles[i];sp.x+=sp.vx;sp.y+=sp.vy;sp.vx*=0.96;sp.vy*=0.96;sp.life-=sp.decay;
      if(sp.life<=0){sparkles.splice(i,1);continue;}
      const a=sp.life*0.7;
      ctx.beginPath();ctx.arc(sp.x,sp.y,sp.r*sp.life,0,Math.PI*2);
      ctx.fillStyle=`rgba(${sp.cl[0]},${sp.cl[1]},${sp.cl[2]},${a})`;ctx.fill();
      ctx.beginPath();ctx.arc(sp.x,sp.y,sp.r*3*sp.life,0,Math.PI*2);
      ctx.fillStyle=`rgba(${sp.cl[0]},${sp.cl[1]},${sp.cl[2]},${a*0.12})`;ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';

    // shooting stars
    shootFrame++;
    if(shootFrame>=shootNext){
      spawnShooter();
      shootFrame=0;
      shootNext=IS_LOW_POWER?(300+Math.random()*500):(70+Math.random()*230); // low-power: slower
    }
    drawShooters();

    // Mobile: 30fps on stars — enough to feel alive, half the cost
    setTimeout(()=>requestAnimationFrame(draw),IS_LOW_POWER?33:16);
  }
  resize();draw();addEventListener('resize',resize);
})();


/* ===== 3. GALAXY — volumetric, nebula clouds, gentle storm ===== */
const TH={
  purple:{core:[255,240,255],bright:[210,170,255],mid:[150,90,220],dark:[80,40,160],
    dust:[50,15,100],cloud:[180,120,255],glow:[200,160,255],rays:[230,200,255],
    lightning:[220,180,255],neb1:[140,60,200],neb2:[100,40,180],neb3:[180,100,240]},
  blue:{core:[240,250,255],bright:[150,210,255],mid:[70,150,240],dark:[30,80,180],
    dust:[15,40,120],cloud:[100,180,255],glow:[140,200,255],rays:[200,230,255],
    lightning:[180,220,255],neb1:[50,120,220],neb2:[30,90,200],neb3:[80,160,240]},
  orange:{core:[255,250,230],bright:[255,210,140],mid:[240,150,70],dark:[180,80,30],
    dust:[120,40,10],cloud:[255,180,100],glow:[255,200,140],rays:[255,235,200],
    lightning:[255,230,180],neb1:[220,120,40],neb2:[200,90,20],neb3:[240,160,70]},
};

function createGalaxy(canvas,theme,section){
  const ctx=canvas.getContext('2d');
  const W=600,H=400;canvas.width=W;canvas.height=H;
  const cx=W/2,cy=H/2,T=TH[theme];
  const TILT=0.32,RX=W*0.44;
  let isHov=false;
  // Cursor tracking — relative to canvas center (for tilt)
  let mX=0,mY=0;
  section.addEventListener('mouseenter',()=>{
    isHov=true;
    // fire lightning immediately
    lBurst=Math.random()<0.4?0:Math.random()<0.6?1:2;
    triggerL();
    lTimer=0;
    lNext=20+Math.floor(Math.random()*70);
    canvas.style.transition='filter 0.5s ease';
  });
  section.addEventListener('mouseleave',()=>{
    isHov=false;mX=0;mY=0;
    canvas.style.transition='';canvas.style.transform='';
  });
  section.addEventListener('mousemove',(e)=>{
    const rect=canvas.getBoundingClientRect();
    mX=e.clientX-rect.left-rect.width/2;
    mY=e.clientY-rect.top-rect.height/2;
  });

  // lightning state — bursts of 1-3
  let lTimer=0,lFlash=0,lPos=[0,0],lBranches=[],lNext=25+Math.floor(Math.random()*60);
  let lBurst=0; // remaining strikes in current burst
  function triggerL(){
    const ang=Math.random()*Math.PI*2,dist=0.15+Math.random()*0.5;
    const[lx,ly]=proj(dist,ang,0);lPos=[lx,ly];lFlash=1.0;
    lBranches=[];
    const cnt=3+Math.floor(Math.random()*4);
    for(let i=0;i<cnt;i++){
      const pts=[];let px=lx,py=ly;
      const bA=Math.random()*Math.PI*2,len=20+Math.random()*60;
      const steps=5+Math.floor(Math.random()*5);
      for(let j=0;j<steps;j++){
        px+=Math.cos(bA+(Math.random()-0.5)*1.5)*(len/steps);
        py+=Math.sin(bA+(Math.random()-0.5)*1.5)*(len/steps)*TILT;
        pts.push([px,py]);
      }
      lBranches.push(pts);
    }
  }

  const M=IS_LOW_POWER?0.25:1; // low-power particle multiplier
  const nBg=Math.round(8000*M), nMid=Math.round(2500*M), nBright=Math.round(300*M);
  const nNeb=Math.round(70*M), nDustL=Math.round(35*M), nDustB=Math.round(85*M);
  const nClouds=Math.round(55*M), nRays=Math.round(28*M), nHot=Math.round(30*M);

  // NEBULA CLOUDS — large glowing regions within the galaxy
  const nebClouds=[];
  for(let i=0;i<nNeb;i++){
    const arm=i%4,armA=(arm/4)*Math.PI*2;
    const dist=0.03+Math.random()*0.88;
    const spiral=armA+dist*5.0+(Math.random()-0.5)*0.6;
    const whichNeb=Math.floor(Math.random()*3);
    const nebCol=whichNeb===0?T.neb1:whichNeb===1?T.neb2:T.neb3;
    nebClouds.push({
      dist,angle:spiral,
      sizeX:30+Math.random()*75,sizeY:12+Math.random()*35,
      baseOp:0.03+Math.random()*0.055,
      nebCol,
      pulseSpd:0.002+Math.random()*0.006,pulsePh:Math.random()*Math.PI*2,
      orbSpd:0.00005*(1+0.3/(dist+0.1)),
    });
  }

  const dustLane=[],dustBack=[],bgStars=[],midStars=[],brightStars=[];
  const cloudsFront=[],rays=[],hotspots=[];

  // dust lane
  for(let i=0;i<nDustL;i++){const dist=0.08+Math.random()*0.8;
    dustLane.push({dist,angle:Math.random()*Math.PI*2,sizeX:30+Math.random()*65,sizeY:3+Math.random()*10,opacity:0.05+Math.random()*0.07,orbSpd:0.00005*(1+0.3/(dist+0.1))});}
  // dust back
  for(let i=0;i<nDustB;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=0.03+Math.random()*0.92;
    dustBack.push({dist,angle:armA+dist*5.0+(Math.random()-0.5)*0.7,size:22+Math.random()*65,opacity:0.018+Math.random()*0.035,colorMix:Math.random(),pulseSpd:0.003+Math.random()*0.007,pulsePh:Math.random()*Math.PI*2,orbSpd:0.00006*(1+0.3/(dist+0.1))});}
  // bg stars
  for(let i=0;i<nBg;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=Math.pow(Math.random(),0.42)*0.96;
    const spiral=armA+dist*5.0+(Math.random()-0.5)*(0.85-dist*0.4);
    const zOff=(Math.random()-0.5)*(1-dist*0.5)*0.11;
    const t=dist;let c=t<0.08?T.core:t<0.2?T.bright:t<0.5?T.mid:T.dark;
    bgStars.push({dist,angle:spiral,zOff,r:0.2+Math.random()*0.7,c,alpha:0.25+Math.random()*0.55});}
  // mid stars
  for(let i=0;i<nMid;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=Math.pow(Math.random(),0.48)*0.92;
    const spiral=armA+dist*4.8+(Math.random()-0.5)*0.6;
    const zOff=(Math.random()-0.5)*(1-dist*0.4)*0.1;
    const t=dist;let c=t<0.12?T.core:t<0.35?T.bright:T.mid;
    midStars.push({dist,angle:spiral,zOff,r:0.4+Math.random()*1.1,c,baseA:0.4+Math.random()*0.5,twSpd:0.005+Math.random()*0.018,twPh:Math.random()*Math.PI*2,orbSpd:0.00012*(1+0.2/(dist+0.1))});}
  // bright
  for(let i=0;i<nBright;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=Math.pow(Math.random(),0.5)*0.85;
    const spiral=armA+dist*4.5+(Math.random()-0.5)*0.45;const zOff=(Math.random()-0.5)*0.05;
    let c=dist<0.15?T.core:T.bright;
    brightStars.push({dist,angle:spiral,zOff,r:1.0+Math.random()*2.4,c,baseA:0.6+Math.random()*0.4,twSpd:0.007+Math.random()*0.02,twPh:Math.random()*Math.PI*2,orbSpd:0.00018*(1+0.2/(dist+0.1)),halo:5+Math.random()*16});}
  // cloud puffs
  for(let i=0;i<nClouds;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=0.03+Math.random()*0.8;
    cloudsFront.push({dist,angle:armA+dist*5.0+(Math.random()-0.5)*0.55,sizeX:22+Math.random()*55,sizeY:9+Math.random()*24,opacity:0.02+Math.random()*0.04,pulseSpd:0.003+Math.random()*0.008,pulsePh:Math.random()*Math.PI*2,orbSpd:0.00007*(1+0.2/(dist+0.1))});}
  // rays
  for(let i=0;i<nRays;i++){rays.push({angle:(i/nRays)*Math.PI*2+(Math.random()-0.5)*0.3,length:55+Math.random()*180,width:1+Math.random()*4.5,pulseSpd:0.004+Math.random()*0.01,pulsePh:Math.random()*Math.PI*2,rotSpd:0.00008+Math.random()*0.00015});}
  // hotspots
  for(let i=0;i<nHot;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=0.08+Math.random()*0.65;
    hotspots.push({dist,angle:armA+dist*4.5+(Math.random()-0.5)*0.3,radius:6+Math.random()*18,pulseSpd:0.005+Math.random()*0.012,pulsePh:Math.random()*Math.PI*2,orbSpd:0.0001*(1+0.2/(dist+0.1))});}

  let time=Math.random()*10000;
  const rot={a:0,spd:0.00025};

  function proj(dist,angle,zOff){
    const r=dist*RX;return[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r*TILT+(zOff||0)*RX];
  }

  function draw(){
    time++;
    const tgtSpd=isHov?0.003:0.00025;
    rot.spd+=(tgtSpd-rot.spd)*0.06;rot.a+=rot.spd;
    if(isHov){
      const rx=-(mY/(H/2))*9;
      const ry=(mX/(W/2))*11;
      canvas.style.transform=`perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.04)`;
    }

    // lightning — bursts of 1-3 strikes
    if(isHov){lTimer++;
      if(lBurst>0&&lFlash<0.3){
        // fire next strike in burst
        lBurst--;triggerL();lTimer=0;
      } else if(lBurst===0&&lTimer>lNext){
        // start new burst
        lBurst=Math.random()<0.4?0:Math.random()<0.6?1:2; // 40% single, 36% double, 24% triple
        triggerL();lTimer=0;
        lNext=20+Math.floor(Math.random()*70);
      }
    }else{lTimer=0;lBurst=0;}
    if(lFlash>0)lFlash*=0.88;

    ctx.clearRect(0,0,W,H);
    const cp=0.7+0.3*Math.sin(time*0.018);

    // flash glow — illuminates galaxy from within
    if(lFlash>0.01){
      const fa=lFlash*0.2;
      const fg=ctx.createRadialGradient(lPos[0],lPos[1],0,lPos[0],lPos[1],RX*0.6);
      fg.addColorStop(0,`rgba(${T.lightning[0]},${T.lightning[1]},${T.lightning[2]},${fa})`);
      fg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);
    }

    /* CORE GLOW — volumetric depth */
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,TILT);
    let g=ctx.createRadialGradient(0,0,0,0,0,RX*0.8);
    g.addColorStop(0,`rgba(${T.dark[0]},${T.dark[1]},${T.dark[2]},${0.05*cp})`);
    g.addColorStop(0.5,`rgba(${T.dark[0]},${T.dark[1]},${T.dark[2]},${0.02*cp})`);
    g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,RX*0.8,0,Math.PI*2);ctx.fill();
    g=ctx.createRadialGradient(0,0,0,0,0,RX*0.45);
    g.addColorStop(0,`rgba(${T.glow[0]},${T.glow[1]},${T.glow[2]},${0.16*cp})`);
    g.addColorStop(0.4,`rgba(${T.mid[0]},${T.mid[1]},${T.mid[2]},${0.06*cp})`);
    g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,RX*0.45,0,Math.PI*2);ctx.fill();
    g=ctx.createRadialGradient(0,0,0,0,0,RX*0.15);
    g.addColorStop(0,`rgba(${T.core[0]},${T.core[1]},${T.core[2]},${0.6*cp})`);
    g.addColorStop(0.4,`rgba(${T.bright[0]},${T.bright[1]},${T.bright[2]},${0.25*cp})`);
    g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,RX*0.15,0,Math.PI*2);ctx.fill();
    g=ctx.createRadialGradient(0,0,0,0,0,RX*0.05);
    g.addColorStop(0,`rgba(255,255,255,${0.5*cp})`);g.addColorStop(1,`rgba(${T.core[0]},${T.core[1]},${T.core[2]},0)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,RX*0.05,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.globalCompositeOperation='lighter';

    /* RAYS */
    ctx.save();ctx.translate(cx,cy);
    for(const ray of rays){ray.angle+=ray.rotSpd;
      const pulse=0.2+0.8*Math.pow(Math.sin(time*ray.pulseSpd+ray.pulsePh)*0.5+0.5,2);
      const a=(0.05+lFlash*0.08)*pulse*cp;
      ctx.save();ctx.rotate(ray.angle);ctx.scale(1,TILT*0.5+0.5);
      const rg=ctx.createLinearGradient(0,0,ray.length,0);
      rg.addColorStop(0,`rgba(${T.rays[0]},${T.rays[1]},${T.rays[2]},${a})`);
      rg.addColorStop(0.4,`rgba(${T.glow[0]},${T.glow[1]},${T.glow[2]},${a*0.4})`);
      rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;
      ctx.fillRect(0,-ray.width/2,ray.length,ray.width);ctx.restore();
    }ctx.restore();

    /* NEBULA CLOUDS — lit up by lightning */
    for(const nc of nebClouds){
      nc.angle+=nc.orbSpd;
      const pulse=0.4+0.6*Math.sin(time*nc.pulseSpd+nc.pulsePh);
      const[x,y]=proj(nc.dist,nc.angle+rot.a,0);
      const flashBoost=lFlash*0.12;
      const ng=ctx.createRadialGradient(x,y,0,x,y,nc.sizeX);
      ng.addColorStop(0,`rgba(${nc.nebCol[0]},${nc.nebCol[1]},${nc.nebCol[2]},${nc.baseOp*pulse+flashBoost})`);
      ng.addColorStop(0.5,`rgba(${nc.nebCol[0]},${nc.nebCol[1]},${nc.nebCol[2]},${nc.baseOp*pulse*0.3+flashBoost*0.4})`);
      ng.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ng;
      ctx.beginPath();ctx.ellipse(x,y,nc.sizeX,nc.sizeY*TILT,rot.a*0.3,0,Math.PI*2);ctx.fill();
    }

    /* DUST BACK */
    for(const d of dustBack){d.angle+=d.orbSpd;const pulse=0.5+0.5*Math.sin(time*d.pulseSpd+d.pulsePh);
      const[x,y]=proj(d.dist,d.angle+rot.a,0);const c1=d.colorMix<0.5?T.cloud:T.glow;
      const dg=ctx.createRadialGradient(x,y,0,x,y,d.size);
      dg.addColorStop(0,`rgba(${c1[0]},${c1[1]},${c1[2]},${d.opacity*pulse*1.8})`);
      dg.addColorStop(0.6,`rgba(${T.mid[0]},${T.mid[1]},${T.mid[2]},${d.opacity*pulse*0.5})`);
      dg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=dg;
      ctx.beginPath();ctx.ellipse(x,y,d.size,d.size*TILT*0.7,0,0,Math.PI*2);ctx.fill();}

    /* BG STARS */
    for(const s of bgStars){const[x,y]=proj(s.dist,s.angle+rot.a,s.zOff);
      if(x<-3||x>W+3||y<-3||y>H+3)continue;
      ctx.fillStyle=`rgba(${s.c[0]},${s.c[1]},${s.c[2]},${Math.min(s.alpha+lFlash*0.15,1)})`;
      ctx.fillRect(x-s.r*0.5,y-s.r*0.5,s.r,s.r);}

    /* MID STARS */
    for(const s of midStars){s.angle+=s.orbSpd*(isHov?2.5:1);
      const a=s.baseA*(0.4+0.6*Math.sin(time*s.twSpd+s.twPh))+lFlash*0.12;
      const[x,y]=proj(s.dist,s.angle+rot.a,s.zOff);
      if(x<-3||x>W+3||y<-3||y>H+3)continue;
      ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${s.c[0]},${s.c[1]},${s.c[2]},${Math.min(a,1)})`;ctx.fill();}

    /* DUST LANE */
    ctx.globalCompositeOperation='source-over';
    for(const d of dustLane){d.angle+=d.orbSpd;const[x,y]=proj(d.dist,d.angle+rot.a,0);
      ctx.fillStyle=`rgba(${T.dust[0]},${T.dust[1]},${T.dust[2]},${d.opacity})`;
      ctx.beginPath();ctx.ellipse(x,y,d.sizeX,d.sizeY*TILT,rot.a*0.3,0,Math.PI*2);ctx.fill();}
    ctx.globalCompositeOperation='lighter';

    /* CLOUD PUFFS */
    for(const p of cloudsFront){p.angle+=p.orbSpd;const pulse=0.3+0.7*Math.sin(time*p.pulseSpd+p.pulsePh);
      const[x,y]=proj(p.dist,p.angle+rot.a,0);const fb=lFlash*0.03;
      const pg=ctx.createRadialGradient(x,y,0,x,y,p.sizeX);
      pg.addColorStop(0,`rgba(${T.cloud[0]},${T.cloud[1]},${T.cloud[2]},${p.opacity*pulse*1.5+fb})`);
      pg.addColorStop(0.5,`rgba(${T.glow[0]},${T.glow[1]},${T.glow[2]},${p.opacity*pulse*0.4+fb*0.3})`);
      pg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=pg;
      ctx.beginPath();ctx.ellipse(x,y,p.sizeX,p.sizeY*TILT,rot.a*0.4,0,Math.PI*2);ctx.fill();}

    /* BRIGHT STARS */
    for(const s of brightStars){s.angle+=s.orbSpd*(isHov?2.5:1);
      const a=s.baseA*(0.4+0.6*Math.sin(time*s.twSpd+s.twPh))+lFlash*0.1;
      const[x,y]=proj(s.dist,s.angle+rot.a,s.zOff);
      if(x<-10||x>W+10||y<-10||y>H+10)continue;
      const hg=ctx.createRadialGradient(x,y,0,x,y,s.halo);
      hg.addColorStop(0,`rgba(${s.c[0]},${s.c[1]},${s.c[2]},${Math.min(a*0.25,0.5)})`);
      hg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=hg;
      ctx.beginPath();ctx.arc(x,y,s.halo,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${s.c[0]},${s.c[1]},${s.c[2]},${Math.min(a,1)})`;ctx.fill();
      if(s.r>2.0){ctx.strokeStyle=`rgba(${s.c[0]},${s.c[1]},${s.c[2]},${Math.min(a*0.3,0.5)})`;
        ctx.lineWidth=0.5;const len=s.r*5;ctx.beginPath();
        ctx.moveTo(x-len,y);ctx.lineTo(x+len,y);ctx.moveTo(x,y-len);ctx.lineTo(x,y+len);ctx.stroke();}}

    /* HOTSPOTS */
    for(const h of hotspots){h.angle+=h.orbSpd;
      const pulse=0.3+0.7*Math.pow(Math.sin(time*h.pulseSpd+h.pulsePh)*0.5+0.5,2);
      const[x,y]=proj(h.dist,h.angle+rot.a,0);
      const hg=ctx.createRadialGradient(x,y,0,x,y,h.radius);
      hg.addColorStop(0,`rgba(${T.core[0]},${T.core[1]},${T.core[2]},${0.1*pulse+lFlash*0.05})`);
      hg.addColorStop(0.4,`rgba(${T.glow[0]},${T.glow[1]},${T.glow[2]},${0.03*pulse})`);
      hg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=hg;
      ctx.beginPath();ctx.ellipse(x,y,h.radius,h.radius*TILT*0.8,0,0,Math.PI*2);ctx.fill();}

    /* LIGHTNING BOLTS — beautiful visible bolts */
    if(lFlash>0.03&&lBranches.length){
      ctx.strokeStyle=`rgba(${T.lightning[0]},${T.lightning[1]},${T.lightning[2]},${lFlash*0.8})`;
      ctx.lineWidth=1.5*lFlash;ctx.shadowColor=`rgba(${T.lightning[0]},${T.lightning[1]},${T.lightning[2]},${lFlash})`;
      ctx.shadowBlur=15*lFlash;
      for(const branch of lBranches){ctx.beginPath();ctx.moveTo(lPos[0],lPos[1]);
        for(const[px,py] of branch)ctx.lineTo(px,py);ctx.stroke();}
      ctx.shadowBlur=0;}

    /* FRONT GLOW LAYER — volumetric depth */
    const fgPulse=0.5+0.5*Math.sin(time*0.015);
    const fgG=ctx.createRadialGradient(cx,cy,0,cx,cy,RX*0.25);
    fgG.addColorStop(0,`rgba(${T.core[0]},${T.core[1]},${T.core[2]},${0.08*fgPulse})`);
    fgG.addColorStop(0.5,`rgba(${T.glow[0]},${T.glow[1]},${T.glow[2]},${0.03*fgPulse})`);
    fgG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fgG;ctx.save();ctx.translate(cx,cy);ctx.scale(1,TILT);
    ctx.beginPath();ctx.arc(0,0,RX*0.25,0,Math.PI*2);ctx.fill();ctx.restore();

    ctx.globalCompositeOperation='source-over';
    const cpA=0.85+0.15*Math.sin(time*0.04);
    ctx.beginPath();ctx.arc(cx,cy,2.5,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${cpA})`;ctx.fill();
    // cap at 30fps desktop / 20fps mobile — galaxies are heavy (3 × ~11k particles)
    if(visible){setTimeout(()=>requestAnimationFrame(draw),IS_LOW_POWER?50:33);}
    else{pending=true;}
  }

  // Pause when section is off-screen
  let visible=true, pending=false;
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      visible=e.isIntersecting;
      if(visible&&pending){pending=false;requestAnimationFrame(draw);}
    });
  },{rootMargin:'100px'});
  io.observe(section);

  draw();
}

document.querySelectorAll('.galaxy').forEach((sec)=>{
  const cv=sec.querySelector('.galaxy__canvas');const t=sec.dataset.color;
  if(cv&&t)createGalaxy(cv,t,sec);
});


/* ===== 4. SHOOTING STARS — removed by request ===== */

/* ===== 5. SCROLL REVEAL ===== */
const gS=document.querySelectorAll('.galaxy');
const obs=new IntersectionObserver((e)=>e.forEach((x)=>{if(x.isIntersecting)x.target.classList.add('visible');}),{threshold:0.15});
gS.forEach((g)=>obs.observe(g));
document.querySelectorAll('.about').forEach((a)=>obs.observe(a));

/* ===== 6. CLICK ===== */
function openGalaxy(g){
  const u=g.dataset.url;if(!u)return;
  g.style.transition='transform 0.6s,opacity 0.6s';g.style.transform='scale(1.1)';g.style.opacity='0.5';
  setTimeout(()=>{window.open(u,'_blank','noopener,noreferrer');g.style.transform='';g.style.opacity='';
    setTimeout(()=>{g.style.transition='';},600);},400);
}
gS.forEach((g)=>{
  g.addEventListener('click',()=>openGalaxy(g));
  g.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();openGalaxy(g);}
  });
});

/* ===== 6a. GALAXY TILT — merged into parallax loop below (see section 7) ===== */

/* ===== 6b. GALAXY CAROUSEL (5051) — auto-rotating screenshot fade ===== */
(function initGalaxyCarousels(){
  document.querySelectorAll('.galaxy__shots').forEach(wrap=>{
    const shots=wrap.querySelectorAll('.galaxy__shot');
    const dots=wrap.querySelectorAll('.galaxy__shots-dot');
    if(shots.length<2) return;
    let idx=0, timer=null, paused=false;
    function show(i){
      idx=(i+shots.length)%shots.length;
      shots.forEach((s,n)=>s.classList.toggle('galaxy__shot--active',n===idx));
      dots.forEach((d,n)=>{
        const active=(n===idx);
        d.classList.toggle('galaxy__shots-dot--active',active);
        if(active) d.setAttribute('aria-current','true'); else d.removeAttribute('aria-current');
      });
    }
    function start(){stop();timer=setInterval(()=>{if(!paused) show(idx+1);},4500);}
    function stop(){if(timer){clearInterval(timer);timer=null;}}
    wrap.addEventListener('mouseenter',()=>{paused=true;});
    wrap.addEventListener('mouseleave',()=>{paused=false;});
    dots.forEach((d,n)=>{
      d.addEventListener('click',e=>{e.stopPropagation();show(n);start();});
      d.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){
          e.preventDefault();e.stopPropagation();show(n);start();
        }
      });
    });
    // Pause rotation when section off-screen
    if('IntersectionObserver' in window){
      const sec=wrap.closest('.galaxy');
      if(sec){
        new IntersectionObserver(entries=>{
          entries.forEach(e=>{if(e.isIntersecting) start(); else stop();});
        },{rootMargin:'100px'}).observe(sec);
      } else start();
    } else start();
  });
})();

/* ===== 7. PARALLAX + TILT — combined into one rAF so they don't fight over
     the same transform property. Tilt only fires when the cursor is on the
     orbit itself (not the whole .galaxy row), and uses a JS-lerped low-pass
     filter so fast mouse movement produces buttery motion, not jitter. ===== */
if(!IS_LOW_POWER){
  let mX2=0,mY2=0,tX2=0,tY2=0;
  document.addEventListener('mousemove',(e)=>{mX2=(e.clientX/innerWidth-0.5)*2;mY2=(e.clientY/innerHeight-0.5)*2;});

  const tilts=[];
  gS.forEach((g,i)=>{
    const orbit=g.querySelector('.galaxy__orbit');
    if(!orbit) return;
    orbit.style.willChange='transform';
    const s={i, orbit, targetRx:0, targetRy:0, curRx:0, curRy:0};
    tilts.push(s);
    orbit.addEventListener('pointermove',e=>{
      const r=orbit.getBoundingClientRect();
      const nx=((e.clientX-r.left)/r.width-0.5)*2;
      const ny=((e.clientY-r.top)/r.height-0.5)*2;
      // clamp to [-1,1] so corners don't overshoot
      s.targetRx=-Math.max(-1,Math.min(1,ny))*5;
      s.targetRy= Math.max(-1,Math.min(1,nx))*5;
    });
    orbit.addEventListener('pointerleave',()=>{s.targetRx=0;s.targetRy=0;});
  });

  function loop(){
    tX2+=(mX2-tX2)*0.05;
    tY2+=(mY2-tY2)*0.05;
    for(const s of tilts){
      s.curRx+=(s.targetRx-s.curRx)*0.12;
      s.curRy+=(s.targetRy-s.curRy)*0.12;
      const d=(s.i+1)*8;
      const tx=(tX2*d).toFixed(2);
      const ty=(tY2*d).toFixed(2);
      const rx=s.curRx.toFixed(2);
      const ry=s.curRy.toFixed(2);
      s.orbit.style.transform=
        `translate(${tx}px,${ty}px) `+
        `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
    requestAnimationFrame(loop);
  }
  loop();
}

/* ===== 8. SCROLL HINT ===== */
const sh=document.querySelector('.scroll-hint');let hid=false;
addEventListener('scroll',()=>{if(!hid&&scrollY>100){hid=true;sh.style.transition='opacity 0.5s';sh.style.opacity='0';}},{passive:true});

/* ===== 9. TEXT BLACK HOLE SUCTION ===== */
(function initTextSuction(){
  // Skip on mobile entirely: splitting text into ~1000 spans + touching each
  // one per frame is the biggest remaining cost, and touch-hold BH is unreliable.
  if(IS_MOBILE) return;
  // split text into individual letter spans
  const targets=document.querySelectorAll('.header__sub,.header__tagline,.header__caption,.about__portrait-label,.about__lead,.about__line,.about__cta,.about__connect,.galaxies__title,.galaxies__sub,.galaxy__name,.galaxy__desc,.galaxy__case,.galaxy__stack,.galaxy__link,.contact__title,.contact__sub,.footer p,.footer__stack,.footer__sign-label,.scroll-hint__text');
  const allLetters=[];
  targets.forEach(el=>{
    const text=el.textContent;
    // detect if parent uses background-clip:text (gradient text)
    const cs=getComputedStyle(el);
    const isGradientText=(cs.webkitTextFillColor==='transparent'||cs.webkitTextFillColor==='rgba(0, 0, 0, 0)');
    el.textContent='';
    let wordWrap=null;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      const span=document.createElement('span');
      span.style.display='inline-block';
      if(ch===' '){
        span.innerHTML='&nbsp;';
      } else {
        span.textContent=ch;
      }
      span._ox=0;span._oy=0; // offset from home
      span._vx=0;span._vy=0; // velocity
      span._sucked=false;
      span._isSpace=(ch===' ');
      span._gradientText=isGradientText;
      if(span._isSpace){
        el.appendChild(span);
        wordWrap=null;
      } else {
        if(!wordWrap){
          wordWrap=document.createElement('span');
          wordWrap.style.display='inline-block';
          wordWrap.style.whiteSpace='nowrap';
          el.appendChild(wordWrap);
        }
        wordWrap.appendChild(span);
        allLetters.push(span);
      }
    }
  });

  let bmx=-999,bmy=-999,bStill=0;
  const BH_TH=25;
  const SUCK_R=100;   // only very close letters get sucked
  const PULL_STR=2.5;  // strong pull — real suction

  document.addEventListener('mousemove',(e)=>{bmx=e.clientX;bmy=e.clientY;bStill=0;});
  document.addEventListener('mouseleave',()=>{bmx=-999;bmy=-999;bStill=0;});
  // Touch: hold to suck letters, release to let them return home
  document.addEventListener('touchstart',(e)=>{const t=e.touches[0];if(t){bmx=t.clientX;bmy=t.clientY;bStill=0;}},{passive:true});
  document.addEventListener('touchmove',(e)=>{const t=e.touches[0];if(t){bmx=t.clientX;bmy=t.clientY;bStill=0;}},{passive:true});
  document.addEventListener('touchend',()=>{bmx=-999;bmy=-999;bStill=0;},{passive:true});
  document.addEventListener('touchcancel',()=>{bmx=-999;bmy=-999;bStill=0;},{passive:true});

  // block on galaxy canvas only
  let overOrbit=false;
  document.querySelectorAll('.galaxy__orbit').forEach(g=>{
    g.addEventListener('mouseenter',()=>{overOrbit=true;});
    g.addEventListener('mouseleave',()=>{overOrbit=false;});
  });

  let returnTimer=0; // frames since BH turned off
  let prevBhOn=false;
  let lastScrollY=scrollY;
  let lastScrollX=scrollX;

  function tick(){
    bStill++;
    const bhOn=bStill>BH_TH&&bmx>0&&!overOrbit;

    if(!bhOn) returnTimer++; else returnTimer=0;

    // Cache each letter's home position once per BH session — getBoundingClientRect()
    // forces layout and is expensive on mobile when called per-letter per-frame.
    if(bhOn && !prevBhOn){
      for(const sp of allLetters){
        const rect=sp.getBoundingClientRect();
        sp._homeCx=rect.left+rect.width/2-sp._ox;
        sp._homeCy=rect.top+rect.height/2-sp._oy;
      }
      lastScrollY=scrollY;
      lastScrollX=scrollX;
    }
    // When BH active, shift cached home coords by scroll delta so letters follow
    // the cursor through the actual page geometry instead of the pre-scroll location.
    if(bhOn){
      const dSy=scrollY-lastScrollY;
      const dSx=scrollX-lastScrollX;
      if(dSy!==0||dSx!==0){
        for(const sp of allLetters){
          sp._homeCy-=dSy;
          sp._homeCx-=dSx;
        }
        lastScrollY=scrollY;
        lastScrollX=scrollX;
      }
    }
    prevBhOn=bhOn;

    // hard reset all letters if BH has been off long enough
    if(returnTimer===120){
      for(const sp of allLetters){
        sp._ox=0;sp._oy=0;sp._vx=0;sp._vy=0;sp._sucked=false;
        sp.style.transform='';sp.style.opacity='';
        if(sp._gradientText){
          sp.style.webkitTextFillColor='';sp.style.backgroundClip='';
          sp.style.webkitBackgroundClip='';sp.style.background='';
        }
      }
    }

    for(const sp of allLetters){
      if(bhOn){
        // cached home position — see top of tick()
        const homeCx=sp._homeCx;
        const homeCy=sp._homeCy;
        const dx=bmx-homeCx,dy=bmy-homeCy;
        const homeDist=Math.hypot(dx,dy);

        // Mid-return from a previous BH: if new BH is too far to re-suck, keep
        // springing the letter back home instead of freezing it in a stretched pose.
        if(sp._sucked && homeDist>=SUCK_R && (sp._ox!==0||sp._oy!==0)){
          sp._orbiting=false;
          sp._vx+=(-sp._ox)*0.12;
          sp._vy+=(-sp._oy)*0.12;
          sp._vx*=0.85;sp._vy*=0.85;
          sp._ox+=sp._vx;
          sp._oy+=sp._vy;
          if(Math.abs(sp._ox)<0.3&&Math.abs(sp._oy)<0.3&&
             Math.abs(sp._vx)<0.2&&Math.abs(sp._vy)<0.2){
            sp._ox=0;sp._oy=0;sp._vx=0;sp._vy=0;
            sp._sucked=false;
            sp.style.transform='';sp.style.opacity='';
            if(sp._gradientText){
              sp.style.webkitTextFillColor='';sp.style.backgroundClip='';
              sp.style.webkitBackgroundClip='';sp.style.background='';
            }
          } else {
            // soft return transform — mild motion-stretch, no heavy spaghettification
            const speed=Math.hypot(sp._vx,sp._vy);
            const angle=Math.atan2(sp._oy,sp._ox);
            const stretch=1+Math.min(speed*0.15,0.6);
            const squash=1/Math.max(Math.sqrt(stretch),1);
            const aDeg=angle*180/Math.PI;
            sp.style.transform=`translate(${sp._ox}px,${sp._oy}px) rotate(${aDeg}deg) scaleX(${stretch.toFixed(2)}) scaleY(${squash.toFixed(2)}) rotate(${-aDeg}deg)`;
            sp.style.opacity='';
          }
          continue;
        }
        sp._frozen=false;

        if(homeDist<SUCK_R){
          if(!sp._sucked){
            sp._sucked=true;
            sp._orbiting=false;
            sp._orbAngle=Math.atan2(dy,dx)+Math.PI; // angle from BH
            sp._orbR=homeDist; // start orbit at current distance
            if(window.__sfx) window.__sfx.onLetterSucked();
            // gradient-text letters: switch to solid white so they're visible when moving
            if(sp._gradientText){
              sp.style.webkitTextFillColor='#fff';
              sp.style.backgroundClip='unset';
              sp.style.webkitBackgroundClip='unset';
              sp.style.background='none';
            }
          }

          if(!sp._orbiting){
            // SUCTION PHASE — pull toward center with stretch
            const proximity=1-homeDist/SUCK_R;
            const force=PULL_STR*Math.pow(proximity,1.2)/Math.max(homeDist*0.08,1);
            sp._vx+=dx*force*0.018;
            sp._vy+=dy*force*0.018;
            // tangential swirl
            if(homeDist>1){
              const tx=-dy/homeDist,ty=dx/homeDist;
              sp._vx+=tx*force*0.005;
              sp._vy+=ty*force*0.005;
            }
            sp._ox+=sp._vx;
            sp._oy+=sp._vy;
            sp._vx*=0.93;sp._vy*=0.93;

            // check if letter reached BH center (within 20px) — start orbiting
            const curCx=homeCx+sp._ox;
            const curCy=homeCy+sp._oy;
            const distToBH=Math.hypot(bmx-curCx,bmy-curCy);
            if(distToBH<20){
              sp._orbiting=true;
              sp._orbAngle=Math.atan2(curCy-bmy,curCx-bmx);
              sp._orbR=12+Math.random()*18; // orbit radius 12-30px
              sp._orbSpeed=0.04+Math.random()*0.03; // each letter different speed
            }
          }

          if(sp._orbiting){
            // ORBIT PHASE — spin around BH center
            sp._orbAngle+=sp._orbSpeed;
            // target position relative to home
            const targetX=(bmx+Math.cos(sp._orbAngle)*sp._orbR)-homeCx;
            const targetY=(bmy+Math.sin(sp._orbAngle)*sp._orbR)-homeCy;
            sp._ox+=(targetX-sp._ox)*0.3;
            sp._oy+=(targetY-sp._oy)*0.3;
            sp._vx=0;sp._vy=0;
          }
        }
      }

      if(sp._sucked){
        // spring back when BH off
        if(!bhOn){
          sp._orbiting=false;
          sp._vx+=(-sp._ox)*0.12;
          sp._vy+=(-sp._oy)*0.12;
          sp._vx*=0.85;sp._vy*=0.85;
          sp._ox+=sp._vx;
          sp._oy+=sp._vy;
          if(Math.abs(sp._ox)<0.3&&Math.abs(sp._oy)<0.3&&
             Math.abs(sp._vx)<0.2&&Math.abs(sp._vy)<0.2){
            sp._ox=0;sp._oy=0;sp._vx=0;sp._vy=0;
            sp._sucked=false;sp._orbiting=false;
            sp.style.transform='';sp.style.opacity='';
            if(sp._gradientText){
              sp.style.webkitTextFillColor='';sp.style.backgroundClip='';
              sp.style.webkitBackgroundClip='';sp.style.background='';
            }
            continue;
          }
        }

        const speed=Math.hypot(sp._vx,sp._vy);

        // current position = cached home + current offset (avoids per-frame layout recalc)
        const curCx2=sp._homeCx+sp._ox;
        const curCy2=sp._homeCy+sp._oy;
        const distToBH2=Math.hypot(bmx-curCx2,bmy-curCy2);

        if(sp._orbiting){
          // orbiting letters: small, semi-transparent, spinning
          const spin=(sp._orbAngle*180/Math.PI)%360;
          sp.style.transform=`translate(${sp._ox}px,${sp._oy}px) rotate(${spin.toFixed(0)}deg) scale(0.3)`;
          sp.style.opacity='0.4';
        } else {
          // suction phase: stretch toward BH, fade/shrink based on closeness TO the BH
          const proximity=Math.max(1-distToBH2/SUCK_R,0); // 0=far, 1=at center
          const scale=Math.max(1-proximity*0.7,0.2); // shrink as it nears BH
          const opacity=Math.max(1-proximity*0.6,0.15); // stay visible until close
          const angle=Math.atan2(sp._oy,sp._ox);
          const stretch=1+Math.min(speed*0.4+proximity*2.5,3.0);
          const squash=1/Math.max(Math.sqrt(stretch),1);
          const aDeg=angle*180/Math.PI;
          sp.style.transform=`translate(${sp._ox}px,${sp._oy}px) rotate(${aDeg}deg) scaleX(${stretch.toFixed(2)}) scaleY(${squash.toFixed(2)}) rotate(${-aDeg}deg) scale(${scale.toFixed(2)})`;
          sp.style.opacity=opacity.toFixed(2);
        }
      }
    }
    setTimeout(()=>requestAnimationFrame(tick),16);
  }
  tick();
})();


/* ===== 10. FLOATING ASTRONAUT — 3D GLB model via <model-viewer> ===== */
(function initAstronaut3D(){
  const mv=document.getElementById('astronaut-3d');
  // Mobile: astronaut is CSS-hidden; no point running the full animation loop.
  if(!mv || IS_MOBILE) return;

  let t=Math.random()*10000;

  // Scroll physics
  let prevScrollY=0,scrollPush=0,scrollPushVel=0;
  addEventListener('scroll',()=>{
    const nv=scrollY-prevScrollY;
    prevScrollY=scrollY;
    scrollPushVel+=nv*2.5;
  },{passive:true});

  // Waypoint system — astronaut drifts across the full screen
  function randomPos(){
    return {
      x: (Math.random()-0.5)*innerWidth*0.85,
      y: (Math.random()-0.5)*innerHeight*0.75
    };
  }
  // Pick a next waypoint that's far from the current one — forces full-screen coverage
  function farPos(from){
    const minDist=Math.min(innerWidth,innerHeight)*0.45;
    let p;
    for(let i=0;i<6;i++){
      p=randomPos();
      const dx=p.x-from.x, dy=p.y-from.y;
      if(dx*dx+dy*dy>minDist*minDist) return p;
    }
    return p;
  }
  let wp=randomPos(), nextWp=farPos(wp);
  let wpT=0, wpDur=6+Math.random()*4; // 6-10 seconds per waypoint

  // Entry: start offscreen at a random angle, fly into view
  const entryAngle=Math.random()*Math.PI*2;
  const entryDist=Math.max(innerWidth,innerHeight)*1.2;
  let curX=Math.cos(entryAngle)*entryDist;
  let curY=Math.sin(entryAngle)*entryDist;
  let entryT=0;

  // Thought bubble
  const thoughts=[
    "I left the oven on...",
    "Houston, I need coffee",
    "Is that a star or a pixel?",
    "Gravity is overrated",
    "404: Earth not found",
    "Floating is my cardio",
    "Plot twist: I'm the UFO",
    "WiFi signal: 0 bars",
    "Dear diary: still floating",
    "My rent is still due up here",
    "Technically I'm falling forever",
    "Note to self: pack more snacks",
    "Is it Monday on Earth?",
    "What is this RS69 studio anyway?",
    "Why am I guarding his portfolio?",
    "He builds sites, I float. Fair deal",
    "This site has more effects than NASA",
    "RS69 made me. I didn't ask for this",
    "Why are there letters floating in space?",
    "These galaxies are just links. I checked",
    "I get no salary for this",
    "At least his CSS is clean"
  ];
  let thoughtOrder=thoughts.map((_,i)=>i);
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}}
  shuffle(thoughtOrder);
  let thoughtIdx=0;

  const bubble=document.createElement('div');
  bubble.className='astro-thought';
  document.body.appendChild(bubble);

  let bubbleTimer=3.5+Math.random()*1; // first thought in 3.5-4.5s
  let bubbleVisible=false;
  let bubbleShowTime=0;
  const BUBBLE_DURATION=3;
  const BUBBLE_PAUSE_MIN=2.5;
  const BUBBLE_PAUSE_MAX=6;

  // Black-hole proximity reactions — only when cursor is actually in BH state (not just still arrow)
  const BH_PROXIMITY=140;
  const bhThoughts=[
    "Hey hey hey — that was a SUGGESTION, not an invitation. Back it up, buddy.",
    "I'm serious. Move that cosmic vacuum cleaner. I have plans this week.",
    "Okay my helmet is wobbling. This is officially a you problem."
  ];
  const bhAbsorbQuote="NOT THE HAIR!! Tell RS69 his CSS was clean to the very end — aaaaaaaahh—";
  const bhReturnQuote="Bro. I'm literally client-side JavaScript. You can't delete me — one page reload and I respawn. Immortality is a ctrl+F5 away, dude.";
  let bhReactCount=0, bhInProximity=false;
  let firstBHShown=false;
  let prevBhFullyFormed=false;
  const bhFirstHint="Oh great, a black hole. Hold the cursor still — watch it chew the letters. Just... don't point it at me, alright?";

  // Absorption / return state machine
  let astroState='normal'; // 'normal' | 'absorbing' | 'absorbed' | 'returning'
  let absorbT=0, absorbedT=0, returnT=0;
  let returnStartX=0, returnStartY=0, returnTargetX=0, returnTargetY=0;
  let absorbStartX=0, absorbStartY=0, absorbTgtX=0, absorbTgtY=0;
  let bhInProxT=0;
  const ABSORB_DUR=2.4, ABSORBED_DELAY=2.5, RETURN_DUR=6.0;

  function animate(){
    t+=0.016;

    // ── ABSORBED: hidden, wait for BH to turn off + delay before returning ──
    if(astroState==='absorbed'){
      const bh=window.__bh;
      if(!bh||!bh.active){
        absorbedT+=0.016;
        if(absorbedT>=ABSORBED_DELAY){
          astroState='returning';
          returnT=0;
          // Start far off-screen on a random side, fly slowly into view
          const entryAng=Math.random()*Math.PI*2;
          const entryR=Math.max(innerWidth,innerHeight)*1.1;
          returnStartX=Math.cos(entryAng)*entryR;
          returnStartY=Math.sin(entryAng)*entryR;
          returnTargetX=(Math.random()-0.5)*innerWidth*0.5;
          returnTargetY=(Math.random()-0.5)*innerHeight*0.4;
          curX=returnStartX;
          curY=returnStartY;
          mv.style.opacity='1';
          bubble.textContent=bhReturnQuote;
          bubble.classList.add('visible');
          bubbleVisible=true;
          bubbleShowTime=7;
        }
      } else {
        absorbedT=0;
      }
      setTimeout(()=>requestAnimationFrame(animate),16);
      return;
    }

    scrollPush+=scrollPushVel*0.3;
    scrollPushVel*=0.85;
    scrollPush*=0.97;

    let baseX, baseY;

    if(astroState==='returning'){
      returnT+=0.016;
      const p=Math.min(returnT/RETURN_DUR,1);
      const easeR=1-Math.pow(1-p,3);
      baseX=returnStartX+(returnTargetX-returnStartX)*easeR;
      baseY=returnStartY+(returnTargetY-returnStartY)*easeR;
      if(p>=1){
        astroState='normal';
        wp={x:baseX,y:baseY};
        nextWp=farPos(wp);
        wpT=0;
        wpDur=6+Math.random()*4;
        bhReactCount=0;
        // firstBHShown stays true — the tutorial hint was already shown, no need to repeat
      }
    } else if(astroState==='absorbing'){
      absorbT+=0.016;
      // Straight-line pull toward BH, accelerating — no spiraling, just gets dragged in
      const p=Math.min(absorbT/ABSORB_DUR,1);
      const pA=Math.pow(p,1.5);
      baseX=absorbStartX+(absorbTgtX-absorbStartX)*pA;
      baseY=absorbStartY+(absorbTgtY-absorbStartY)*pA;
      if(absorbT>=ABSORB_DUR){
        astroState='absorbed';
        absorbedT=0;
        mv.style.opacity='0';
        bubble.classList.remove('visible');
        bubbleVisible=false;
        if(window.__sfx) window.__sfx.onAbsorbed();
        if(window.__absCounter) window.__absCounter.bump();
        setTimeout(()=>requestAnimationFrame(animate),16);
        return;
      }
    } else {
      // normal: waypoint drift + Lissajous micro-drift
      wpT+=0.016;
      if(wpT>=wpDur){
        wp=nextWp;
        nextWp=farPos(wp);
        wpT=0;
        wpDur=6+Math.random()*4;
      }
      const progress=wpT/wpDur;
      const easeWp=progress<0.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
      baseX=wp.x+(nextWp.x-wp.x)*easeWp;
      baseY=wp.y+(nextWp.y-wp.y)*easeWp;
      baseX+=Math.sin(t*0.055)*innerWidth*0.04+Math.cos(t*0.025)*innerWidth*0.02;
      baseY+=Math.sin(t*0.04+0.5)*innerHeight*0.03+Math.cos(t*0.02)*innerHeight*0.015;
    }

    const targetX=baseX;
    const targetY=baseY-scrollPush;
    entryT+=0.016;
    const entryEase=Math.min(1,entryT/5);
    // Returning state uses its own eased interpolation so don't extra-smooth it
    const lerp=astroState==='returning'||astroState==='absorbing' ? 1.0 : 0.015+(0.022-0.015)*(1-entryEase);
    curX+=(targetX-curX)*lerp;
    curY+=(targetY-curY)*lerp;

    // Camera orbit
    const theta=(t*8)%360+Math.sin(t*0.07)*25;
    const phi=75+Math.sin(t*0.04)*35+Math.sin(t*0.09)*12;
    const dist=600+Math.sin(t*0.06)*20;
    mv.cameraOrbit=theta+'deg '+phi+'deg '+dist+'m';

    // Tumble
    const tiltX=Math.sin(t*0.05)*15+Math.sin(t*0.11)*6;
    const tiltY=Math.sin(t*0.04+0.7)*18+Math.sin(t*0.09+2)*8;
    const tiltZ=Math.sin(t*0.035+1)*14+Math.sin(t*0.08)*5;

    // Build transform — directional spaghettification toward BH if absorbing
    let transform='translate('+curX+'px,'+curY+'px)';
    if(astroState==='absorbing'){
      const p=Math.min(absorbT/ABSORB_DUR,1);
      const astroScreenX=innerWidth/2+curX;
      const astroScreenY=innerHeight/2+curY;
      const bhScreenX=absorbTgtX+innerWidth/2;
      const bhScreenY=absorbTgtY+innerHeight/2;
      const dirAng=Math.atan2(bhScreenY-astroScreenY,bhScreenX-astroScreenX)*180/Math.PI;
      // stretch peaks mid-absorption so near side reaches BH first, far side lags behind
      const stretchAmt=Math.sin(p*Math.PI);
      const stretchX=1+stretchAmt*2.2;
      const squishY=Math.max(1-stretchAmt*0.5,0.4);
      const shrink=Math.max(1-Math.pow(p,1.3)*0.95,0.04);
      const sx=shrink*stretchX;
      const sy=shrink*squishY;
      // bias translate toward BH proportional to stretch — simulates near edge leading in
      const leadBias=stretchAmt*30;
      const dxN=bhScreenX-astroScreenX;
      const dyN=bhScreenY-astroScreenY;
      const dN=Math.max(Math.hypot(dxN,dyN),1);
      const biasX=(dxN/dN)*leadBias;
      const biasY=(dyN/dN)*leadBias;
      mv.style.opacity=String(Math.max(1-Math.pow(p,2.2),0));
      mv.style.filter='blur('+(stretchAmt*1.3).toFixed(2)+'px)';
      // rebuild transform WITHOUT tumble rotations — pure translate + directional stretch
      transform='translate('+(curX+biasX)+'px,'+(curY+biasY)+'px)';
      transform+=' rotate('+dirAng+'deg) scale('+sx+','+sy+') rotate('+(-dirAng)+'deg)';
    } else {
      mv.style.opacity='1';
      mv.style.filter='';
      transform+=' rotateX('+tiltX+'deg) rotateY('+tiltY+'deg) rotateZ('+tiltZ+'deg)';
    }
    mv.style.transform=transform;

    // Thought bubble position — follows astronaut, offset up-right
    const screenX=innerWidth/2+curX;
    const screenY=innerHeight/2+curY;
    bubble.style.left=(screenX+35)+'px';
    bubble.style.top=(screenY-55)+'px';

    // BH reactions — only in normal state
    if(astroState==='normal'){
      const bh=window.__bh;
      const bhFullyFormed=bh&&bh.active&&bh.str>0.5;
      const bhDist=bh&&bh.mx>0?Math.hypot(bh.mx-screenX,bh.my-screenY):9999;
      // Edge-trigger: fire reliable acknowledgment the moment BH fully forms
      const bhJustFormed=bhFullyFormed && !prevBhFullyFormed;
      if(bhJustFormed){
        // fresh BH session — reset proximity tracker so warnings can fire immediately
        bhInProximity=false;
        bhInProxT=0;
        let bubbleSet=false;
        if(bhDist<BH_PROXIMITY){
          // BH spawned right next to astronaut — skip the generic ack, go straight to warning
          if(bhReactCount>=bhThoughts.length){
            astroState='absorbing';
            absorbT=0;
            absorbStartX=curX;
            absorbStartY=curY;
            absorbTgtX=bh.mx-innerWidth/2;
            absorbTgtY=bh.my-innerHeight/2;
            bubble.textContent=bhAbsorbQuote;
            bubbleShowTime=ABSORB_DUR+0.5;
          } else {
            bubble.textContent=bhThoughts[bhReactCount];
            bubbleShowTime=BUBBLE_DURATION+1.5;
            bhReactCount++;
          }
          bhInProximity=true;
          bubbleSet=true;
        } else if(!firstBHShown){
          bubble.textContent=bhFirstHint;
          bubbleShowTime=BUBBLE_DURATION+2;
          firstBHShown=true;
          bubbleSet=true;
        }
        if(bubbleSet){
          bubble.classList.add('visible');
          bubbleVisible=true;
        }
      } else if(bhFullyFormed && bhDist<BH_PROXIMITY){
        bhInProxT+=0.016;
        // Force absorption after all warnings used AND 2s of sustained proximity,
        // so user doesn't have to herd the astronaut in/out repeatedly.
        const forceAbsorb=bhReactCount>=bhThoughts.length&&bhInProxT>=2;
        if(!bhInProximity || forceAbsorb){
          if(bhReactCount>=bhThoughts.length){
            astroState='absorbing';
            absorbT=0;
            absorbStartX=curX;
            absorbStartY=curY;
            absorbTgtX=bh.mx-innerWidth/2;
            absorbTgtY=bh.my-innerHeight/2;
            bubble.textContent=bhAbsorbQuote;
            bubble.classList.add('visible');
            bubbleVisible=true;
            bubbleShowTime=ABSORB_DUR+0.5;
            bhInProximity=true;
          } else if(!bhInProximity){
            bubble.textContent=bhThoughts[bhReactCount];
            bubble.classList.add('visible');
            bubbleVisible=true;
            bubbleShowTime=BUBBLE_DURATION+1.5;
            bhReactCount++;
            bhInProximity=true;
          }
        }
      } else {
        bhInProxT=Math.max(0,bhInProxT-0.032);
      }
      if(bhInProximity && bhDist>BH_PROXIMITY*1.6) bhInProximity=false;
      prevBhFullyFormed=bhFullyFormed;
    } else {
      prevBhFullyFormed=false;
    }

    // Thought bubble timing — idle thoughts only in normal state
    bubbleTimer-=0.016;
    if(astroState==='normal' && !bubbleVisible && bubbleTimer<=0){
      bubble.textContent=thoughts[thoughtOrder[thoughtIdx]];
      thoughtIdx++;
      if(thoughtIdx>=thoughtOrder.length){thoughtIdx=0;shuffle(thoughtOrder);}
      bubble.classList.add('visible');
      bubbleVisible=true;
      bubbleShowTime=BUBBLE_DURATION;
    }
    if(bubbleVisible){
      bubbleShowTime-=0.016;
      if(bubbleShowTime<=0){
        bubble.classList.remove('visible');
        bubbleVisible=false;
        bubbleTimer=BUBBLE_PAUSE_MIN+Math.random()*(BUBBLE_PAUSE_MAX-BUBBLE_PAUSE_MIN);
      }
    }

    // cap at 60fps normally, 30fps on weak hardware to keep model-viewer responsive
    setTimeout(()=>requestAnimationFrame(animate),IS_LOW_END?33:16);
  }
  animate();
})();


/* ===== PRELOADER — hide once fonts + first paint + (desktop) astronaut ready ===== */
(function initPreloader(){
  const pre=document.getElementById('preloader');
  if(!pre) return;
  const fill=document.getElementById('preloader-fill');
  const status=document.getElementById('preloader-status');
  let progress=0;
  let hidden=false;

  function setProg(p, msg){
    progress=Math.max(progress,p);
    if(fill) fill.style.setProperty('--p', progress+'%');
    if(msg&&status) status.textContent=msg;
  }
  function hide(){
    if(hidden) return;
    hidden=true;
    setProg(100,'Signal locked');
    setTimeout(()=>{
      pre.classList.add('preloader--gone');
      setTimeout(()=>{pre.remove();},850);
    },400);
  }

  setProg(12,'Booting rogue signal');

  // Fonts
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(()=>setProg(45,'Typography tuned'));
  } else {
    setProg(45,'Typography tuned');
  }

  // First paint ticker
  let paintT=0;
  const paintTick=setInterval(()=>{
    paintT++;
    if(progress<85) setProg(progress+5);
    if(paintT>14) clearInterval(paintTick);
  },180);

  // Astronaut model (desktop only — hidden on mobile)
  const mv=document.getElementById('astronaut-3d');
  let mvReady=IS_MOBILE;
  if(mv&&!IS_MOBILE){
    mv.addEventListener('load',()=>{mvReady=true;setProg(88,'Astronaut awake');},{once:true});
    mv.addEventListener('error',()=>{mvReady=true;},{once:true});
  }

  // Final hide when everything ready or timeout
  const fullLoad=new Promise(res=>{
    if(document.readyState==='complete') res();
    else addEventListener('load',()=>res(),{once:true});
  });

  const astroReady=new Promise(res=>{
    if(mvReady) return res();
    const chk=setInterval(()=>{if(mvReady){clearInterval(chk);res();}},120);
    setTimeout(()=>{clearInterval(chk);res();},4500);
  });

  Promise.all([fullLoad,astroReady]).then(()=>{
    setProg(95,'Signal locked');
    setTimeout(hide,350);
  });

  // Hard timeout — never keep the user waiting > 6s
  setTimeout(hide,6500);
})();

/* ===== SCROLL REVEALS — IntersectionObserver ===== */
(function initReveals(){
  const els=document.querySelectorAll('.reveal');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(e=>e.classList.add('reveal--visible'));
    return;
  }
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('reveal--visible');
        io.unobserve(en.target);
      }
    });
  },{threshold:0.01,rootMargin:'0px 0px -40px 0px'});
  els.forEach(e=>io.observe(e));
  // Safety net — any .reveal already inside the viewport at load gets shown immediately,
  // in case IO is slow or the element is too small to pass its own threshold.
  requestAnimationFrame(()=>{
    els.forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.top<innerHeight && r.bottom>0) e.classList.add('reveal--visible');
    });
  });
})();

/* ===== SOUND SYSTEM — WebAudio BH formation + absorption ===== */
(function initSounds(){
  const btn=document.getElementById('sound-toggle');
  if(!btn) return;
  // Sound always starts OFF on every page load — no localStorage persistence.
  // User must opt in each session (also satisfies browser autoplay policy).
  let enabled=false;
  let ctx=null;
  let master=null;
  let bhOscOn=false;
  let bhNodes=null;   // { sub, low1, low2, whine, noise, sweep, outGain, lfo, lfoGain }

  function applyBtn(){
    btn.setAttribute('aria-pressed',enabled?'true':'false');
  }
  applyBtn();

  function ensureCtx(){
    if(ctx) return ctx;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return null;
      ctx=new AC();
      master=ctx.createGain();
      master.gain.value=0.35;
      master.connect(ctx.destination);
    }catch(e){ctx=null;}
    return ctx;
  }

  // Interstellar engine ignition — layered drone: sub-bass rumble + detuned low sawtooths
  // (beating) + band-passed noise turbulence + rising filtered whine + slow LFO pitch wobble
  function startBHDrone(){
    const c=ensureCtx(); if(!c||!enabled||bhOscOn) return;
    if(c.state==='suspended') c.resume();
    const t0=c.currentTime;

    const outGain=c.createGain(); outGain.gain.value=0; outGain.connect(master);

    // Sub-bass core rumble
    const sub=c.createOscillator();
    sub.type='sine'; sub.frequency.value=34;
    const subG=c.createGain(); subG.gain.value=0.55;
    sub.connect(subG); subG.connect(outGain);

    // Two slightly detuned low sawtooths — beating makes it feel alive
    const low1=c.createOscillator();
    const low2=c.createOscillator();
    low1.type='sawtooth'; low2.type='sawtooth';
    low1.frequency.value=82; low2.frequency.value=84.2;
    const lowFilter=c.createBiquadFilter();
    lowFilter.type='lowpass'; lowFilter.frequency.value=260; lowFilter.Q.value=4;
    const lowG=c.createGain(); lowG.gain.value=0.22;
    low1.connect(lowFilter); low2.connect(lowFilter);
    lowFilter.connect(lowG); lowG.connect(outGain);

    // Rising filtered whine — the "drive spinning up" shimmer on top
    const whine=c.createOscillator();
    whine.type='sawtooth'; whine.frequency.value=210;
    const whineFilter=c.createBiquadFilter();
    whineFilter.type='bandpass'; whineFilter.frequency.value=900; whineFilter.Q.value=3.2;
    const whineG=c.createGain(); whineG.gain.value=0.08;
    whine.connect(whineFilter); whineFilter.connect(whineG); whineG.connect(outGain);

    // Turbulence noise — filtered pink-ish bursts
    const bufSize=c.sampleRate*3;
    const noiseBuf=c.createBuffer(1,bufSize,c.sampleRate);
    const nd=noiseBuf.getChannelData(0);
    let b0=0,b1=0,b2=0;
    for(let i=0;i<bufSize;i++){
      const w=Math.random()*2-1;
      b0=0.99765*b0+w*0.0990460;
      b1=0.96300*b1+w*0.2965164;
      b2=0.57000*b2+w*1.0526913;
      nd[i]=(b0+b1+b2+w*0.1848)*0.12;
    }
    const noise=c.createBufferSource();
    noise.buffer=noiseBuf; noise.loop=true;
    const noiseFilter=c.createBiquadFilter();
    noiseFilter.type='bandpass'; noiseFilter.frequency.value=1400; noiseFilter.Q.value=1.3;
    const noiseG=c.createGain(); noiseG.gain.value=0.15;
    noise.connect(noiseFilter); noiseFilter.connect(noiseG); noiseG.connect(outGain);

    // Master warm-up filter sweep — ignition character
    const sweep=c.createBiquadFilter();
    sweep.type='lowpass'; sweep.Q.value=1.2;
    sweep.frequency.setValueAtTime(180,t0);
    sweep.frequency.exponentialRampToValueAtTime(2600,t0+0.95);
    // Insert sweep inline: outGain → sweep → master
    outGain.disconnect();
    outGain.connect(sweep);
    sweep.connect(master);

    // Slow LFO wobble on whine pitch for "drive humming"
    const lfo=c.createOscillator();
    lfo.type='sine'; lfo.frequency.value=0.33;
    const lfoGain=c.createGain(); lfoGain.gain.value=9;
    lfo.connect(lfoGain); lfoGain.connect(whine.frequency);

    // Start everything
    sub.start(t0); low1.start(t0); low2.start(t0);
    whine.start(t0); noise.start(t0); lfo.start(t0);

    // Whine pitch slowly rises as engine "spins up"
    whine.frequency.setValueAtTime(180,t0);
    whine.frequency.exponentialRampToValueAtTime(520,t0+1.0);

    // Attack envelope — drone peaks exactly when the balloon inflation ends (0.85s),
    // so the sphere-creation sound flows seamlessly into the drone with no gap.
    outGain.gain.setValueAtTime(0.0001,t0);
    outGain.gain.exponentialRampToValueAtTime(0.42,t0+0.85);

    // Sphere inflation — like blowing up a balloon. Filtered air-rush noise
    // with rising cutoff + sine undertone rising in pitch (pressure buildup).
    // Duration ~0.85s, synced with BH appearance.
    const dur=0.85;
    // 1) Air-rush noise
    const airBuf=c.createBuffer(1,c.sampleRate*(dur+0.1),c.sampleRate);
    const ad=airBuf.getChannelData(0);
    for(let i=0;i<ad.length;i++) ad[i]=(Math.random()*2-1);
    const air=c.createBufferSource(); air.buffer=airBuf;
    const airFilter=c.createBiquadFilter();
    airFilter.type='bandpass'; airFilter.Q.value=1.1;
    airFilter.frequency.setValueAtTime(250,t0);
    airFilter.frequency.exponentialRampToValueAtTime(1400,t0+dur*0.75);
    airFilter.frequency.exponentialRampToValueAtTime(800,t0+dur);
    const airG=c.createGain();
    airG.gain.setValueAtTime(0.0001,t0);
    airG.gain.exponentialRampToValueAtTime(0.28,t0+0.15);
    airG.gain.setValueAtTime(0.28,t0+dur*0.75);
    airG.gain.exponentialRampToValueAtTime(0.0001,t0+dur+0.25); // tail overlaps drone ramp
    air.connect(airFilter); airFilter.connect(airG); airG.connect(master);
    air.start(t0); air.stop(t0+dur+0.3);

    // 2) Sine undertone — pressure pitch rising (balloon stretching), its fade
    // overlaps the drone's attack so there's no audible seam between them.
    const pres=c.createOscillator();
    const presG=c.createGain();
    pres.type='sine';
    pres.frequency.setValueAtTime(70,t0);
    pres.frequency.exponentialRampToValueAtTime(260,t0+dur*0.8);
    pres.frequency.exponentialRampToValueAtTime(84,t0+dur+0.25); // glide into drone's low pitch
    presG.gain.setValueAtTime(0.0001,t0);
    presG.gain.exponentialRampToValueAtTime(0.22,t0+0.2);
    presG.gain.setValueAtTime(0.22,t0+dur*0.75);
    presG.gain.exponentialRampToValueAtTime(0.0001,t0+dur+0.3); // tail overlaps drone crescendo
    pres.connect(presG); presG.connect(master);
    pres.start(t0); pres.stop(t0+dur+0.35);

    // 3) Soft squeak at the top — balloon surface tension
    const sq=c.createOscillator();
    const sqG=c.createGain();
    sq.type='triangle';
    sq.frequency.setValueAtTime(820,t0+dur*0.55);
    sq.frequency.exponentialRampToValueAtTime(1280,t0+dur*0.85);
    sqG.gain.setValueAtTime(0.0001,t0+dur*0.55);
    sqG.gain.exponentialRampToValueAtTime(0.08,t0+dur*0.7);
    sqG.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    sq.connect(sqG); sqG.connect(master);
    sq.start(t0+dur*0.55); sq.stop(t0+dur+0.05);

    bhNodes={sub,low1,low2,whine,noise,lfo,outGain,sweep};
    bhOscOn=true;
  }
  function stopBHDrone(){
    if(!bhOscOn||!ctx||!bhNodes) return;
    const c=ctx;
    const t=c.currentTime;
    const n=bhNodes;
    n.outGain.gain.cancelScheduledValues(t);
    n.outGain.gain.setValueAtTime(n.outGain.gain.value,t);
    n.outGain.gain.exponentialRampToValueAtTime(0.0001,t+0.8);
    // Engine spin-down: filter drops, whine pitch drops
    try{
      n.sweep.frequency.cancelScheduledValues(t);
      n.sweep.frequency.setValueAtTime(n.sweep.frequency.value,t);
      n.sweep.frequency.exponentialRampToValueAtTime(120,t+0.9);
      n.whine.frequency.cancelScheduledValues(t);
      n.whine.frequency.setValueAtTime(n.whine.frequency.value,t);
      n.whine.frequency.exponentialRampToValueAtTime(90,t+0.9);
    }catch(e){}
    setTimeout(()=>{
      try{
        n.sub.stop(); n.low1.stop(); n.low2.stop();
        n.whine.stop(); n.noise.stop(); n.lfo.stop();
        n.outGain.disconnect(); n.sweep.disconnect();
      }catch(e){}
    },1000);
    bhOscOn=false; bhNodes=null;
  }

  function playLetterSuck(){
    const c=ensureCtx(); if(!c||!enabled) return;
    if(c.state==='suspended') c.resume();
    const t=c.currentTime;
    const dur=0.75;

    // Sucking air noise — high-frequency rush sweeping DOWN into the black hole
    const buf=c.createBuffer(1,c.sampleRate*(dur+0.1),c.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
    const air=c.createBufferSource(); air.buffer=buf;
    const f=c.createBiquadFilter();
    f.type='bandpass'; f.Q.value=2.2;
    f.frequency.setValueAtTime(2000,t);
    f.frequency.exponentialRampToValueAtTime(220,t+dur);
    const airG=c.createGain();
    airG.gain.setValueAtTime(0.0001,t);
    airG.gain.exponentialRampToValueAtTime(0.11,t+0.09);
    airG.gain.setValueAtTime(0.11,t+dur*0.55);
    airG.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    air.connect(f); f.connect(airG); airG.connect(master);
    air.start(t); air.stop(t+dur+0.05);

    // Sine undertone gliding DOWN — object being pulled into the abyss
    const p=c.createOscillator();
    const pg=c.createGain();
    p.type='sine';
    p.frequency.setValueAtTime(340,t);
    p.frequency.exponentialRampToValueAtTime(60,t+dur);
    pg.gain.setValueAtTime(0.0001,t);
    pg.gain.exponentialRampToValueAtTime(0.08,t+0.12);
    pg.gain.setValueAtTime(0.08,t+dur*0.5);
    pg.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    p.connect(pg); pg.connect(master);
    p.start(t); p.stop(t+dur+0.05);
  }

  function playAbsorbBoom(){
    const c=ensureCtx(); if(!c||!enabled) return;
    if(c.state==='suspended') c.resume();
    const t=c.currentTime;
    const osc=c.createOscillator();
    const g=c.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(180,t);
    osc.frequency.exponentialRampToValueAtTime(28,t+1.3);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.45,t+0.08);
    g.gain.exponentialRampToValueAtTime(0.0001,t+1.5);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t+1.55);
    // shimmer
    const noise=c.createBufferSource();
    const buf=c.createBuffer(1,c.sampleRate*0.6,c.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    noise.buffer=buf;
    const ng=c.createGain();
    ng.gain.setValueAtTime(0.14,t);
    ng.gain.exponentialRampToValueAtTime(0.0001,t+0.55);
    noise.connect(ng); ng.connect(master);
    noise.start(t); noise.stop(t+0.6);
  }

  btn.addEventListener('click',()=>{
    enabled=!enabled;
    applyBtn();
    if(enabled){
      ensureCtx();
      if(ctx&&ctx.state==='suspended') ctx.resume();
    } else {
      stopBHDrone();
    }
  });

  // Expose for astronaut/letters modules
  window.__sfx={
    onBHFormed(){ if(enabled) startBHDrone(); },
    onBHGone(){ stopBHDrone(); },
    onLetterSucked: playLetterSuck,
    onAbsorbed: playAbsorbBoom,
    isEnabled(){ return enabled; }
  };

  // Watch window.__bh to auto-start/stop drone
  let wasActive=false;
  let hintedBH=false; // resets every page load — always show hint once per session
  setInterval(()=>{
    const bh=window.__bh;
    const active=!!(bh&&bh.active&&bh.str>0.3);
    if(active&&!wasActive){
      window.__sfx.onBHFormed();
      if(!enabled&&!hintedBH){
        hintedBH=true;
        btn.classList.add('sound-toggle--hint');
        setTimeout(()=>btn.classList.remove('sound-toggle--hint'),6800);
      }
    }
    if(!active&&wasActive) window.__sfx.onBHGone();
    wasActive=active;
  },100);
})();

/* ===== CUSTOM CURSOR — desktop only, hides when BH forms ===== */
(function initCursor(){
  if(!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const c=document.getElementById('cursor');
  if(!c) return;
  // Belt-and-suspenders: inline cursor:none on root + body (on top of the CSS media query
  // that already kills cursor everywhere). Inline style beats anything the browser or a
  // shadow DOM could try to apply.
  document.documentElement.style.cursor='none';
  document.body.style.cursor='none';
  // Also sweep any element that has inline cursor set
  document.querySelectorAll('*').forEach(el=>{
    if(el.style&&el.style.cursor&&el.style.cursor!=='none') el.style.cursor='none';
  });
  let tx=-100,ty=-100,cx=-100,cy=-100;
  let insideWindow=true;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;insideWindow=true;c.classList.remove('cursor--hidden');});
  // When pointer leaves the document root, hide the custom cursor completely
  document.documentElement.addEventListener('pointerleave',()=>{
    insideWindow=false;
    c.classList.add('cursor--hidden');
  });
  document.documentElement.addEventListener('pointerenter',()=>{
    insideWindow=true;
    if(!bhOn) c.classList.remove('cursor--hidden');
  });
  // Blur (alt-tab) → cursor gone; focus → will be shown on next pointermove
  addEventListener('blur',()=>{insideWindow=false;c.classList.add('cursor--hidden');});

  const hoverSel='a,button,input,textarea,.galaxy,[role="button"]';
  addEventListener('pointerover',e=>{
    if(e.target&&e.target.closest&&e.target.closest(hoverSel)) c.classList.add('cursor--hover');
  },true);
  addEventListener('pointerout',e=>{
    if(e.target&&e.target.closest&&e.target.closest(hoverSel)) c.classList.remove('cursor--hover');
  },true);

  let bhOn=false;
  function tick(){
    cx+=(tx-cx)*0.45;
    cy+=(ty-cy)*0.45;
    c.style.transform='translate('+cx+'px,'+cy+'px)';
    const bh=window.__bh;
    const now=!!(bh&&bh.active&&bh.str>0.25);
    if(now&&!bhOn){c.classList.add('cursor--hidden');bhOn=true;}
    if(!now&&bhOn&&insideWindow){c.classList.remove('cursor--hidden');bhOn=false;}
    else if(!now) bhOn=false;
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ===== ABSORBED COUNTER — persistent via localStorage ===== */
(function initAbsCounter(){
  const el=document.querySelector('.abs-counter');
  const n=document.getElementById('abs-counter-n');
  if(!el||!n) return;
  const KEY='rs69_absorbed_v1';
  let count=parseInt(localStorage.getItem(KEY)||'0',10)||0;
  function render(){ n.textContent=count; }
  render();
  setTimeout(()=>el.classList.add('abs-counter--visible'),1200);

  window.__absCounter={
    bump(){
      count++;
      localStorage.setItem(KEY,String(count));
      render();
      el.classList.remove('abs-counter--flash');
      void el.offsetWidth;
      el.classList.add('abs-counter--flash');
    },
    get(){ return count; }
  };
})();

/* ===== CONTACT FORM — POST to /api/contact ===== */
(function initContactForm(){
  const form=document.getElementById('contact-form');
  if(!form) return;
  const status=form.querySelector('.contact-form__status');
  const submit=form.querySelector('.contact-form__submit');

  form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const data=new FormData(form);
    const payload={
      name:(data.get('name')||'').toString().trim(),
      email:(data.get('email')||'').toString().trim(),
      message:(data.get('message')||'').toString().trim(),
      website:(data.get('website')||'').toString().trim()
    };
    if(payload.website) return; // honeypot tripped
    if(!payload.name||!payload.email||!payload.message){
      status.textContent='Please fill in all fields.';
      status.className='contact-form__status contact-form__status--err';
      return;
    }
    submit.disabled=true;
    status.textContent='Transmitting...';
    status.className='contact-form__status';
    try{
      const res=await fetch('/api/contact',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('net');
      status.textContent='Signal received. I\u2019ll reply soon.';
      status.className='contact-form__status contact-form__status--ok';
      form.reset();
    }catch(err){
      status.textContent='Transmission failed. Try again or email shvts69@gmail.com.';
      status.className='contact-form__status contact-form__status--err';
    }finally{
      submit.disabled=false;
    }
  });
})();

/* ===== 11. RS69 ORBIT PLANET — depth-aware (z-index flips when behind/in front of text) ===== */
(function initOrbitPlanet(){
  const mark=document.querySelector('.header__mark');
  const planet=document.querySelector('.orbit-planet');
  if(!mark||!planet) return;

  // Ellipse in SVG viewBox (400x220): center (200,110), rx=165, ry=95, tilted -18°
  const CX=200, CY=110, RX=165, RY=95, VB_W=400, VB_H=220;
  const ROT=-18*Math.PI/180;
  const COS=Math.cos(ROT), SIN=Math.sin(ROT);
  const DUR=6000;
  function svgWidthRatio(){ return innerWidth<=768 ? 1.4 : 1.3; }
  const start=performance.now();

  // Pause the rAF loop when the header is scrolled off-screen — the planet is
  // invisible there anyway, no reason to repaint at 60fps.
  let visible=true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        const wasVisible=visible;
        visible=e.isIntersecting;
        if(visible && !wasVisible) requestAnimationFrame(tick);
      });
    },{rootMargin:'50px'}).observe(mark);
  }

  function tick(now){
    const t=((now-start)%DUR)/DUR;
    const a=t*Math.PI*2;
    const ex=RX*Math.cos(a), ey=RY*Math.sin(a);
    const pxVB=CX+ex*COS-ey*SIN;
    const pyVB=CY+ex*SIN+ey*COS;

    const markW=mark.offsetWidth;
    const k=markW*svgWidthRatio()/VB_W;
    const dx=(pxVB-CX)*k;
    const dy=(pyVB-CY)*k;

    planet.style.transform='translate('+dx+'px,'+dy+'px)';
    planet.style.zIndex=(pyVB<CY)?'0':'2';

    if(visible) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ===== EMAIL FALLBACK — Windows laptops often have no mail client for mailto:,
   so the icon appears dead. Open Gmail compose + copy address + show toast. ===== */
(function initEmailFallback(){
  const links=document.querySelectorAll('a[href^="mailto:"]');
  if(!links.length) return;

  let toast=null, toastTimer=0;
  function showToast(msg){
    if(!toast){
      toast=document.createElement('div');
      toast.className='rs69-toast';
      toast.setAttribute('role','status');
      toast.setAttribute('aria-live','polite');
      document.body.appendChild(toast);
    }
    toast.textContent=msg;
    toast.classList.add('rs69-toast--visible');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{toast.classList.remove('rs69-toast--visible');},2800);
  }

  function copyEmail(email){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(email).catch(()=>false);
    }
    try{
      const ta=document.createElement('textarea');
      ta.value=email; ta.style.position='fixed'; ta.style.left='-9999px';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      return Promise.resolve(true);
    }catch(_){return Promise.resolve(false);}
  }

  links.forEach(a=>{
    a.addEventListener('click',(e)=>{
      const href=a.getAttribute('href')||'';
      const email=href.replace(/^mailto:/i,'').split('?')[0].trim();
      if(!email) return;
      e.preventDefault();
      const gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(email);
      window.open(gmail,'_blank','noopener');
      copyEmail(email).then(()=>showToast('Gmail opened — '+email+' copied'));
    });
  });
})();
