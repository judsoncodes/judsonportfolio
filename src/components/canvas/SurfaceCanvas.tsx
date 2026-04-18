'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';

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
  uniform float u_scroll;
  uniform float u_depth_ratio; // 0.0 at surface, 1.0 at abyss
  uniform float u_velocity;    // Normalized scroll velocity

  // 2D Simplex Noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
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

  // Modified Gerstner-like function for 2D profile
  float gerstner(float x, float freq, float speed, float amp, float time) {
      float steepness = 0.4;
      float phase = x * freq - time * speed;
      return amp * sin(phase + steepness * cos(phase));
  }

  // Get total wave displacement
  float getWaveHeight(float x, float t) {
      // Attenuate waves as we go deeper (0.05 = 200m / 4000m)
      // Surface flattens and becomes glassy by 200m
      float depthMod = clamp(1.0 - (u_depth_ratio / 0.05), 0.0, 1.0);
      
      // Amplitude responds to scroll velocity (surge effect)
      float velocityMod = 1.0 + abs(u_velocity) * 5.0;
      float finalAmp = depthMod * velocityMod;

      float w1 = gerstner(x, 3.5, 1.2, 0.018 * finalAmp, t);
      float w2 = gerstner(x, 6.0, 1.8, 0.008 * finalAmp, t);
      float w3 = gerstner(x, 10.0, 2.5, 0.004 * finalAmp, t);
      float noiseVariation = snoise(vec2(x * 1.5 - t * 0.5, t * 0.2)) * 0.006 * depthMod;
      return w1 + w2 + w3 + noiseVariation;
  }

  vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453123);
  }

  // Smooth Voronoi for animated caustics
  float voronoi(vec2 x, float time) {
      vec2 n = floor(x);
      vec2 f = fract(x);
      float md = 8.0;
      for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.5 * sin(time + 6.2831 * o);
              vec2 r = g + o - f;
              md = min(md, dot(r, r));
          }
      }
      return md;
  }

  void main() {
      vec2 rawUv = gl_FragCoord.xy / u_resolution.xy;
      
      // --- Lens Distortion Post-Process ---
      // 1. Calculate subtle pulse synced with waves
      float lensPulse = sin(u_time * 0.4) * 0.5 + 0.5;
      float distortionStrength = 0.05 + lensPulse * 0.02;
      
      // 2. Barrel Distortion Math
      vec2 centeredUv = rawUv - 0.5;
      float distSq = dot(centeredUv, centeredUv);
      vec2 distortedUv = rawUv + centeredUv * distSq * distortionStrength;
      
      // Use distorted UVs for all subsequent calculations
      vec2 uv = distortedUv;
      vec2 aspectUv = vec2(uv.x * (u_resolution.x / u_resolution.y), uv.y);
      
      float scrollNormalized = u_scroll / u_resolution.y;
      float baseSurface = 0.8 + scrollNormalized; 
      
      float t = u_time * 0.4;
      float H0 = getWaveHeight(aspectUv.x, t);
      float surfaceHeight = baseSurface + H0;
      
      float dist = surfaceHeight - uv.y;
      
      // Calculate fake 2D surface normal via finite difference
      float eps = 0.01;
      float H1 = getWaveHeight(aspectUv.x + eps, t);
      // Construct normal: slope in X, 1.0 in Y, and a slight Z to fake 3D volume
      vec3 normal = normalize(vec3(-(H1 - H0) / eps, 1.0, 0.2)); 
      
      // Dynamic Lighting setup (Sun shifts over simulated "time of day")
      float timeOfDay = u_time * 0.05;
      vec3 lightDir = normalize(vec3(-0.4 + cos(timeOfDay) * 0.6, max(0.15, sin(timeOfDay)), 0.4)); 
      vec3 viewDir = normalize(vec3(0.0, 0.3, 1.0)); // View slightly looking down into the screen
      vec3 halfDir = normalize(lightDir + viewDir);
      
      vec3 color = vec3(0.0);
      
      vec3 skyColor = vec3(0.0, 0.01, 0.03);
      vec3 surfaceLight = vec3(0.0, 0.45, 0.75);
      vec3 surfaceDeep = vec3(0.0, 0.05, 0.15);
      vec3 abyssLight = vec3(0.0, 0.08, 0.15);
      vec3 abyssDeep = vec3(0.0, 0.01, 0.03);
      
      vec3 currentLight = mix(surfaceLight, abyssLight, u_depth_ratio);
      vec3 currentDeep = mix(surfaceDeep, abyssDeep, u_depth_ratio);
      
      if (dist < 0.0) {
          // Sky
          color = skyColor;
          float horizonGlow = smoothstep(-0.08, 0.0, dist);
          color = mix(color, currentLight * 0.3, horizonGlow);
      } else {
          // Base underwater gradient
          color = mix(currentLight, currentDeep, smoothstep(0.0, 0.8, dist));
          
          if (u_depth_ratio < 0.5) {
              // PBR Water Surface Lighting
              
              // 1. Fresnel Reflection (Schlick)
              float NdotV = max(dot(normal, viewDir), 0.0);
              float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);
              
              // 2. Soft Specular Highlight (Blinn-Phong)
              // Controlled exponent (64.0) so it's not overly glossy or noisy
              float NdotH = max(dot(normal, halfDir), 0.0);
              float specular = pow(NdotH, 64.0) * 0.6;
              
              // 3. Subsurface Scattering on crests (acting as transparency/light penetration)
              float crestMask = smoothstep(0.0, 0.03, H0); // H0 > 0.0 is the wave peak
              float subsurface = crestMask * 0.6 * max(dot(normal, lightDir), 0.0);
              
              // Combine lighting exclusively near the surface line
              float surfaceGlow = smoothstep(0.04, 0.0, dist);
              
              vec3 highlightColor = vec3(0.8, 0.95, 1.0); // Clean cyan-white
              vec3 scatterColor = vec3(0.0, 0.8, 0.9);    // Bright cyan glow
              
              vec3 reflection = highlightColor * (specular + fresnel * 0.4);
              vec3 scattering = scatterColor * subsurface;
              
              color += (reflection + scattering) * surfaceGlow * (1.0 - u_depth_ratio * 2.0);
              
              // 4. Slight transparency near thinner wave edges
              // Mix sky color into the water color right at the top edge of the crests
              float thinEdge = smoothstep(0.015, 0.0, dist) * crestMask;
              color = mix(color, skyColor, thinEdge * 0.25);
              
              // Dynamic Projected Voronoi Caustics
              // Project UVs based on lightDir so the pattern stretches/shifts with the sun angle
              vec2 causticUv = aspectUv + vec2(lightDir.x, 0.0) * dist * 3.0;
              
              float v1 = voronoi(causticUv * 8.0, u_time * 0.8);
              float v2 = voronoi(causticUv * 14.0 + vec2(1.5), u_time * 1.2);
              
              // Invert and sharpen to get classic caustic light bands
              float cPattern = pow(1.0 - sqrt(v1), 3.0) * 0.6 + pow(1.0 - sqrt(v2), 4.0) * 0.4;
              
              // Modulate by subsurface scattering and sun intensity
              float sunIntensity = max(0.0, lightDir.y); // Fades at "sunset"
              vec3 causticColor = vec3(0.4, 0.8, 1.0) * sunIntensity;
              
              color += causticColor * cPattern * smoothstep(0.15, 0.0, dist) * (1.0 - u_depth_ratio * 2.0);
              
              // Procedural Crepuscular Rays (God Rays) via 16-pass radial accumulation
              // 1. Define virtual 2D sun position on screen (above the surface)
              vec2 sunPos = vec2(0.5 + lightDir.x * 0.8, baseSurface + 0.3 + lightDir.y * 0.2);
              
              // 2. Vector from pixel to sun
              vec2 deltaCoord = (sunPos - uv) * 0.04; 
              vec2 texCoo = uv;
              
              float accumulatedLight = 0.0;
              float weight = 0.3; // Initial sampling weight
              
              for (int i = 0; i < 16; i++) {
                  float sampleX = texCoo.x * (u_resolution.x / u_resolution.y);
                  float h = getWaveHeight(sampleX, t);
                  
                  // The moving Gerstner wave crests act as occluders!
                  // Light only passes through the gaps (crests where h > 0)
                  float lightPass = smoothstep(0.0, 0.03, h);
                  
                  accumulatedLight += lightPass * weight;
                  weight *= 0.85; // Attenuate subsequent passes for a soft blur
                  texCoo += deltaCoord;
              }
              
              // Modulate final ray intensity by the sun's angle and user scroll depth
              vec3 rayColor = vec3(0.2, 0.8, 1.0) * max(0.0, lightDir.y);
              
              // smoothstep(0.02, 0.5, dist) ensures rays bloom beautifully *under* the surface
              color += rayColor * accumulatedLight * smoothstep(0.02, 0.5, dist) * (1.0 - u_depth_ratio * 2.0);
          }
      }
      
      // --- Chromatic Fringing (Final Pass) ---
      // We apply a slight channel shift based on distance from center to simulate lens optics
      float fringe = distSq * 0.015 * (1.0 + lensPulse);
      
      // For performance, we don't re-run the entire shader. 
      // Instead, we sample a slightly shifted green/red balance from the final color 
      // and mix in a blue offset.
      vec3 finalColor = color;
      finalColor.r = mix(color.r, color.g, fringe * 0.5);
      finalColor.b = mix(color.b, color.g, -fringe * 0.5);
      
      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function SurfaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

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
    const uScroll = gl.getUniformLocation(program, "u_scroll");
    const uDepthRatio = gl.getUniformLocation(program, "u_depth_ratio");
    const uVelocity = gl.getUniformLocation(program, "u_velocity");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;
    const startTime = performance.now();
    let prevDepth = useStore.getState().depth;
    let smoothedVelocity = 0;

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000.0;
      
      const maxDepth = 4000;
      const currentDepth = useStore.getState().depth;
      const depthRatio = Math.min(currentDepth / maxDepth, 1);
      
      // Calculate velocity
      const velocity = (currentDepth - prevDepth) * 0.1;
      smoothedVelocity += (velocity - smoothedVelocity) * 0.1;
      prevDepth = currentDepth;

      // Matches original parallax timing
      const scrollOffset = currentDepth * 0.8;

      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uScroll, scrollOffset);
      gl.uniform1f(uDepthRatio, depthRatio);
      gl.uniform1f(uVelocity, smoothedVelocity);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none -z-20 block"
      aria-hidden="true"
    />
  );
}
