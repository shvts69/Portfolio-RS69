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

