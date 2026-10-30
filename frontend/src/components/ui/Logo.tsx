"use client";

import React from "react";

interface LogoProps {
  className?: string;
  showGlow?: boolean;
}

export function Logo({ className = "h-8 w-8", showGlow = false }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 bg-cyan-500/25 blur-md rounded-xl" />
      )}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 select-none"
      >
        <defs>
          {/* Gradiente do Topo (Fluxo / Visao Executiva) */}
          <linearGradient id="logo-top-g" x1="9.5" y1="8.5" x2="30.5" y2="20.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Gradiente da Esquerda (Base Operacional / Estoque) */}
          <linearGradient id="logo-left-g" x1="9.5" y1="16.5" x2="19" y2="32.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          {/* Gradiente da Direita (Motor Preditivo D-Day & IA) */}
          <linearGradient id="logo-right-g" x1="21" y1="16.5" x2="30.5" y2="32.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Moldura Base Arredondada (Obsidian Glass Tile) */}
        <rect
          x="1.5"
          y="1.5"
          width="37"
          height="37"
          rx="9"
          className="dark:fill-[#0A0E1A] fill-slate-50 dark:stroke-cyan-500/30 stroke-slate-300"
          strokeWidth="1.2"
        />

        {/* Faceta Superior - Fluxo da Cadeia de Suprimentos */}
        <path
          d="M 20 8.5 L 30.5 14.5 L 20 20.5 L 9.5 14.5 Z"
          fill="url(#logo-top-g)"
          opacity="0.95"
        />

        {/* Faceta Esquerda - Armazenagem e Cobertura */}
        <path
          d="M 9.5 16.5 L 19 21.8 L 19 32.5 L 9.5 27.2 Z"
          fill="url(#logo-left-g)"
          opacity="0.85"
        />

        {/* Faceta Direita - Motor D-Day e Inteligencia RN */}
        <path
          d="M 21 21.8 L 30.5 16.5 L 30.5 27.2 L 21 32.5 Z"
          fill="url(#logo-right-g)"
          opacity="0.9"
        />

        {/* Nucleo Central de Decisao (Gleam Node) */}
        <circle cx="20" cy="20.5" r="2.8" fill="#FFFFFF" />
        <circle cx="20" cy="20.5" r="1.4" fill="#0891B2" />

        {/* Arestas de Destaque / Refletividade Minimalista */}
        <path
          d="M 12 13.5 L 20 9 L 28 13.5"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
      </svg>
    </div>
  );
}
