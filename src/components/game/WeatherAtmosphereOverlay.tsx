'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/game/store';
import { resolveWeatherProfileId } from '@/game/hydrologyEngine';
import type { WeatherProfileId } from '@/game/weatherEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  fadeSpeed: number;
  color?: string;
  wobble?: number;
  wobbleSpeed?: number;
}

export function WeatherAtmosphereOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hydrology = useGameStore(state => state.hydrology);
  const activeWeatherId: WeatherProfileId = resolveWeatherProfileId(hydrology?.weatherCondition);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = [];
    const isPrecipitation = ['drizzle', 'rain', 'monsoon', 'sunshower', 'thunderstorm', 'supercell_deluge', 'alchemical_monsoon'].includes(activeWeatherId);
    const isSnow = ['snow', 'polar_vortex', 'frost'].includes(activeWeatherId);
    const isHeat = ['heatwave', 'drought', 'plasma_firestorm', 'haboob_sandstorm'].includes(activeWeatherId);
    const isSunny = activeWeatherId === 'sunny';

    // Target particle count based on intensity
    let maxParticles = 0;
    if (activeWeatherId === 'monsoon' || activeWeatherId === 'supercell_deluge') maxParticles = 140;
    else if (activeWeatherId === 'rain' || activeWeatherId === 'thunderstorm') maxParticles = 90;
    else if (activeWeatherId === 'drizzle' || activeWeatherId === 'sunshower') maxParticles = 45;
    else if (isSnow) maxParticles = 65;
    else if (isHeat) maxParticles = 35;
    else if (isSunny) maxParticles = 25; // Gentle golden pollen/dust spores
    else maxParticles = 20; // Ambient dust/motes

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(width, height, activeWeatherId, isPrecipitation, isSnow, isHeat, true));
    }

    function createParticle(
      w: number,
      h: number,
      weather: WeatherProfileId,
      isRain: boolean,
      isCold: boolean,
      isHot: boolean,
      randomY = false
    ): Particle {
      const x = Math.random() * w;
      const y = randomY ? Math.random() * h : -20;

      if (isRain) {
        const isDeluge = weather === 'monsoon' || weather === 'supercell_deluge';
        const speed = isDeluge ? 14 + Math.random() * 8 : (weather === 'drizzle' ? 5 + Math.random() * 3 : 9 + Math.random() * 5);
        const slant = weather === 'thunderstorm' || weather === 'cyclone' ? -3 + Math.random() * 6 : 0.8;
        return {
          x,
          y,
          vx: slant,
          vy: speed,
          size: weather === 'drizzle' ? 1.2 : 2.0,
          alpha: 0.35 + Math.random() * 0.45,
          maxAlpha: 0.8,
          fadeSpeed: 0.01,
          color: weather === 'alchemical_monsoon' ? 'rgba(52, 211, 153, ' : 'rgba(147, 197, 253, ',
        };
      }

      if (isCold) {
        return {
          x,
          y,
          vx: -1.2 + Math.random() * 2.4,
          vy: 1.5 + Math.random() * 2.5,
          size: 1.8 + Math.random() * 2.8,
          alpha: 0.4 + Math.random() * 0.5,
          maxAlpha: 0.85,
          fadeSpeed: 0.005,
          color: 'rgba(240, 249, 255, ',
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
        };
      }

      if (isHot) {
        return {
          x,
          y: randomY ? Math.random() * h : h + 10,
          vx: -0.5 + Math.random() * 1.0,
          vy: -(1.0 + Math.random() * 2.0),
          size: 2.0 + Math.random() * 3.0,
          alpha: 0.15 + Math.random() * 0.3,
          maxAlpha: 0.5,
          fadeSpeed: 0.008,
          color: weather === 'plasma_firestorm' ? 'rgba(239, 68, 68, ' : 'rgba(245, 158, 11, ',
        };
      }

      // Sunny / Ambient pleasant pollen & floating spores
      return {
        x,
        y: randomY ? Math.random() * h : Math.random() * h,
        vx: -0.3 + Math.random() * 0.6,
        vy: -0.4 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.35,
        maxAlpha: 0.6,
        fadeSpeed: 0.006,
        color: 'rgba(253, 230, 138, ',
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.015,
      };
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Thunderstorm random subtle screen flash
      if ((activeWeatherId === 'thunderstorm' || activeWeatherId === 'supercell_deluge') && Math.random() < 0.004) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isPrecipitation) {
          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.strokeStyle = `${p.color}${p.alpha})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2.2, p.y + p.vy * 2.2);
          ctx.stroke();

          if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
            particles[i] = createParticle(width, height, activeWeatherId, isPrecipitation, isSnow, isHeat, false);
          }
        } else if (isSnow) {
          if (p.wobble !== undefined && p.wobbleSpeed) {
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * 0.8 + p.vx;
          } else {
            p.x += p.vx;
          }
          p.y += p.vy;

          ctx.beginPath();
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y > height + 10 || p.x < -20 || p.x > width + 20) {
            particles[i] = createParticle(width, height, activeWeatherId, isPrecipitation, isSnow, isHeat, false);
          }
        } else if (isHeat) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha += p.fadeSpeed;
          if (p.alpha > p.maxAlpha || p.alpha < 0.05) p.fadeSpeed = -p.fadeSpeed;

          ctx.beginPath();
          ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y < -10) {
            particles[i] = createParticle(width, height, activeWeatherId, isPrecipitation, isSnow, isHeat, false);
          }
        } else {
          // Sunny floating pollen / embers
          if (p.wobble !== undefined && p.wobbleSpeed) {
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * 0.4 + p.vx;
          } else {
            p.x += p.vx;
          }
          p.y += p.vy;

          ctx.beginPath();
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y < -10 || p.y > height + 10 || p.x < -10 || p.x > width + 10) {
            particles[i] = createParticle(width, height, activeWeatherId, isPrecipitation, isSnow, isHeat, false);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeWeatherId, windowSize]);

  // Ambient lighting gradient per weather condition
  let ambientLightingStyle = '';
  if (activeWeatherId === 'heatwave' || activeWeatherId === 'drought') {
    ambientLightingStyle = 'bg-radial from-amber-500/5 via-transparent to-orange-950/10';
  } else if (activeWeatherId === 'rain' || activeWeatherId === 'monsoon' || activeWeatherId === 'thunderstorm') {
    ambientLightingStyle = 'bg-slate-950/10';
  } else if (activeWeatherId === 'snow' || activeWeatherId === 'polar_vortex') {
    ambientLightingStyle = 'bg-sky-200/5';
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-20 overflow-hidden transition-colors duration-1000 ${ambientLightingStyle}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}

