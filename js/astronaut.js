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
      nextWp=randomPos();
      wpT=0;
      wpDur=12+Math.random()*8;
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
