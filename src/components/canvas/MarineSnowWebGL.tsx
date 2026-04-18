'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';

const MAX_PARTICLES = 2000;

const vertexShaderSource = `
  attribute vec3 a_data; // x, y, seed
  uniform float u_time;
  uniform float u_scroll;
  uniform float u_depth_ratio;
  uniform vec2 u_resolution;
  
  varying float v_blur;
  varying float v_opacity;

  void main() {
    float x = a_data.x;
    float y = a_data.y;
    float seed = a_data.z;
    
    // Procedural movement
    float driftX = sin(u_time * 0.2 + seed * 10.0) * 0.05;
    float driftY = u_time * (0.05 + seed * 0.05) + (u_scroll * 0.001);
    
    vec2 pos = vec2(x + driftX, fract(y - driftY));
    
    // Map from 0-1 to clip space -1 to 1
    gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
    
    // Depth-blur logic: particles further/closer in virtual Z
    float virtualZ = fract(seed * 7.0); // 0 to 1
    
    // Below 1000m (depth_ratio > 0.25), blur intensifies
    float depthFactor = smoothstep(0.25, 1.0, u_depth_ratio);
    v_blur = 0.1 + (virtualZ * 0.8) + (depthFactor * 1.5);
    
    // Size based on blur (bokeh effect)
    gl_PointSize = (4.0 + virtualZ * 12.0) * v_blur;
    
    v_opacity = smoothstep(0.0, 0.2, pos.y) * smoothstep(1.0, 0.8, pos.y);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  varying float v_blur;
  varying float v_opacity;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float dist = length(pc);
    
    // Soft bokeh circle
    float edge = 0.5 / v_blur;
    float alpha = smoothstep(0.5, 0.5 - edge, dist);
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * v_opacity * 0.6);
  }
`;

export default function MarineSnowWebGL() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;

    // Shader setup
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

    // Particle data buffer
    const data = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      data[i * 3 + 0] = Math.random(); // x
      data[i * 3 + 1] = Math.random(); // y
      data[i * 3 + 2] = Math.random(); // seed
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const aData = gl.getAttribLocation(program, 'a_data');
    gl.enableVertexAttribArray(aData);
    gl.vertexAttribPointer(aData, 3, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uScroll = gl.getUniformLocation(program, 'u_scroll');
    const uDepthRatio = gl.getUniformLocation(program, 'u_depth_ratio');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');

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

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000.0;
      const depth = useStore.getState().depth;
      const depthRatio = Math.min(depth / 4000, 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uScroll, depth);
      gl.uniform1f(uDepthRatio, depthRatio);

      gl.drawArrays(gl.POINTS, 0, MAX_PARTICLES);

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
      className="fixed inset-0 pointer-events-none z-[5] mix-blend-screen"
      aria-hidden="true"
    />
  );
}
