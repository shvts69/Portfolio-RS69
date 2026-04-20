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

  // Waypoint system — astronaut drifts between random screen positions
  function randomPos(){
    return {
      x: (Math.random()-0.5)*innerWidth*0.6,
      y: (Math.random()-0.5)*innerHeight*0.5
    };
  }
  let wp=randomPos(), nextWp=randomPos();
  let wpT=0, wpDur=12+Math.random()*8; // 12-20 seconds per waypoint

  let curX=wp.x, curY=wp.y;

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
  const bhFirstHint="Oh great, a black hole. Hold the cursor still — watch it chew the letters. Just... don't point it at me, alright?";

  // Absorption / return state machine
  let astroState='normal'; // 'normal' | 'absorbing' | 'absorbed' | 'returning'
  let absorbT=0, absorbedT=0, returnT=0;
  let returnStartX=0, returnStartY=0, returnTargetX=0, returnTargetY=0;
  const ABSORB_DUR=2.0;
  const ABSORBED_DELAY=2.5;
  const RETURN_DUR=6.0;

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
          // start from far off-screen right, slight vertical offset
          returnStartX=innerWidth*0.55+Math.random()*innerWidth*0.1;
          returnStartY=(Math.random()-0.5)*innerHeight*0.3;
          returnTargetX=(Math.random()-0.5)*innerWidth*0.3;
          returnTargetY=(Math.random()-0.5)*innerHeight*0.2;
          curX=returnStartX;
          curY=returnStartY;
          mv.style.opacity='1';
          bubble.textContent=bhReturnQuote;
          bubble.classList.add('visible');
          bubbleVisible=true;
          bubbleShowTime=6.5;
        }
      } else {
        absorbedT=0;
      }
      requestAnimationFrame(animate);
      return;
    }

    scrollPush+=scrollPushVel*0.3;
    scrollPushVel*=0.85;
    scrollPush*=0.97;

    let baseX, baseY;

    if(astroState==='returning'){
      returnT+=0.016;
      const p=Math.min(returnT/RETURN_DUR,1);
      const ease=1-Math.pow(1-p,3);
      baseX=returnStartX+(returnTargetX-returnStartX)*ease;
      baseY=returnStartY+(returnTargetY-returnStartY)*ease;
      if(p>=1){
        astroState='normal';
        wp={x:baseX,y:baseY};
        nextWp=randomPos();
        wpT=0;
        wpDur=12+Math.random()*8;
        bhReactCount=0;
        firstBHShown=false;
      }
    } else if(astroState==='absorbing'){
      absorbT+=0.016;
      const bh=window.__bh;
      const bhSX=bh&&bh.mx>0?bh.mx:innerWidth/2;
      const bhSY=bh&&bh.my>0?bh.my:innerHeight/2;
      const tgtX=bhSX-innerWidth/2;
      const tgtY=bhSY-innerHeight/2;
      baseX=curX+(tgtX-curX)*0.08;
      baseY=curY+(tgtY-curY)*0.08;
      if(absorbT>=ABSORB_DUR){
        astroState='absorbed';
        absorbedT=0;
        mv.style.opacity='0';
        bubble.classList.remove('visible');
        bubbleVisible=false;
        requestAnimationFrame(animate);
        return;
      }
    } else {
      // normal: waypoint drift + Lissajous micro-drift
      wpT+=0.016;
      if(wpT>=wpDur){
        wp=nextWp;
        nextWp=randomPos();
        wpT=0;
        wpDur=12+Math.random()*8;
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
    curX+=(targetX-curX)*0.015;
    curY+=(targetY-curY)*0.015;

    // Camera orbit
    const theta=(t*8)%360+Math.sin(t*0.07)*25;
    const phi=75+Math.sin(t*0.04)*35+Math.sin(t*0.09)*12;
    const dist=600+Math.sin(t*0.06)*20;
    mv.cameraOrbit=theta+'deg '+phi+'deg '+dist+'m';

    // Tumble
    const tiltX=Math.sin(t*0.05)*15+Math.sin(t*0.11)*6;
    const tiltY=Math.sin(t*0.04+0.7)*18+Math.sin(t*0.09+2)*8;
    const tiltZ=Math.sin(t*0.035+1)*14+Math.sin(t*0.08)*5;

    // Build transform — add stretch + opacity fade if absorbing (spaghettification)
    let transform='translate('+curX+'px,'+curY+'px)';
    if(astroState==='absorbing'){
      const p=Math.min(absorbT/ABSORB_DUR,1);
      const stretchX=1+p*1.8;
      const squishY=1-p*0.55;
      const overall=1-p*0.55;
      const sx=stretchX*overall;
      const sy=squishY*overall;
      mv.style.opacity=String(1-Math.pow(p,1.6));
      transform+=' scale('+sx+','+sy+')';
    } else {
      mv.style.opacity='1';
    }
    transform+=' rotateX('+tiltX+'deg) rotateY('+tiltY+'deg) rotateZ('+tiltZ+'deg)';
    mv.style.transform=transform;

    // Thought bubble position — follows astronaut, offset up-right
    const screenX=innerWidth/2+curX;
    const screenY=innerHeight/2+curY;
    bubble.style.left=(screenX+35)+'px';
    bubble.style.top=(screenY-55)+'px';

    // BH reactions — only when astronaut is in normal state
    if(astroState==='normal'){
      const bh=window.__bh;
      const bhFullyFormed=bh&&bh.active&&bh.str>0.5;
      const bhDist=bh&&bh.mx>0?Math.hypot(bh.mx-screenX,bh.my-screenY):9999;
      if(bhFullyFormed && !firstBHShown){
        bubble.textContent=bhFirstHint;
        bubble.classList.add('visible');
        bubbleVisible=true;
        bubbleShowTime=BUBBLE_DURATION+2;
        firstBHShown=true;
      } else if(bhFullyFormed && bhDist<BH_PROXIMITY && !bhInProximity){
        if(bhReactCount>=bhThoughts.length){
          // all three warnings given — absorption time
          astroState='absorbing';
          absorbT=0;
          bubble.textContent=bhAbsorbQuote;
          bubble.classList.add('visible');
          bubbleVisible=true;
          bubbleShowTime=ABSORB_DUR+0.5;
          bhInProximity=true;
        } else {
          bubble.textContent=bhThoughts[bhReactCount];
          bubble.classList.add('visible');
          bubbleVisible=true;
          bubbleShowTime=BUBBLE_DURATION+1.5;
          bhReactCount++;
          bhInProximity=true;
        }
      }
      if(bhInProximity && bhDist>BH_PROXIMITY*1.6) bhInProximity=false;
    }

    // Thought bubble timing — regular idle thoughts only in normal state
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

    requestAnimationFrame(animate);
  }
  animate();
})();
