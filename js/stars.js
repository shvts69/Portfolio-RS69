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

