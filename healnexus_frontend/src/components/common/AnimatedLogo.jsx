import React from 'react';
import './AnimatedLogo.css';

const AnimatedLogo = () => {
  return (
    <div className="flex items-center logo-container">
      <div className="w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 120 100" className="w-full h-full animated-logo-svg">
          <path
            className="heartbeat-path"
            d="M0,50 L20,50 L30,20 L40,80 L50,50 L70,50 C70,30 95,30 95,50 C95,70 70,90 70,90 C70,90 45,70 45,50 C45,30 70,30 70,50"
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-xl font-bold text-slate-800 dark:text-white ml-1">HealNexus</span>
    </div>
  );
};

export default AnimatedLogo;
