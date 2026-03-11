'use client';

import { useRef, useEffect, useCallback } from 'react';

class Smoke {
  x: number; y: number;
  vx: number; vy: number;
  size: number; growRate: number;
  opacity: number; fadeRate: number;
  life: number; wobble: number; wobbleSpeed: number;

  constructor(x: number, y: number, boost = false) {
    this.x = x + (Math.random() - 0.5) * 14;
    this.y = y;
    this.vx = (Math.random() - 0.5) * (boost ? 2.5 : 1.5);
    this.vy = -(Math.random() * (boost ? 3.5 : 2.5) + 1.5);
    this.size = Math.random() * (boost ? 12 : 8) + 4;
    this.growRate = Math.random() * 0.4 + 0.15;
    this.opacity = Math.random() * 0.35 + 0.15;
    this.fadeRate = Math.random() * 0.004 + 0.002;
    this.life = 1;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.03 + 0.01;
  }

  update() {
    this.wobble += this.wobbleSpeed;
    this.x += this.vx + Math.sin(this.wobble) * 0.4;
    this.y += this.vy;
    this.vy *= 0.997;
    this.size += this.growRate;
    this.life -= this.fadeRate;
    return this.life > 0;
  }

  draw(c: CanvasRenderingContext2D) {
    const a = this.life * this.opacity;
    if (a <= 0) return;
    const g = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    g.addColorStop(0, `rgba(190, 190, 205, ${a})`);
    g.addColorStop(0.5, `rgba(170, 170, 188, ${a * 0.5})`);
    g.addColorStop(1, `rgba(150, 150, 168, 0)`);
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fillStyle = g;
    c.fill();
  }
}

class Spark {
  x: number; y: number;
  vx: number; vy: number;
  size: number; life: number; fade: number;

  constructor(x: number, y: number) {
    this.x = x + (Math.random() - 0.5) * 14;
    this.y = y + (Math.random() - 0.5) * 6;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = -(Math.random() * 2 + 0.5);
    this.size = Math.random() * 2 + 0.8;
    this.life = 1;
    this.fade = Math.random() * 0.04 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.fade;
    return this.life > 0;
  }

  draw(c: CanvasRenderingContext2D) {
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fillStyle = `rgba(255, ${Math.floor(120 + 100 * this.life)}, 0, ${this.life})`;
    c.fill();
  }
}

interface UseSmokeCanvasOptions {
  emberRef: React.RefObject<HTMLDivElement | null>;
}

export default function useSmokeCanvas({ emberRef }: UseSmokeCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Smoke[]>([]);
  const sparks = useRef<Spark[]>([]);
  const rafId = useRef<number>(0);

  // 캔버스 리사이즈
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = devicePixelRatio;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // 엠버 위치 (캔버스 기준)
  const getEmberPos = useCallback(() => {
    const ember = emberRef.current;
    const canvas = canvasRef.current;
    if (!ember || !canvas) return { x: 0, y: 0 };
    const r = ember.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2 - cr.left, y: r.top - cr.top };
  }, [emberRef]);

  // 입 위치 (화면 하단)
  const getMouthPos = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const cr = canvas.getBoundingClientRect();
    return { x: cr.width / 2, y: cr.height - 30 };
  }, []);

  // 연기 방출
  const emitSmoke = useCallback((count = 3, boost = false, fromMouth = false) => {
    const p = fromMouth ? getMouthPos() : getEmberPos();
    for (let i = 0; i < count; i++) {
      particles.current.push(new Smoke(p.x, p.y, boost));
    }
  }, [getEmberPos, getMouthPos]);

  // 불꽃 방출
  const emitSparks = useCallback(() => {
    const pos = getEmberPos();
    if (Math.random() > 0.4) {
      sparks.current.push(new Spark(pos.x, pos.y));
    }
  }, [getEmberPos]);

  // 파티클 초기화
  const clearParticles = useCallback(() => {
    particles.current = [];
    sparks.current = [];
  }, []);

  // 애니메이션 루프
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function animate() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      particles.current = particles.current.filter(p => p.update());
      particles.current.forEach(p => p.draw(ctx));

      sparks.current = sparks.current.filter(s => s.update());
      sparks.current.forEach(s => s.draw(ctx));

      rafId.current = requestAnimationFrame(animate);
    }

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafId.current);
    };
  }, [resizeCanvas]);

  return { canvasRef, emitSmoke, emitSparks, clearParticles };
}
