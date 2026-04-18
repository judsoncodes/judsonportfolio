'use client';

import { useRef, useEffect } from 'react';

interface OceanWaveProps {
  onComplete: () => void;
  duration?: number; // Total duration in ms
  direction?: 'up' | 'down';
}

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_progress;
  uniform float u_direction;

  // Ashima 3D Simplex Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
     vec2 uv = gl_FragCoord.xy / u_resolution.xy;
     // Aspect ratio correction for noise
     vec2 aspectUv = vec2(uv.x * (u_resolution.x / u_resolution.y), uv.y);
     
     // Progress controls the wave boundaries cleanly
     float lead = 0.0;
     float trail = 0.0;
     
     if (u_direction > 0.0) { 
         // UP: leading edge is top, trailing edge is bottom
         lead = mix(-0.2, 2.5, smoothstep(0.0, 0.7, u_progress));
         trail = mix(-2.0, 1.5, smoothstep(0.3, 1.0, u_progress));
     } else { 
         // DOWN: leading edge is bottom, trailing edge is top
         lead = mix(1.2, -1.5, smoothstep(0.0, 0.7, u_progress));
         trail = mix(3.0, -0.5, smoothstep(0.3, 1.0, u_progress));
     }

     // Massive, rolling liquid turbulence
     float n1 = snoise(vec3(aspectUv * 2.0, u_time * 1.5));
     float n2 = snoise(vec3(aspectUv * 5.0 - vec2(u_time * 0.5, u_time), u_time * 2.5));
     float turbulence = (n1 * 0.15) + (n2 * 0.08);
     
     // Dripping water for the trailing edge
     float dripNoise = snoise(vec3(aspectUv.x * 10.0, aspectUv.y * 5.0, u_time));
     float drips = smoothstep(0.2, 0.8, dripNoise) * 0.3;

     float displacedY = uv.y;
     float distToLead = 0.0;
     float distToTrail = 0.0;
     bool isWater = false;

     if (u_direction > 0.0) {
         // UP direction
         float leadBoundary = lead + turbulence;
         float trailBoundary = trail - drips; // drips hang below
         
         if (displacedY < leadBoundary && displacedY > trailBoundary) {
             isWater = true;
             distToLead = leadBoundary - displacedY;
             distToTrail = displacedY - trailBoundary;
         }
     } else {
         // DOWN direction
         float leadBoundary = lead - turbulence;
         float trailBoundary = trail + drips; // drips hang above
         
         if (displacedY > leadBoundary && displacedY < trailBoundary) {
             isWater = true;
             distToLead = displacedY - leadBoundary;
             distToTrail = trailBoundary - displacedY;
         }
     }

     if (!isWater) {
         gl_FragColor = vec4(0.0);
     } else {
         // Deep, pleasing ocean colors
         vec3 deepOcean = vec3(0.0, 0.05, 0.15); // Almost black-blue
         vec3 midWater = vec3(0.0, 0.2, 0.4);
         vec3 crestCyan = vec3(0.0, 0.7, 0.9);
         vec3 foamWhite = vec3(0.9, 0.95, 1.0);

         // Color based STRICTLY on distance from the LEADING edge
         // This ensures there is only ONE crest, preventing the "two rounds" look
         float submergedAmount = smoothstep(0.0, 0.2, distToLead);
         vec3 color = mix(crestCyan, midWater, submergedAmount);
         color = mix(color, deepOcean, smoothstep(0.2, 0.8, distToLead));

         // Gentle caustics
         float caustics = snoise(vec3(aspectUv * 6.0 + vec2(u_time * 0.2, u_time * 0.4), u_time));
         caustics = pow(smoothstep(0.4, 0.9, caustics), 2.0);
         color += crestCyan * caustics * 0.2;

         // Volumetric Light Rays (God Rays)
         float rays = snoise(vec3(aspectUv.x * 2.0 + u_time * 0.1, aspectUv.y * 1.0 - u_time * 0.2, u_time * 0.3));
         color += vec3(0.1, 0.5, 0.8) * max(0.0, rays) * 0.2;

         // Smooth leading-edge foam
         float foamNoise = snoise(vec3(aspectUv * 8.0, u_time * 2.0));
         float foamThickness = 0.04 + foamNoise * 0.03;
         float foamMask = smoothstep(foamThickness, foamThickness * 0.5, distToLead);
         color = mix(color, foamWhite, foamMask * 0.8);

         // The trailing edge fades out smoothly like water thinning to glass
         // No bright cyan colors at the back!
         float trailFade = smoothstep(0.0, 0.2, distToTrail);

         // Global alpha for perfectly smooth entry/exit
         float alpha = 1.0;
         if (u_progress > 0.85) {
            alpha = 1.0 - ((u_progress - 0.85) / 0.15);
         } else if (u_progress < 0.05) {
            alpha = u_progress / 0.05;
         }

         // Blend everything smoothly
         gl_FragColor = vec4(color, alpha * trailFade * 0.98); 
     }
  }
`;

export default function OceanWave({ onComplete, duration = 4000, direction = 'up' }: OceanWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    if (!gl) return;

    // WebGL Setup
    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, vertexShaderSource);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, fragmentShaderSource);
    gl.compileShader(fragShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0, -1.0,  1.0,  1.0
    ]), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uProgress = gl.getUniformLocation(program, "u_progress");
    const uDirection = gl.getUniformLocation(program, "u_direction");

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrameId: number;
    const startTime = performance.now();

    // Cinematic Audio (with click prevention)
    let audioCtx: AudioContext | null = null;
    try {
       const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
       audioCtx = new AudioContextClass();
       
       const rumbleBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
       const rData = rumbleBuffer.getChannelData(0);
       for (let i = 0; i < rData.length; i++) rData[i] = (Math.random() * 2 - 1) * 0.6;
       const rumble = audioCtx.createBufferSource();
       rumble.buffer = rumbleBuffer;
       const rFilter = audioCtx.createBiquadFilter();
       rFilter.type = 'lowpass';
       rFilter.frequency.setValueAtTime(50, audioCtx.currentTime);
       rFilter.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 1.5);
       const rGain = audioCtx.createGain();
       
       // Start strictly at 0 to prevent audio popping
       rGain.gain.setValueAtTime(0, audioCtx.currentTime);
       rGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.0);
       rGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.8);
       rGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3.9); // hard zero
       
       rumble.connect(rFilter).connect(rGain).connect(audioCtx.destination);
       rumble.start();

       const crashBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
       const cData = crashBuffer.getChannelData(0);
       for (let i = 0; i < cData.length; i++) cData[i] = Math.random() * 2 - 1;
       const crash = audioCtx.createBufferSource();
       crash.buffer = crashBuffer;
       const cFilter = audioCtx.createBiquadFilter();
       cFilter.type = 'bandpass';
       cFilter.frequency.setValueAtTime(800, audioCtx.currentTime);
       cFilter.frequency.exponentialRampToValueAtTime(3000, audioCtx.currentTime + 1.2);
       const cGain = audioCtx.createGain();
       
       // Start strictly at 0 to prevent audio popping
       cGain.gain.setValueAtTime(0, audioCtx.currentTime);
       cGain.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 1.2);
       cGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.5);
       cGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3.6); // hard zero
       
       crash.connect(cFilter).connect(cGain).connect(audioCtx.destination);
       crash.start();
    } catch(e) {
       console.log("Audio API not supported");
    }

    const render = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, elapsed / 1000.0);
      gl.uniform1f(uProgress, progress);
      gl.uniform1f(uDirection, direction === 'up' ? 1.0 : -1.0);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (progress < 1) {
         animationFrameId = requestAnimationFrame(render);
      } else {
         if (audioCtx && audioCtx.state === 'running') audioCtx.close();
         onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (audioCtx && audioCtx.state === 'running') audioCtx.close();
    };
  }, [duration, onComplete]);

  // CSS backdrop-filter handles the realistic "underwater blur/refraction" 
  // perfectly when combined with the WebGL volume!
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[9999999] pointer-events-none w-full h-full"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} 
    />
  );
}
