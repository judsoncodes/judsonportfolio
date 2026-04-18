'use client';

import { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  size: number;
  life: number; // 1.0 down to 0.0
  vx: number;
  vy: number;
}

const MAX_BUBBLES = 16;

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
  uniform vec3 u_bubbles[${MAX_BUBBLES}]; // x, y, life*size
  
  // 3D Simplex Noise for volumetric caustic interior
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
      vec3 finalColor = vec3(0.0);
      float finalAlpha = 0.0;
      
      for(int i = 0; i < ${MAX_BUBBLES}; i++) {
          vec3 b = u_bubbles[i];
          if (b.z <= 0.0) continue; // Inactive
          
          vec2 bPos = vec2(b.x, b.y) / u_resolution.xy;
          
          // Distance with aspect ratio correction
          vec2 delta = (uv - bPos);
          delta.x *= (u_resolution.x / u_resolution.y);
          
          float dist = length(delta);
          float radius = b.z * 0.05; // The third component is life * scale
          
          if (dist < radius) {
              // Normalized distance from center (0 to 1)
              float r = dist / radius;
              
              // Construct 3D normal of the sphere
              float z = sqrt(max(0.0, 1.0 - r*r));
              vec3 normal = normalize(vec3(delta.x/radius, delta.y/radius, z));
              
              // 1. Fresnel Rim Highlight
              vec3 viewDir = vec3(0.0, 0.0, 1.0);
              float NdotV = max(dot(normal, viewDir), 0.0);
              float fresnel = pow(1.0 - NdotV, 3.0); // Intense rim
              
              // 2. Interior Caustic Distortion (Simulated refraction using 3D noise)
              // The noise maps to the curved 3D normal, creating a volumetric wobble
              float caustic = snoise(normal * 3.0 + vec3(u_time * 1.5, u_time, u_time * 0.5));
              caustic = pow(smoothstep(0.2, 0.8, caustic), 2.0);
              
              // 3. Specular Highlight (Sun/Moon reflection)
              vec3 lightDir = normalize(vec3(-0.5, 0.8, 0.5));
              float spec = pow(max(dot(normal, lightDir), 0.0), 32.0);
              
              // Color accumulation
              vec3 bubbleColor = vec3(0.0, 0.9, 1.0) * fresnel; // Cyan rim
              bubbleColor += vec3(0.6, 1.0, 0.9) * caustic * 0.4; // Soft glowing interior
              bubbleColor += vec3(1.0) * spec; // Bright white specular spot
              
              // Edge smoothing
              float edgeMask = smoothstep(1.0, 0.95, r);
              
              // Additive blend with global alpha fade
              float alpha = (fresnel * 0.6 + spec + caustic * 0.3) * edgeMask;
              
              // We add colors up (additive blending inside the shader for overlapping bubbles)
              finalColor += bubbleColor;
              finalAlpha = max(finalAlpha, alpha);
          }
      }
      
      gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
  }
`;

export default function BubbleShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!gl) return;

    // Shader Compilation
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

    // Quad Setup
    const positionLocation = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0, -1.0,  1.0,  1.0
    ]), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uBubbles = gl.getUniformLocation(program, "u_bubbles");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Spawner Logic
    const handleGlobalClick = (e: MouseEvent) => {
      const dpr = window.devicePixelRatio || 1;
      const x = e.clientX * dpr;
      // WebGL y=0 is at the bottom!
      const y = (window.innerHeight - e.clientY) * dpr;
      
      // Spawn 1 to 3 bubbles per click
      const count = Math.floor(Math.random() * 3) + 1;
      
      for(let i=0; i<count; i++) {
          if (bubblesRef.current.length >= MAX_BUBBLES) {
              bubblesRef.current.shift(); // Remove oldest
          }
          
          bubblesRef.current.push({
              x: x + (Math.random() - 0.5) * 40 * dpr,
              y: y + (Math.random() - 0.5) * 40 * dpr,
              size: Math.random() * 0.8 + 0.4, // size multiplier
              life: 1.0,
              vx: (Math.random() - 0.5) * 2 * dpr,
              vy: (Math.random() * 3 + 2) * dpr // Float upwards
          });
      }
    };
    
    window.addEventListener('click', handleGlobalClick);

    // Render Loop
    let animationFrameId: number;
    const startTime = performance.now();
    const bubbleData = new Float32Array(MAX_BUBBLES * 3);

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000.0;
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update Bubble Physics
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
          const b = bubblesRef.current[i];
          b.x += b.vx;
          b.y += b.vy;
          b.vx += (Math.random() - 0.5) * 0.5; // Wobble
          b.life -= 0.005; // Fade out over time
          
          if (b.life <= 0) {
              bubblesRef.current.splice(i, 1);
          }
      }

      // Pack uniform array
      bubbleData.fill(0); // clear
      bubblesRef.current.forEach((b, i) => {
          bubbleData[i * 3 + 0] = b.x;
          bubbleData[i * 3 + 1] = b.y;
          // Scale smoothstep for popping effect (grows quickly, shrinks slightly at end)
          const lifeCurve = smoothstep(0.0, 0.2, b.life) * smoothstep(1.0, 0.8, b.life);
          bubbleData[i * 3 + 2] = b.size * lifeCurve;
      });

      gl.uniform1f(uTime, elapsed);
      gl.uniform3fv(uBubbles, bubbleData);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Helper math
    function smoothstep(min: number, max: number, value: number) {
        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleGlobalClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[50]"
      aria-hidden="true"
    />
  );
}
