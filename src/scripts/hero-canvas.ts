// Fullscreen fragment-shader background: flowing violet metaball field + volumetric
// gold rays. WebGL1 for compatibility. Degrades to the CSS gradient on the <canvas>
// if a context can't be acquired.

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;

vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0*fract(p*C.www)-1.0;
  vec3 h = abs(x)-0.5;
  vec3 ox = floor(x+0.5);
  vec3 a0 = x-ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x*x0.x + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m, g);
}

float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ s += a*snoise(p); p *= 2.0; a *= 0.5; }
  return s;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime*0.045;

  // domain-warped noise field → flowing blobs
  vec2 q = vec2(fbm(p*1.2 + t), fbm(p*1.2 - t + 5.0));
  float field = fbm(p*1.5 + q*1.3 + vec2(0.0, t*0.6));
  field = 0.5 + 0.5*field;

  vec3 bg    = vec3(0.035, 0.026, 0.062);
  vec3 vio   = vec3(0.15, 0.09, 0.30);   // muted violet
  vec3 vioHi = vec3(0.30, 0.17, 0.48);   // dimmer highlight

  vec3 col = mix(bg, vio, smoothstep(0.35, 0.78, field));
  col = mix(col, vioHi, smoothstep(0.64, 0.98, field)*0.8);

  // moving light origin (upper-right) → soft volumetric rays
  vec2 lp  = vec2(0.55, 0.28);
  vec2 dir = p - lp;
  float ang = atan(dir.y, dir.x);
  float rays = fbm(vec2(ang*3.0, length(dir)*2.0 - t*2.0));
  rays = pow(0.5 + 0.5*rays, 3.0);
  float falloff = smoothstep(1.25, 0.0, length(dir));
  vec3 gold = vec3(0.85, 0.68, 0.12);
  col += gold  * rays * falloff * 0.10;
  col += vioHi * falloff * 0.06;

  // grain + vignette
  float gr = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);
  col += (gr-0.5)*0.02;
  float vig = smoothstep(1.35, 0.2, length(p));
  col *= 0.5 + 0.5*vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('hero shader:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function boot() {
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const gl = (canvas.getContext('webgl', { antialias: false, alpha: false }) ||
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  if (!gl) return; // CSS gradient on the canvas remains as fallback

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  // one big triangle covering the clip space
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let raf = 0;
  let running = true;

  function frame(now: number) {
    if (!running) return;
    resize();
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }

  if (reduced) {
    // single static frame, no animation loop
    resize();
    gl.uniform1f(uTime, 8.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else {
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    });
  }
}

boot();
