
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0e4d7d] rounded-2xl shadow-xl shadow-blue-900/30 border border-white/10 flex items-center justify-center shrink-0">
            {/* Logo BikeLogic AI - Pure Minimalist Bike */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
              {/* Rear Wheel */}
              <circle cx="30" cy="65" r="16" stroke="white" strokeWidth="12"/>
              {/* Front Wheel */}
              <circle cx="70" cy="65" r="16" stroke="white" strokeWidth="12"/>
              {/* Frame & Handlebar - Simplified Bold Lines */}
              <path d="M30 65L46 38H62L70 65" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M62 38L68 25H78" stroke="white" strokeWidth="12" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white leading-none">BikeLogic <span className="text-blue-400">AI</span></h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.35em] font-black mt-1">Maintenance Master</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-slate-500">Ride Safe</span>
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
            <i className="fa-solid fa-user text-slate-500"></i>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
      <footer className="mt-20 pt-8 border-t border-slate-900/50 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
        &copy; {new Date().getFullYear()} BikeLogic AI. Built for the ride.
      </footer>
    </div>
  );
};
