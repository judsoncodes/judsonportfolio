'use client';

import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_opacity;
  attribute float a_size;
  varying float v_opacity;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = a_size;
    v_opacity = a_opacity;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying float v_opacity;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.2, d) * v_opacity;
    gl_FragColor = vec4(0.0, 0.89, 1.0, alpha); // Cyan-teal
  }
`;

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const gl = canvasRef.current.getContext('webgl');
    if (!gl) return;

    // Shader setup
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const opacityLoc = gl.getAttribLocation(program, 'a_opacity');
    const sizeLoc = gl.getAttribLocation(program, 'a_size');

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Initial particles
    particlesRef.current = Array.from({ length: 30 }).map(() => ({
      x: 0, y: 0, vx: 0, vy: 0, opacity: 0, size: Math.random() * 10 + 5
    }));

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * -2 + 1
      };
    };

    window.addEventListener('mousemove', onMouseMove);

    const render = () => {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      const data: number[] = [];
      particlesRef.current.forEach((p, i) => {
        // Simple easing follow
        const target = mouseRef.current;
        if (i === 0) {
          p.x = target.x;
          p.y = target.y;
          p.opacity = 1.0;
        } else {
          const prev = particlesRef.current[i - 1];
          p.x += (prev.x - p.x) * 0.4;
          p.y += (prev.y - p.y) * 0.4;
          p.opacity = prev.opacity * 0.92;
        }

        data.push(p.x, p.y, p.opacity, p.size);
      });

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

      gl.enableVertexAttribArray(opacityLoc);
      gl.vertexAttribPointer(opacityLoc, 1, gl.FLOAT, false, 16, 8);

      gl.enableVertexAttribArray(sizeLoc);
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 16, 12);

      gl.drawArrays(gl.POINTS, 0, 30);
      requestAnimationFrame(render);
    };

    const handleResize = () => {
        if (!canvasRef.current) return;
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[1000] pointer-events-none" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
