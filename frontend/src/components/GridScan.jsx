import React, { useEffect, useRef, memo } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const hexToRgb = (hex) => {
  if (!hex) return [0.15, 0.47, 0.32];
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) / 255,
      parseInt(clean[1] + clean[1], 16) / 255,
      parseInt(clean[2] + clean[2], 16) / 255,
    ];
  }
  return [
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255,
  ];
};

// Smooth damping spring function for natural physical parallax motion
const smoothDampFloat = (current, target, velRef, smoothTime, maxSpeed, dt) => {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;
  const maxChange = maxSpeed * smoothTime;
  change = Math.sign(change) * Math.min(Math.abs(change), maxChange);
  target = current - change;
  const temp = (velRef.v + omega * change) * dt;
  velRef.v = (velRef.v - omega * temp) * exp;
  let out = target + (change + temp) * exp;
  const origMinusCurrent = originalTo - current;
  const outMinusOrig = out - originalTo;
  if (origMinusCurrent * outMinusOrig > 0) {
    out = originalTo;
    velRef.v = 0;
  }
  return out;
};

const vertexShader = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 uSkew;
uniform float uTilt;
uniform float uYaw;
uniform float uLineThickness;
uniform vec3 uLinesColor;
uniform vec3 uScanColor;
uniform float uGridScale;
uniform float uLineJitter;
uniform float uScanOpacity;
uniform float uScanDirection;
uniform float uNoise;
uniform float uBloomOpacity;
uniform float uScanGlow;
uniform float uScanSoftness;
uniform float uPhaseTaper;
uniform float uScanDuration;
uniform float uScanDelay;
uniform float uScanStarts[8];
uniform float uScanCount;
uniform float uEnablePost;
uniform float uChromaticAberration;
uniform vec3 uBgColor;

out vec4 fragColor;

const int MAX_SCANS = 8;

float smoother01(float a, float b, float x) {
  float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void mainImage(out vec4 colOut, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

  vec3 ro = vec3(0.0);
  vec3 rd = normalize(vec3(p, 2.0));

  float cR = cos(uTilt), sR = sin(uTilt);
  rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

  float cY = cos(uYaw), sY = sin(uYaw);
  rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

  vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
  rd.xy += skew * rd.z;

  float minT = 1e20;
  float gridScale = max(1e-5, uGridScale);
  vec2 gridUV = vec2(0.0);

  float hitIsY = 1.0;
  for (int i = 0; i < 4; i++) {
    float isY = float(i < 2);
    // Floor (-0.32), Ceiling (+0.32), Left wall (-0.65), Right wall (+0.65)
    float pos = mix(-0.32, 0.32, float(i)) * isY + mix(-0.65, 0.65, float(i - 2)) * (1.0 - isY);
    float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
    float den = isY * rd.y + (1.0 - isY) * rd.x;
    float t = num / den;
    vec3 h = ro + rd * t;

    float depthBoost = smoothstep(0.0, 3.0, h.z);
    h.xy += skew * 0.15 * depthBoost;

    bool use = t > 0.0 && t < minT;
    gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
    minT = use ? t : minT;
    hitIsY = use ? isY : hitIsY;
  }

  vec3 hit = ro + rd * minT;
  float dist = length(hit - ro);

  float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
  if (jitterAmt > 0.0) {
    vec2 j = vec2(
      sin(gridUV.y * 2.7 + iTime * 1.8),
      cos(gridUV.x * 2.3 - iTime * 1.6)
    ) * (0.15 * jitterAmt);
    gridUV += j;
  }
  float fx = fract(gridUV.x);
  float fy = fract(gridUV.y);
  float ax = min(fx, 1.0 - fx);
  float ay = min(fy, 1.0 - fy);
  float wx = fwidth(gridUV.x);
  float wy = fwidth(gridUV.y);
  float halfPx = max(0.0, uLineThickness) * 0.5;

  float tx = halfPx * wx;
  float ty = halfPx * wy;

  float aax = wx * 1.2;
  float aay = wy * 1.2;

  float lineX = 1.0 - smoothstep(tx, tx + aax, ax);
  float lineY = 1.0 - smoothstep(ty, ty + aay, ay);
  float primaryMask = max(lineX, lineY);

  vec2 gridUV2 = (hitIsY > 0.5 ? hit.xz : hit.zy) / gridScale;
  if (jitterAmt > 0.0) {
    vec2 j2 = vec2(
      cos(gridUV2.y * 2.1 - iTime * 1.4),
      sin(gridUV2.x * 2.5 + iTime * 1.7)
    ) * (0.15 * jitterAmt);
    gridUV2 += j2;
  }
  float fx2 = fract(gridUV2.x);
  float fy2 = fract(gridUV2.y);
  float ax2 = min(fx2, 1.0 - fx2);
  float ay2 = min(fy2, 1.0 - fy2);
  float wx2 = fwidth(gridUV2.x);
  float wy2 = fwidth(gridUV2.y);
  float tx2 = halfPx * wx2;
  float ty2 = halfPx * wy2;
  float aax2 = wx2 * 1.2;
  float aay2 = wy2 * 1.2;
  float lineX2 = 1.0 - smoothstep(tx2, tx2 + aax2, ax2);
  float lineY2 = 1.0 - smoothstep(ty2, ty2 + aay2, ay2);
  float altMask = max(lineX2, lineY2);

  float edgeDistX = min(abs(hit.x - (-0.65)), abs(hit.x - 0.65));
  float edgeDistY = min(abs(hit.y - (-0.32)), abs(hit.y - 0.32));
  float edgeDist = mix(edgeDistY, edgeDistX, hitIsY);
  float edgeGate = 1.0 - smoothstep(gridScale * 0.5, gridScale * 2.0, edgeDist);
  altMask *= edgeGate;

  float lineMask = max(primaryMask, altMask);

  // Gentle depth fade that keeps lines crisp and bold instead of vanishing
  float fade = clamp(exp(-dist * 0.42), 0.22, 1.0);

  float dur = max(0.05, uScanDuration);
  float del = max(0.0, uScanDelay);
  float scanZMax = 2.4;
  float widthScale = max(0.1, uScanGlow);
  float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
  float sigmaA = sigma * 2.2;

  float combinedPulse = 0.0;
  float combinedAura = 0.0;

  float cycle = dur + del;
  float tCycle = mod(iTime, cycle);
  float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
  float phase = scanPhase;
  if (uScanDirection > 0.5 && uScanDirection < 1.5) {
    phase = 1.0 - phase;
  } else if (uScanDirection > 1.5) {
    float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
    phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
  }
  float scanZ = phase * scanZMax;
  float dz = abs(hit.z - scanZ);
  float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
  float taper = clamp(uPhaseTaper, 0.0, 0.49);
  float headW = taper;
  float tailW = taper;
  float headFade = smoother01(0.0, headW, phase);
  float tailFade = 1.0 - smoother01(1.0 - tailW, 1.0, phase);
  float phaseWindow = headFade * tailFade;
  float pulseBase = lineBand * phaseWindow;
  combinedPulse += pulseBase * clamp(uScanOpacity, 0.0, 1.0);
  float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
  combinedAura += (auraBand * 0.35) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

  for (int i = 0; i < MAX_SCANS; i++) {
    if (float(i) >= uScanCount) break;
    float tActiveI = iTime - uScanStarts[i];
    float phaseI = clamp(tActiveI / dur, 0.0, 1.0);
    if (uScanDirection > 0.5 && uScanDirection < 1.5) {
      phaseI = 1.0 - phaseI;
    } else if (uScanDirection > 1.5) {
      phaseI = (phaseI < 0.5) ? (phaseI * 2.0) : (1.0 - (phaseI - 0.5) * 2.0);
    }
    float scanZI = phaseI * scanZMax;
    float dzI = abs(hit.z - scanZI);
    float lineBandI = exp(-0.5 * (dzI * dzI) / (sigma * sigma));
    float headFadeI = smoother01(0.0, headW, phaseI);
    float tailFadeI = 1.0 - smoother01(1.0 - tailW, 1.0, phaseI);
    float phaseWindowI = headFadeI * tailFadeI;
    combinedPulse += lineBandI * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
    float auraBandI = exp(-0.5 * (dzI * dzI) / (sigmaA * sigmaA));
    combinedAura += (auraBandI * 0.35) * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
  }

  // Crisp, prominent grid lines
  vec3 gridCol = uLinesColor * lineMask * fade;
  vec3 scanCol = uScanColor * (combinedPulse * 1.6);
  vec3 scanAura = uScanColor * (combinedAura * 0.9);

  // Direct composite on base obsidian background
  vec3 outRgb = clamp(uBgColor + gridCol + scanCol + scanAura, 0.0, 1.0);

  if (uNoise > 0.0) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898,78.233))) * 43758.5453123);
    outRgb += (n - 0.5) * uNoise;
  }
  colOut = vec4(clamp(outRgb, 0.0, 1.0), 1.0);
}

void main() {
  if (uEnablePost > 0.5 && uChromaticAberration > 0.0) {
    vec2 offset = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y * uChromaticAberration * 4.0;
    vec4 cR; mainImage(cR, gl_FragCoord.xy + offset * iResolution.y);
    vec4 cG; mainImage(cG, gl_FragCoord.xy);
    vec4 cB; mainImage(cB, gl_FragCoord.xy - offset * iResolution.y);
    fragColor = vec4(cR.r, cG.g, cB.b, 1.0);
  } else {
    mainImage(fragColor, gl_FragCoord.xy);
  }
}
`;

const GridScan = memo(function GridScan({
  sensitivity = 0.55,
  lineThickness = 1.5,
  linesColor = '#226F4A',
  gridScale = 0.08,
  scanColor = '#72D6A0',
  scanOpacity = 0.8,
  enablePost = true,
  bloomIntensity = 0.65,
  chromaticAberration = 0.002,
  noiseIntensity = 0.01,
  scanDirection = 'pingpong',
  scanOnClick = true,
  className = '',
  style = {},
  children,
}) {
  const containerRef = useRef(null);
  const lookTargetRef = useRef({ x: 0, y: 0 });
  const lookCurrentRef = useRef({ x: 0, y: 0 });
  const lookVelRef = useRef({ x: 0, y: 0 });
  const tiltTargetRef = useRef(0);
  const tiltCurrentRef = useRef(0);
  const tiltVelRef = useRef({ v: 0 });
  const yawTargetRef = useRef(0);
  const yawCurrentRef = useRef(0);
  const yawVelRef = useRef({ v: 0 });

  const scanStartsRef = useRef([]);
  const isVisibleRef = useRef(true);

  const directionNumber =
    scanDirection === 'forward' ? 0.0 : scanDirection === 'backward' ? 1.0 : 2.0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new Renderer({
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('GridScan WebGL init error:', e);
      return;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iResolution: {
          value: [container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight, 1],
        },
        iTime: { value: 0 },
        uSkew: { value: [0, 0] },
        uTilt: { value: 0 },
        uYaw: { value: 0 },
        uLineThickness: { value: lineThickness },
        uLinesColor: { value: hexToRgb(linesColor) },
        uScanColor: { value: hexToRgb(scanColor) },
        uGridScale: { value: gridScale },
        uLineJitter: { value: 0.04 },
        uScanOpacity: { value: scanOpacity },
        uScanDirection: { value: directionNumber },
        uNoise: { value: noiseIntensity },
        uBloomOpacity: { value: bloomIntensity },
        uScanGlow: { value: 0.55 },
        uScanSoftness: { value: 2.0 },
        uPhaseTaper: { value: 0.35 },
        uScanDuration: { value: 2.4 },
        uScanDelay: { value: 0.8 },
        uScanStarts: { value: new Float32Array(8) },
        uScanCount: { value: 0 },
        uEnablePost: { value: enablePost ? 1.0 : 0.0 },
        uChromaticAberration: { value: chromaticAberration },
        uBgColor: { value: [0.02745, 0.04314, 0.03529] }, // #070B09
      },
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new Mesh(gl, { geometry, program });

    let animationFrameId;
    let lastTime = performance.now();

    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height);
      program.uniforms.iResolution.value = [width, height, window.devicePixelRatio || 1];
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / (rect.width || window.innerWidth)) * 2 - 1;
      const y = ((e.clientY - rect.top) / (rect.height || window.innerHeight)) * 2 - 1;
      lookTargetRef.current.x = Math.max(-1, Math.min(1, x * sensitivity));
      lookTargetRef.current.y = Math.max(-1, Math.min(1, y * sensitivity));
      yawTargetRef.current = lookTargetRef.current.x;
      tiltTargetRef.current = lookTargetRef.current.y;
    };

    const handleClick = () => {
      if (!scanOnClick) return;
      const nowSec = performance.now() / 1000;
      const arr = scanStartsRef.current.slice();
      if (arr.length >= 8) arr.shift();
      arr.push(nowSec);
      scanStartsRef.current = arr;

      const buf = new Float32Array(8);
      for (let i = 0; i < arr.length; i++) buf[i] = arr[i];
      program.uniforms.uScanStarts.value = buf;
      program.uniforms.uScanCount.value = arr.length;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    if (scanOnClick) {
      window.addEventListener('click', handleClick, { passive: true });
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    intersectionObserver.observe(container);

    const renderLoop = (now) => {
      animationFrameId = requestAnimationFrame(renderLoop);
      if (!isVisibleRef.current) return;

      const dt = Math.max(0.001, Math.min(0.08, (now - lastTime) / 1000));
      lastTime = now;

      // Spring-based dampening for buttery smooth parallax
      const smoothTime = 0.22;
      const maxSpeed = 10;
      lookCurrentRef.current.x = smoothDampFloat(
        lookCurrentRef.current.x,
        lookTargetRef.current.x,
        { v: lookVelRef.current.x },
        smoothTime,
        maxSpeed,
        dt
      );
      lookCurrentRef.current.y = smoothDampFloat(
        lookCurrentRef.current.y,
        lookTargetRef.current.y,
        { v: lookVelRef.current.y },
        smoothTime,
        maxSpeed,
        dt
      );

      tiltCurrentRef.current = smoothDampFloat(
        tiltCurrentRef.current,
        tiltTargetRef.current,
        tiltVelRef.current,
        smoothTime,
        maxSpeed,
        dt
      );

      yawCurrentRef.current = smoothDampFloat(
        yawCurrentRef.current,
        yawTargetRef.current,
        yawVelRef.current,
        smoothTime,
        maxSpeed,
        dt
      );

      const skewScale = 0.1;
      const skewX = lookCurrentRef.current.x * skewScale;
      const skewY = -lookCurrentRef.current.y * 1.3 * skewScale;

      program.uniforms.uSkew.value = [skewX, skewY];
      program.uniforms.uTilt.value = tiltCurrentRef.current * 0.18;
      program.uniforms.uYaw.value = Math.max(-0.6, Math.min(0.6, yawCurrentRef.current * 0.16));
      program.uniforms.iTime.value = now * 0.001;

      renderer.render({ scene: mesh });
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (scanOnClick) {
        window.removeEventListener('click', handleClick);
      }
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // ignore
      }
    };
  }, [
    sensitivity,
    lineThickness,
    linesColor,
    gridScale,
    scanColor,
    scanOpacity,
    enablePost,
    bloomIntensity,
    chromaticAberration,
    noiseIntensity,
    directionNumber,
    scanOnClick,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    >
      {children}
    </div>
  );
});

export default GridScan;
