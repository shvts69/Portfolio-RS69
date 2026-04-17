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

