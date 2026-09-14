import React, { useEffect, useRef } from 'react';

export default function AuroraShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    syncSize();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 mouseNorm = (u_mouse.xy / u_resolution.xy) - 0.5;
    
    vec3 bgCol    = vec3(0.02745, 0.04313, 0.03529); // #070b09
    vec3 surfCol  = vec3(0.05098, 0.08235, 0.07058); // #0d1512
    vec3 deepCol  = vec3(0.08627, 0.23921, 0.17647); // #163d2d
    vec3 midCol   = vec3(0.30980, 0.68627, 0.51372); // #4faf83
    
    float t = u_time * 0.35;
    
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;
    
    float beamCoord = p.x + 0.15 * sin(p.y * 3.0 + t * 0.8) + mouseNorm.x * 0.1;
    
    float n1 = snoise(vec2(beamCoord * 2.2 + t * 0.2, p.y * 1.5 - t * 0.3));
    float n2 = snoise(vec2(beamCoord * 4.5 - t * 0.4, p.y * 3.0 + t * 0.5));
    float combinedNoise = (n1 * 0.65 + n2 * 0.35) * 0.5 + 0.5;
    
    float beamProfile = exp(-pow(beamCoord * 1.6, 2.0) * 2.8);
    float curtain = sin(p.y * 6.0 + n1 * 2.5 + t) * 0.5 + 0.5;
    
    float intensity = beamProfile * (combinedNoise * 0.75 + curtain * 0.25);
    intensity = smoothstep(0.05, 0.95, intensity);
    
    float verticalFade = smoothstep(-0.6, 0.1, p.y) * smoothstep(0.65, -0.1, p.y);
    intensity *= verticalFade;
    
    vec3 col = mix(bgCol, surfCol, clamp(intensity * 1.2, 0.0, 1.0));
    col = mix(col, deepCol, clamp(pow(intensity, 1.4) * 1.4, 0.0, 1.0));
    col = mix(col, midCol, clamp(pow(intensity, 2.6) * 1.1, 0.0, 1.0));
    
    float dist = length(uv - 0.5);
    float vignette = smoothstep(0.85, 0.25, dist);
    col *= mix(0.7, 1.0, vignette);
    
    gl_FragColor = vec4(col, 1.0);
}`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    function render(t) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center,_transparent_50%,_#070b09_100%] opacity-60 z-[1]" />
    </div>
  );
}
