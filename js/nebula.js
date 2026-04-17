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
    vec2 uvA=vec2((uv.x-0.5)*aspect,uv.y-0.5);
    float t=u_t*0.038;

    vec2 center=vec2(0.06*sin(t*0.4)+0.025*cos(t*0.75)+0.015*sin(t*1.1),-0.02+0.04*cos(t*0.3)+0.018*sin(t*0.6)+0.01*cos(t*0.95));
    vec2 p=uvA-center;

    float tilt=0.38*sin(t*0.22)+0.18*cos(t*0.37)+0.08*sin(t*0.6);
    float cs=cos(tilt),sn=sin(tilt);
    p=vec2(p.x*cs-p.y*sn,p.x*sn+p.y*cs);
    float squeeze=1.15+0.12*sin(t*0.26)+0.05*cos(t*0.45);
    p.y*=squeeze;

    float dist=length(p);
    float ang=atan(p.y,p.x);

    float ringR=0.22+0.04*sin(ang*3.0+t*1.8)+0.03*cos(ang*5.0-t*2.2)+0.02*sin(ang*7.0+t*1.3)+0.012*cos(ang*11.0-t*0.7);
    ringR+=fbm4(vec2(ang*1.5,t*1.2))*0.065;

    float ringDist=abs(dist-ringR);
    float ringWidth=0.11+0.045*sin(ang*2.0+t*1.5)+0.025*cos(ang*4.0-t*1.1)+0.015*sin(ang*6.0+t*0.6);

    float ringMask=smoothstep(ringWidth,ringWidth*0.15,ringDist);
    float outerGlow=smoothstep(ringWidth*3.0,ringWidth*0.5,ringDist)*0.4;
    float innerEdge=smoothstep(ringR-ringWidth*0.3,ringR,dist);
    float outerEdge=smoothstep(ringR+ringWidth*2.5,ringR,dist);

    vec2 warpP=vec2(ang*3.0+t*0.8,dist*8.0);
    float filament1=fbm(warpP*2.5+t*1.1);
    float filament2=fbm(warpP*4.0-t*0.8+vec2(3.7,1.2));
    float filFine=pow(abs(filament1-0.5)*2.0,0.4);
    float filCoarse=pow(abs(filament2-0.5)*2.0,0.28);

    float radialNoise=fbm(vec2(ang*6.0,dist*3.0)+t*0.55);
    float tendrils=pow(abs(radialNoise-0.5)*2.0,0.2)*smoothstep(0.6,0.15,ringDist);

    vec2 q=vec2(fbm(uvA*3.0+t*1.2),fbm(uvA*3.0+vec2(5.2,1.3)+t*1.05));
    vec2 r2=vec2(fbm(uvA*4.0+q+t*0.85),fbm(uvA*4.0+q+vec2(1.7,9.2)+t*0.9));
    float warp=fbm(uvA*5.0+r2*3.0);

    vec3 col=vec3(0);

    vec3 gold=vec3(1.0,0.7,0.15);
    vec3 hotOrange=vec3(1.0,0.45,0.05);
    vec3 white=vec3(1.0,0.95,0.85);
    float ringZone=ang+t*0.15;
    vec3 ringCol=mix(gold,hotOrange,0.5+0.5*sin(ringZone*1.5));
    ringCol=mix(ringCol,white,filFine*0.3);
    float ringBrightness=ringMask*(0.4+0.6*filCoarse)*(0.7+0.3*filFine);
    ringBrightness+=ringMask*tendrils*0.4;
    col+=ringCol*ringBrightness*0.8;

    vec3 deepRed=vec3(0.6,0.08,0.02);
    vec3 darkCrimson=vec3(0.35,0.04,0.01);
    float haloMask=smoothstep(0.55,0.18,dist)*smoothstep(0.0,0.1,dist);
    haloMask*=(1.0-ringMask*0.8);
    float haloDetail=fbm(uvA*6.0+q*1.5+t*0.2);
    vec3 haloCol=mix(darkCrimson,deepRed,haloDetail);
    haloCol=mix(haloCol,hotOrange*0.3,outerGlow);
    col+=haloCol*haloMask*(0.2+0.5*haloDetail)*0.45;

    float outerTendrils=fbm(vec2(ang*4.0,dist*6.0)+t*0.5);
    float tendrilMask=smoothstep(0.55,0.14,dist)*smoothstep(0.03,0.1,dist);
    tendrilMask*=pow(abs(outerTendrils-0.5)*2.0,0.3)*0.6;
    col+=vec3(0.7,0.1,0.04)*tendrilMask;

    float centerDark=smoothstep(ringR-ringWidth*0.5,ringR-ringWidth*1.5,dist);
    vec3 centerCol=vec3(0.02,0.04,0.12);
    col=mix(col,centerCol,centerDark*0.7);

    float knots=pow(fbm(vec2(ang*8.0,dist*12.0)+t*0.65),1.5);
    col+=vec3(1.0,0.8,0.3)*knots*ringMask*0.45;

    float farGlow=smoothstep(0.65,0.12,dist)*0.06;
    col+=vec3(0.35,0.04,0.015)*farGlow;

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
