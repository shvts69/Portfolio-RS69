/* =============================================================
   ROSS PORTFOLIO — LIVING COSMOS v6
   Volumetric WebGL nebula + storm galaxies + black-hole cursor
   ============================================================= */

/* ===== 1. WEBGL HELIX NEBULA (Eye of God) ===== */
(function initNebula() {
  const canvas = document.getElementById('nebula-canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize(); addEventListener('resize', resize);

  const vSrc = `attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;

  const fSrc = `
  precision highp float;
  uniform float u_t;
  uniform vec2 u_r;

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
    float t=u_t*0.038;

    // === Eye center — dramatic drift ===
    vec2 center=vec2(0.06*sin(t*0.4)+0.025*cos(t*0.75)+0.015*sin(t*1.1),-0.02+0.04*cos(t*0.3)+0.018*sin(t*0.6)+0.01*cos(t*0.95));
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
    float ringR=0.22+0.04*sin(ang*3.0+t*1.8)+0.03*cos(ang*5.0-t*2.2)+0.02*sin(ang*7.0+t*1.3)+0.012*cos(ang*11.0-t*0.7);
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
    float haloMask=smoothstep(0.55,0.18,dist)*smoothstep(0.0,0.1,dist);
    haloMask*=(1.0-ringMask*0.8); // don't cover the ring
    float haloDetail=fbm(uvA*6.0+q*1.5+t*0.2);
    vec3 haloCol=mix(darkCrimson,deepRed,haloDetail);
    haloCol=mix(haloCol,hotOrange*0.3,outerGlow); // orange tint near ring
    col+=haloCol*haloMask*(0.2+0.5*haloDetail)*0.45;

    // 3. RED TENDRILS — wispy outer filaments
    float outerTendrils=fbm(vec2(ang*4.0,dist*6.0)+t*0.5);
    float tendrilMask=smoothstep(0.55,0.14,dist)*smoothstep(0.03,0.1,dist);
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
    float farGlow=smoothstep(0.65,0.12,dist)*0.06;
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
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();


/* ===== 2. STARS + BLACK HOLE CURSOR + SPARKLE TRAIL ===== */
(function initStars(){
  const c=document.getElementById('stars-canvas');
  const ctx=c.getContext('2d');
  let stars=[];const N=1100;
  const PAL=[[255,255,255],[167,139,250],[96,165,250],[251,191,146],[196,181,253]];
  let mx=-999,my=-999,pmx=-999,pmy=-999,mouseStill=0;
  const PUSH_R=80,PUSH_F=1.8;
  const VORTEX_R=200,VORTEX_F=0.45,VORTEX_TH=25;
  const sparkles=[];const MAX_SP=50;let spT=0;

  // Accretion disk particles — orbit the black hole
  const diskParts=[];const MAX_DISK=500;
  let bhPhase=0;

  // Track if cursor is over a galaxy CANVAS (not the text area)
  let overGalaxy=false;
  document.querySelectorAll('.galaxy__orbit').forEach(g=>{
    g.addEventListener('mouseenter',()=>{overGalaxy=true;});
    g.addEventListener('mouseleave',()=>{overGalaxy=false;});
  });

  document.addEventListener('mousemove',(e)=>{pmx=mx;pmy=my;mx=e.clientX;my=e.clientY;mouseStill=0;});
  document.addEventListener('mouseleave',()=>{mx=-999;my=-999;mouseStill=0;});
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

  // Spawn accretion disk particles — wide horizontal orbits for stretched look
  function spawnDisk(vStr){
    if(diskParts.length>=MAX_DISK)return;
    const count=Math.floor(5+vStr*10);
    for(let i=0;i<count;i++){
      if(diskParts.length>=MAX_DISK)break;
      const ang=Math.random()*Math.PI*2;
      const orbitR=18+Math.random()*85; // wider range for stretched edges
      const speed=0.012+0.04*(1-orbitR/103);
      const t=orbitR/103;
      // inner = white-hot, outer = purple/dim
      const r=Math.floor(210+45*(1-t));
      const g=Math.floor(170+85*(1-t));
      const b=255;
      diskParts.push({
        ang, orbitR, speed,
        life:1, decay:0.003+Math.random()*0.005,
        width:0.8+Math.random()*3.5*(1-t),
        len:3+Math.random()*16*(1-t), // longer streaks = more stretched look
        col:[r,g,b],
        brightness:0.3+0.7*(1-t),
      });
    }
  }

  const DISK_TILT=0.35;

  function drawBlackHole(vStr){
    if(vStr<0.05)return;

    const sz=vStr;
    const EVENT_R=22*sz;

    // --- ALL DISK PARTICLES — they create the entire disk shape ---
    ctx.globalCompositeOperation='lighter';

    // back half (behind black hole)
    for(const p of diskParts){
      if(Math.sin(p.ang)<=0)continue;
      const px=Math.cos(p.ang)*p.orbitR*sz;
      const py=Math.sin(p.ang)*p.orbitR*sz*DISK_TILT;
      const sx=mx+px,sy=my+py;
      const a=p.brightness*p.life*sz*0.5;
      const tx=-Math.sin(p.ang)*p.len*sz;
      const ty=Math.cos(p.ang)*p.len*sz*DISK_TILT;
      ctx.strokeStyle=`rgba(${p.col[0]},${p.col[1]},${p.col[2]},${a})`;
      ctx.lineWidth=p.width*sz;
      ctx.beginPath();ctx.moveTo(sx-tx*0.5,sy-ty*0.5);ctx.lineTo(sx+tx*0.5,sy+ty*0.5);ctx.stroke();
    }

    // --- EVENT HORIZON — pitch black center ---
    ctx.globalCompositeOperation='source-over';
    const bhG=ctx.createRadialGradient(mx,my,0,mx,my,EVENT_R*2.2);
    bhG.addColorStop(0,`rgba(0,0,0,${0.98*sz})`);
    bhG.addColorStop(0.35,`rgba(0,0,0,${0.95*sz})`);
    bhG.addColorStop(0.6,`rgba(0,0,0,${0.6*sz})`);
    bhG.addColorStop(0.85,`rgba(0,0,0,${0.15*sz})`);
    bhG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bhG;ctx.beginPath();ctx.arc(mx,my,EVENT_R*2.2,0,Math.PI*2);ctx.fill();

    // front half (in front of black hole — brighter)
    ctx.globalCompositeOperation='lighter';
    for(const p of diskParts){
      if(Math.sin(p.ang)>0)continue;
      const px=Math.cos(p.ang)*p.orbitR*sz;
      const py=Math.sin(p.ang)*p.orbitR*sz*DISK_TILT;
      const sx=mx+px,sy=my+py;
      const a=p.brightness*p.life*sz;
      const tx=-Math.sin(p.ang)*p.len*sz;
      const ty=Math.cos(p.ang)*p.len*sz*DISK_TILT;
      ctx.strokeStyle=`rgba(${p.col[0]},${p.col[1]},${p.col[2]},${a})`;
      ctx.lineWidth=p.width*sz;
      ctx.beginPath();ctx.moveTo(sx-tx*0.5,sy-ty*0.5);ctx.lineTo(sx+tx*0.5,sy+ty*0.5);ctx.stroke();
    }

    ctx.globalCompositeOperation='source-over';
  }

  // === SHOOTING STARS — realistic meteors ===
  const shooters=[];
  let shootNext=50+Math.random()*140; // frames until next shooting star
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
    const vStr=isV?Math.min((mouseStill-VORTEX_TH)/40,1):0;

    // spawn & update accretion disk particles
    if(isV&&vStr>0.1){spawnDisk(vStr);}
    for(let i=diskParts.length-1;i>=0;i--){
      const p=diskParts[i];
      p.ang+=p.speed*vStr;
      p.life-=p.decay*(isV?1:5); // fade fast when mouse moves
      if(p.life<=0){diskParts.splice(i,1);}
    }

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
          // stars very close get brighter and stretched
          if(dist<60*vStr){s.a=Math.min(s.a+0.08*vStr,1);}
        }
      }
      const homeF=isV?0.001:0.006;
      s.vx+=(s.homeX-s.x)*homeF;s.vy+=(s.homeY-s.y)*homeF;
      s.vx*=0.95;s.vy*=0.95;s.x+=s.vx;s.y+=s.vy;

      // near black hole: draw as streak instead of dot
      const toBH=isV?Math.hypot(s.x-mx,s.y-my):9999;
      if(isV&&toBH<80*vStr&&toBH>3){
        // streak tangent to orbit
        const speed=Math.hypot(s.vx,s.vy);
        const streakLen=Math.min(speed*4,15)*vStr;
        if(streakLen>1){
          const ndx=s.vx/(speed||1),ndy=s.vy/(speed||1);
          ctx.strokeStyle=`rgba(${s.cl[0]},${s.cl[1]},${s.cl[2]},${s.a})`;
          ctx.lineWidth=s.r*0.8;
          ctx.beginPath();ctx.moveTo(s.x-ndx*streakLen,s.y-ndy*streakLen);ctx.lineTo(s.x,s.y);ctx.stroke();
          continue;
        }
      }
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${s.cl[0]},${s.cl[1]},${s.cl[2]},${s.a})`;ctx.fill();
      if(s.r>1){ctx.beginPath();ctx.arc(s.x,s.y,s.r*2.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(${s.cl[0]},${s.cl[1]},${s.cl[2]},${s.a*0.1})`;ctx.fill();}
    }

    // draw black hole accretion disk
    drawBlackHole(vStr);

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
      shootNext=70+Math.random()*230; // 1.2–5 seconds between meteors
    }
    drawShooters();

    requestAnimationFrame(draw);
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
  section.addEventListener('mouseenter',()=>{isHov=true;});
  section.addEventListener('mouseleave',()=>{isHov=false;});

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

  // NEBULA CLOUDS — large glowing regions within the galaxy
  const nebClouds=[];
  for(let i=0;i<70;i++){
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

  // dust lane 35
  for(let i=0;i<35;i++){const dist=0.08+Math.random()*0.8;
    dustLane.push({dist,angle:Math.random()*Math.PI*2,sizeX:30+Math.random()*65,sizeY:3+Math.random()*10,opacity:0.05+Math.random()*0.07,orbSpd:0.00005*(1+0.3/(dist+0.1))});}
  // dust back 85
  for(let i=0;i<85;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=0.03+Math.random()*0.92;
    dustBack.push({dist,angle:armA+dist*5.0+(Math.random()-0.5)*0.7,size:22+Math.random()*65,opacity:0.018+Math.random()*0.035,colorMix:Math.random(),pulseSpd:0.003+Math.random()*0.007,pulsePh:Math.random()*Math.PI*2,orbSpd:0.00006*(1+0.3/(dist+0.1))});}
  // bg stars 8000
  for(let i=0;i<8000;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=Math.pow(Math.random(),0.42)*0.96;
    const spiral=armA+dist*5.0+(Math.random()-0.5)*(0.85-dist*0.4);
    const zOff=(Math.random()-0.5)*(1-dist*0.5)*0.11;
    const t=dist;let c=t<0.08?T.core:t<0.2?T.bright:t<0.5?T.mid:T.dark;
    bgStars.push({dist,angle:spiral,zOff,r:0.2+Math.random()*0.7,c,alpha:0.25+Math.random()*0.55});}
  // mid stars 2500
  for(let i=0;i<2500;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=Math.pow(Math.random(),0.48)*0.92;
    const spiral=armA+dist*4.8+(Math.random()-0.5)*0.6;
    const zOff=(Math.random()-0.5)*(1-dist*0.4)*0.1;
    const t=dist;let c=t<0.12?T.core:t<0.35?T.bright:T.mid;
    midStars.push({dist,angle:spiral,zOff,r:0.4+Math.random()*1.1,c,baseA:0.4+Math.random()*0.5,twSpd:0.005+Math.random()*0.018,twPh:Math.random()*Math.PI*2,orbSpd:0.00012*(1+0.2/(dist+0.1))});}
  // bright 300
  for(let i=0;i<300;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=Math.pow(Math.random(),0.5)*0.85;
    const spiral=armA+dist*4.5+(Math.random()-0.5)*0.45;const zOff=(Math.random()-0.5)*0.05;
    let c=dist<0.15?T.core:T.bright;
    brightStars.push({dist,angle:spiral,zOff,r:1.0+Math.random()*2.4,c,baseA:0.6+Math.random()*0.4,twSpd:0.007+Math.random()*0.02,twPh:Math.random()*Math.PI*2,orbSpd:0.00018*(1+0.2/(dist+0.1)),halo:5+Math.random()*16});}
  // cloud puffs 55
  for(let i=0;i<55;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=0.03+Math.random()*0.8;
    cloudsFront.push({dist,angle:armA+dist*5.0+(Math.random()-0.5)*0.55,sizeX:22+Math.random()*55,sizeY:9+Math.random()*24,opacity:0.02+Math.random()*0.04,pulseSpd:0.003+Math.random()*0.008,pulsePh:Math.random()*Math.PI*2,orbSpd:0.00007*(1+0.2/(dist+0.1))});}
  // rays 28
  for(let i=0;i<28;i++){rays.push({angle:(i/28)*Math.PI*2+(Math.random()-0.5)*0.3,length:55+Math.random()*180,width:1+Math.random()*4.5,pulseSpd:0.004+Math.random()*0.01,pulsePh:Math.random()*Math.PI*2,rotSpd:0.00008+Math.random()*0.00015});}
  // hotspots 30
  for(let i=0;i<30;i++){const arm=i%4,armA=(arm/4)*Math.PI*2,dist=0.08+Math.random()*0.65;
    hotspots.push({dist,angle:armA+dist*4.5+(Math.random()-0.5)*0.3,radius:6+Math.random()*18,pulseSpd:0.005+Math.random()*0.012,pulsePh:Math.random()*Math.PI*2,orbSpd:0.0001*(1+0.2/(dist+0.1))});}

  let time=Math.random()*10000;
  const rot={a:0,spd:0.00025};

  function proj(dist,angle,zOff){
    const r=dist*RX;return[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r*TILT+(zOff||0)*RX];
  }

  function draw(){
    time++;
    const tgtSpd=isHov?0.0012:0.00025; // slightly less than before
    rot.spd+=(tgtSpd-rot.spd)*0.03;rot.a+=rot.spd;

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
    requestAnimationFrame(draw);
  }
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

/* ===== 6. CLICK ===== */
gS.forEach((g)=>{g.addEventListener('click',()=>{const u=g.dataset.url;if(!u)return;
  g.style.transition='transform 0.6s,opacity 0.6s';g.style.transform='scale(1.1)';g.style.opacity='0.5';
  setTimeout(()=>{window.open(u,'_blank');g.style.transform='';g.style.opacity='';
    setTimeout(()=>{g.style.transition='';},600);},400);});});

/* ===== 7. PARALLAX ===== */
let mX2=0,mY2=0,tX2=0,tY2=0;
document.addEventListener('mousemove',(e)=>{mX2=(e.clientX/innerWidth-0.5)*2;mY2=(e.clientY/innerHeight-0.5)*2;});
function pxL(){tX2+=(mX2-tX2)*0.05;tY2+=(mY2-tY2)*0.05;
  gS.forEach((g,i)=>{const d=(i+1)*8;const o=g.querySelector('.galaxy__orbit');
    if(o)o.style.transform=`translate(${tX2*d}px,${tY2*d}px)`;});requestAnimationFrame(pxL);}
pxL();

/* ===== 8. SCROLL HINT ===== */
const sh=document.querySelector('.scroll-hint');let hid=false;
addEventListener('scroll',()=>{if(!hid&&scrollY>100){hid=true;sh.style.transition='opacity 0.5s';sh.style.opacity='0';}});

/* ===== 9. TEXT BLACK HOLE SUCTION ===== */
(function initTextSuction(){
  // split text into individual letter spans
  const targets=document.querySelectorAll('.header__sub,.header__tagline,.galaxy__name,.galaxy__desc,.galaxy__link,.footer p,.scroll-hint__text');
  const allLetters=[];
  targets.forEach(el=>{
    const text=el.textContent;
    // detect if parent uses background-clip:text (gradient text)
    const cs=getComputedStyle(el);
    const isGradientText=(cs.webkitTextFillColor==='transparent'||cs.webkitTextFillColor==='rgba(0, 0, 0, 0)');
    el.textContent='';
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
      span._oy=0;
      span._vx=0;span._vy=0; // velocity
      span._sucked=false;
      span._isSpace=(ch===' ');
      span._gradientText=isGradientText;
      el.appendChild(span);
      if(!span._isSpace) allLetters.push(span);
    }
  });

  let bmx=-999,bmy=-999,bStill=0;
  const BH_TH=25;
  const SUCK_R=100;   // only very close letters get sucked
  const PULL_STR=2.5;  // strong pull — real suction

  document.addEventListener('mousemove',(e)=>{bmx=e.clientX;bmy=e.clientY;bStill=0;});
  document.addEventListener('mouseleave',()=>{bmx=-999;bmy=-999;bStill=0;});

  // block on galaxy canvas only
  let overOrbit=false;
  document.querySelectorAll('.galaxy__orbit').forEach(g=>{
    g.addEventListener('mouseenter',()=>{overOrbit=true;});
    g.addEventListener('mouseleave',()=>{overOrbit=false;});
  });

  let returnTimer=0; // frames since BH turned off

  function tick(){
    bStill++;
    const bhOn=bStill>BH_TH&&bmx>0&&!overOrbit;

    if(!bhOn) returnTimer++; else returnTimer=0;

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
        // get letter HOME position (without current offset)
        const rect=sp.getBoundingClientRect();
        const homeCx=rect.left+rect.width/2-sp._ox;
        const homeCy=rect.top+rect.height/2-sp._oy;
        const dx=bmx-homeCx,dy=bmy-homeCy;
        const homeDist=Math.hypot(dx,dy);

        if(homeDist<SUCK_R){
          if(!sp._sucked){
            sp._sucked=true;
            sp._orbiting=false;
            sp._orbAngle=Math.atan2(dy,dx)+Math.PI; // angle from BH
            sp._orbR=homeDist; // start orbit at current distance
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

        // distance from letter's CURRENT position to BH center
        const rect2=sp.getBoundingClientRect();
        const curCx2=rect2.left+rect2.width/2;
        const curCy2=rect2.top+rect2.height/2;
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
    requestAnimationFrame(tick);
  }
  tick();
})();


/* ===== 10. FLOATING ASTRONAUT — 3D GLB model via <model-viewer> ===== */
(function initAstronaut3D(){
  const mv=document.getElementById('astronaut-3d');
  if(!mv) return;

  let t=Math.random()*10000;

  // Scroll physics
  let prevScrollY=0,scrollPush=0,scrollPushVel=0;
  addEventListener('scroll',()=>{
    const nv=scrollY-prevScrollY;
    prevScrollY=scrollY;
    scrollPushVel+=nv*2.5;
  });

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
    "Do aliens have LinkedIn?",
    "Floating is my cardio",
    "Plot twist: I'm the UFO",
    "Ctrl+Z my launch",
    "WiFi signal: 0 bars",
    "Dear diary: still floating",
    "My rent is still due up here",
    "Technically I'm falling forever",
    "Note to self: pack more snacks",
    "Is it Monday on Earth?",
    "Who is this Ross guy anyway?",
    "Why am I guarding his portfolio?",
    "He builds sites, I float. Fair deal",
    "This site has more effects than NASA",
    "Ross made me. I didn't ask for this",
    "3 projects? Rookie numbers, Ross",
    "Why are there letters floating in space?",
    "These galaxies are just links. I checked",
    "I get no salary for this",
    "At least his CSS is clean"
  ];
  let thoughtOrder=thoughts.map((_,i)=>i);
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*i+1|0;[a[i],a[j]]=[a[j],a[i]];}}
  shuffle(thoughtOrder);
  let thoughtIdx=0;

  const bubble=document.createElement('div');
  bubble.className='astro-thought';
  document.body.appendChild(bubble);

  let bubbleTimer=3+Math.random()*3; // first thought in 3-6s
  let bubbleVisible=false;
  let bubbleShowTime=0;
  const BUBBLE_DURATION=3;
  const BUBBLE_PAUSE_MIN=4;
  const BUBBLE_PAUSE_MAX=9;

  function animate(){
    t+=0.016;

    scrollPush+=scrollPushVel*0.3;
    scrollPushVel*=0.85;
    scrollPush*=0.97;

    // Waypoint drift — smooth travel between positions
    wpT+=0.016;
    if(wpT>=wpDur){
      wp=nextWp;
      nextWp=farPos(wp);
      wpT=0;
      wpDur=6+Math.random()*4;
    }
    const progress=wpT/wpDur;
    // Smooth ease in-out
    const ease=progress<0.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
    const baseX=wp.x+(nextWp.x-wp.x)*ease;
    const baseY=wp.y+(nextWp.y-wp.y)*ease;

    // Add Lissajous micro-drift on top
    const driftX=Math.sin(t*0.055)*innerWidth*0.04+Math.cos(t*0.025)*innerWidth*0.02;
    const driftY=Math.sin(t*0.04+0.5)*innerHeight*0.03+Math.cos(t*0.02)*innerHeight*0.015;

    const targetX=baseX+driftX;
    const targetY=baseY+driftY-scrollPush;
    entryT+=0.016;
    const entryEase=Math.min(1,entryT/2.8);
    const lerp=0.015+(0.085-0.015)*(1-entryEase);
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
    mv.style.transform='translate('+curX+'px,'+curY+'px) rotateX('+tiltX+'deg) rotateY('+tiltY+'deg) rotateZ('+tiltZ+'deg)';

    // Thought bubble position — follows astronaut, offset up-right
    const screenX=innerWidth/2+curX;
    const screenY=innerHeight/2+curY;
    bubble.style.left=(screenX+35)+'px';
    bubble.style.top=(screenY-55)+'px';

    // Thought bubble timing
    bubbleTimer-=0.016;
    if(!bubbleVisible && bubbleTimer<=0){
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

    requestAnimationFrame(animate);
  }
  animate();
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

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
