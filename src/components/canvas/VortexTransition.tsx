'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VORTEX_FRAG = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_intensity;

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    float angle = atan(uv.y, uv.x);
    float dist = length(uv);
    
    // Vortex spiral
    float spiral = sin(angle * 3.0 + dist * 10.0 - u_time * 5.0);
    float glow = 0.01 / (abs(spiral) * dist);
    
    // Tunnel effect
    float tunnel = smoothstep(0.8, 0.0, dist);
    
    vec3 color = vec3(0.0, 0.5, 0.8) * glow * u_intensity;
    color += vec3(0.0, 0.1, 0.2) * tunnel;
    
    gl_FragColor = vec4(color, u_intensity);
  }
`;

export default function VortexTransition({ isActive, onComplete }: { isActive: boolean, onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (!isActive) {
        setIntensity(0);
        return;
    }

    const gl = canvasRef.current?.getContext('webgl');
    if (!gl) return;

    // Minimal WebGL setup
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, `attribute vec2 p; void main(){ gl_Position=vec4(p,0,1); }`);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, VORTEX_FRAG);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const pos = gl.getAttribLocation(prog, 'p');
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uIntensity = gl.getUniformLocation(prog, 'u_intensity');

    let start = performance.now();
    let frame: number;

    const loop = (t: number) => {
        const elapsed = (t - start) / 1000;
        
        // Intensity curve: 0 -> 1 -> 0 over 1.5s
        const duration = 1.5;
        const progress = Math.min(elapsed / duration, 1);
        const currentIntensity = Math.sin(progress * Math.PI);
        setIntensity(currentIntensity);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(uRes, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(uTime, elapsed);
        gl.uniform1f(uIntensity, currentIntensity);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (progress < 1) {
            frame = requestAnimationFrame(loop);
        } else {
            onComplete();
        }
    };

    const resize = () => {
        if (!canvasRef.current) return;
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    frame = requestAnimationFrame(loop);
    return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
    };
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.5 }}
          exit={{ opacity: 0, scale: 3 }}
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex items-center justify-center bg-[#020810]"
        >
          <canvas ref={canvasRef} className="w-full h-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
