var f=Object.defineProperty;var v=(r,e,n)=>e in r?f(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var t=(r,e,n)=>v(r,typeof e!="symbol"?e+"":e,n);import{W as m,C as w,a as y,V as c,b as h,S as b,P as g,c as A,R,M as P}from"./vendor-three-wBFtRpzG.js";const l=class l{constructor(){t(this,"devicePixelRatio");t(this,"clock");t(this,"renderer");t(this,"width");t(this,"height");t(this,"aspect");t(this,"time");t(this,"timeScale");this.devicePixelRatio=window.devicePixelRatio,this.renderer=new m({alpha:!0,antialias:!0}),this.clock=new w,this.width=window.innerWidth,this.height=window.innerHeight,this.aspect=this.width/this.height,this.time=0,this.timeScale=2}init(){const e=new y(l.RENDERER_PARAM.clearColor);this.renderer.setClearColor(e,l.RENDERER_PARAM.alpha),this.resize()}resize(){this.width=window.innerWidth,this.height=window.innerHeight,this.aspect=this.width/this.height,this.renderer.setSize(this.width,this.height)}update(){this.time=this.clock.getElapsedTime()*this.timeScale}};t(l,"RENDERER_PARAM",{clearColor:16777215,alpha:0,width:window.innerWidth,height:window.innerHeight});let d=l;const i=new d;class D{constructor(){t(this,"pointerMoved");t(this,"coords");t(this,"prevCoords");t(this,"diff");t(this,"timer");this.pointerMoved=!1,this.coords=new c,this.prevCoords=new c,this.diff=new c,this.timer=null,this.onPointerMove=this.onPointerMove.bind(this),this.onPointerDown=this.onPointerDown.bind(this)}init(){document.body.addEventListener("pointermove",this.onPointerMove,!1),document.body.addEventListener("pointerdown",this.onPointerDown,!1)}setCoords(e,n){this.timer&&clearTimeout(this.timer);const a=e/i.width*2-1,s=-(n/i.height)*2+1;this.coords.set(a,s),this.pointerMoved=!0,this.timer=setTimeout(()=>{this.pointerMoved=!1},100)}onPointerMove(e){e.pointerType=="touch"&&e.isPrimary?this.setCoords(e.pageX,e.pageY):this.setCoords(e.clientX,e.clientY)}onPointerDown(e){e.pointerType!=="touch"||!e.isPrimary||this.setCoords(e.pageX,e.pageY)}update(){this.diff.subVectors(this.coords,this.prevCoords),this.prevCoords.copy(this.coords)}}const p=new D,T=`attribute vec3 position;
varying vec2 vTexCoord;

void main() {
    vTexCoord = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}`,C=`precision mediump float;

const int TRAIL_LENGTH = 15;
const float EPS = 1e-4;
const int ITR = 16;
const float PI = acos(-1.0);

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointerTrail[TRAIL_LENGTH];
uniform float uDirectory;
uniform vec3 uBubbleCenters[7];

varying vec2 vTexCoord;

float rnd3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453123);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    float a000 = rnd3D(i); // (0,0,0)
    float a100 = rnd3D(i + vec3(1.0, 0.0, 0.0)); // (1,0,0)
    float a010 = rnd3D(i + vec3(0.0, 1.0, 0.0)); // (0,1,0)
    float a110 = rnd3D(i + vec3(1.0, 1.0, 0.0)); // (1,1,0)
    float a001 = rnd3D(i + vec3(0.0, 0.0, 1.0)); // (0,0,1)
    float a101 = rnd3D(i + vec3(1.0, 0.0, 1.0)); // (1,0,1)
    float a011 = rnd3D(i + vec3(0.0, 1.0, 1.0)); // (0,1,1)
    float a111 = rnd3D(i + vec3(1.0, 1.0, 1.0)); // (1,1,1)

    vec3 u = f * f * (3.0 - 2.0 * f);
    // vec3 u = f*f*f*(f*(f*6.0-15.0)+10.0);

    float k0 = a000;
    float k1 = a100 - a000;
    float k2 = a010 - a000;
    float k3 = a001 - a000;
    float k4 = a000 - a100 - a010 + a110;
    float k5 = a000 - a010 - a001 + a011;
    float k6 = a000 - a100 - a001 + a101;
    float k7 = -a000 + a100 + a010 - a110 + a001 - a101 - a011 + a111;

    return k0 + k1 * u.x + k2 * u.y + k3 *u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z;
}

// Camera
vec3 origin = vec3(0.0, 0.0, 1.0);
vec3 lookAt = vec3(0.0, 0.0, 0.0);
vec3 cDir = normalize(lookAt - origin);
vec3 cUp = vec3(0.0, 1.0, 0.0);
vec3 cSide = cross(cDir, cUp);

float smoothMin(float d1, float d2, float k) {
    float h = exp(-k * d1) + exp(-k * d2);
    return -log(h) / k;
}

vec3 translate(vec3 p, vec3 t) {
    return p - t;
}

float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

float map(vec3 p) {
    float baseRadius = uDirectory > 0.5 ? 5e-3 : 8e-3;
    float radius = baseRadius * float(TRAIL_LENGTH);
    float k = uDirectory > 0.5 ? 40.0 : 7.0;
    float d = 1e5;

    for (int i = 0; i < TRAIL_LENGTH; i++) {
        float fi = float(i);
        vec2 pointerTrail = uPointerTrail[i] * uResolution / min(uResolution.x, uResolution.y);

        float sphere = sdSphere(
                translate(p, vec3(pointerTrail, .0)),
                radius - baseRadius * fi
            );

        d = smoothMin(d, sphere, k);
    }

    if (uDirectory > 0.5) {
        float bubbleD = 1e5;
        for (int i = 0; i < 7; i++) {
            float sphere = sdSphere(translate(p, vec3(uBubbleCenters[i].xy, 0.0)), uBubbleCenters[i].z);
            bubbleD = min(bubbleD, sphere);
        }
        d = smoothMin(d, bubbleD, 18.0);
    }

    return d;
}

vec3 generateNormal(vec3 p) {
    return normalize(vec3(
            map(p + vec3(EPS, 0.0, 0.0)) - map(p + vec3(-EPS, 0.0, 0.0)),
            map(p + vec3(0.0, EPS, 0.0)) - map(p + vec3(0.0, -EPS, 0.0)),
            map(p + vec3(0.0, 0.0, EPS)) - map(p + vec3(0.0, 0.0, -EPS))
        ));
}

vec3 dropletColor(vec3 normal, vec3 rayDir, vec3 hitPos) {
    vec3 reflectDir = reflect(rayDir, normal);

    float noisePosTime = noise3D(reflectDir * 2.0 + uTime);
    float noiseNegTime = noise3D(reflectDir * 2.0 - uTime);

    vec3 _color0 = vec3(0.1765, 0.1255, 0.2275) * noisePosTime;
    vec3 _color1 = vec3(0.4118, 0.4118, 0.4157) * noiseNegTime;

    return (_color0 + _color1) * 2.3;
}

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);

    // Orthographic Camera
    vec3 ray = origin + cSide * p.x + cUp * p.y;
    vec3 rayDirection = cDir;

    float dist = 0.0;

    for (int i = 0; i < ITR; ++i) {
        dist = map(ray);
        ray += rayDirection * dist;
        if (dist < EPS) break;
    }

    vec3 color = vec3(0.0);

    if (dist < EPS) {
        vec3 normal = generateNormal(ray);

        color = dropletColor(normal, rayDirection, ray);
        // color = normal; // for debug
    }

    vec3 finalColor = pow(color, vec3(7.0));

    gl_FragColor = vec4(finalColor, dist < EPS ? 1.0 : 0.0);
}
`,o=class o{constructor(){t(this,"scene");t(this,"camera");t(this,"uniforms");t(this,"trailLength");t(this,"pointerTrail");t(this,"directoryBubbles");t(this,"isDirectory");t(this,"trailActive",!1);this.scene=new b,this.camera=new g(o.CAMERA_PARAM.fovy,o.CAMERA_PARAM.aspect,o.CAMERA_PARAM.near,o.CAMERA_PARAM.far),this.trailLength=15,this.pointerTrail=Array.from({length:this.trailLength},()=>new c(0,0)),this.isDirectory=document.body.dataset.page==="directory",this.directoryBubbles=Array.from({length:7},()=>new h(0,0,0)),this.uniforms={uTime:{value:i.time},uResolution:{value:new c(i.width,i.height)},uPointerTrail:{value:this.pointerTrail},uDirectory:{value:this.isDirectory?1:0},uBubbleCenters:{value:this.directoryBubbles}}}init(){this.camera.position.copy(o.CAMERA_PARAM.position),this.camera.lookAt(o.CAMERA_PARAM.lookAt);const e=new A(2,2),n=new R({vertexShader:T,fragmentShader:C,wireframe:!1,uniforms:this.uniforms}),a=new P(e,n);this.scene.add(a)}resize(){this.camera.aspect=i.aspect,this.camera.updateProjectionMatrix(),this.uniforms&&this.uniforms.uResolution.value.set(i.width,i.height)}render(){this.uniforms&&(this.uniforms.uTime.value=i.time),i.renderer.render(this.scene,this.camera)}update(){this.updatePointerTrail(),this.isDirectory&&this.updateDirectoryBubbles(),this.render()}updateDirectoryBubbles(){const e=Math.min(i.width,i.height);document.querySelectorAll(".directory__orb").forEach((n,a)=>{if(a>=this.directoryBubbles.length)return;const s=n.getBoundingClientRect();this.directoryBubbles[a].set((s.left+s.width/2)*2/e-i.width/e,i.height/e-(s.top+s.height/2)*2/e,s.width/e*.95)})}updatePointerTrail(){let e=p.coords;this.trailActive||(this.pointerTrail.forEach(n=>n.copy(e)),this.trailActive=!0);for(let n=this.trailLength-1;n>0;n--)this.pointerTrail[n].copy(this.pointerTrail[n-1]);this.pointerTrail[0].copy(e)}};t(o,"CAMERA_PARAM",{fovy:60,aspect:window.innerWidth/window.innerHeight,near:.1,far:50,position:new h(0,0,10),lookAt:new h(0,0,0)});let u=o;class E{constructor(e){t(this,"output");t(this,"wrapper");this.wrapper=e,this.output=new u,this.resize=this.resize.bind(this),this.render=this.render.bind(this),window.addEventListener("resize",this.resize)}init(){i.init(),p.init(),this.output.init()}setup(){this.wrapper.appendChild(i.renderer.domElement),this.resize(),i.clock.start()}render(){requestAnimationFrame(this.render),i.update(),this.output.update()}resize(){i.resize(),this.output.resize()}}window.addEventListener("DOMContentLoaded",()=>{const r=document.querySelector("#webgl");if(!(r instanceof HTMLElement)){console.error('Failed to find a valid element with the ID "webgl".');return}const e=new E(r);e.init(),e.setup(),e.render()},!1);
