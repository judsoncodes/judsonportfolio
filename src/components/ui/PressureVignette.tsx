'use client';

import { useEffect, useRef } from 'react';
import { useStore } from "@/lib/store/useStore";

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
  uniform float u_depth_ratio;

  // Simple hash for pressure noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 centeredUv = uv - 0.5;
    
    // 1. Radial Vignette
    float dist = length(centeredUv);
    
    // Pressure pulses slightly with time
    float pulse = sin(u_time * 2.0) * 0.02 * u_depth_ratio;
    float vignette = smoothstep(0.3 + pulse, 0.8 + pulse, dist);
    
    // 2. Pressure Static / Noise
    // Noise gets grainier and more intense at depth
    float noise = hash(uv + u_time) * 0.15 * u_depth_ratio * smoothstep(0.2, 0.7, dist);
    
    // 3. Light Loss (Darkening)
    // Corners darken much more aggressively as depth_ratio -> 1.0
    float darken = vignette * u_depth_ratio * 1.2;
    
    // Final composite color (Black with noise)
    vec3 color = vec3(0.0);
    float alpha = clamp(darken + noise, 0.0, 0.95);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function PressureVignette() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const depthPercent = useStore((state) => state.depthPercent);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
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
    const uDepthRatio = gl.getUniformLocation(program, "u_depth_ratio");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000.0;
      const state = useStore.getState();
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uDepthRatio, state.depthPercent);
      
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
    <>
      {/* CSS-based desaturation mask (Layer 1) */}
      <div 
        className="fixed inset-0 z-[70] pointer-events-none transition-opacity duration-1000"
        style={{
          backdropFilter: `grayscale(${depthPercent * 80}%) brightness(${100 - depthPercent * 40}%)`,
          WebkitMaskImage: `radial-gradient(circle, transparent 30%, black 100%)`,
          maskImage: `radial-gradient(circle, transparent 30%, black 100%)`,
          opacity: depthPercent > 0.3 ? (depthPercent - 0.3) / 0.7 : 0
        }}
      />
      
      {/* WebGL-based pressure noise and darkening (Layer 2) */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-[71] pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}
