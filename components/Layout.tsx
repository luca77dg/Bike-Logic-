
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0e4d7d] rounded-2xl shadow-xl shadow-blue-900/30 border border-white/10 flex items-center justify-center shrink-0">
            {/* Logo BikeLogic AI - Minimalist Edition */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
              {/* Gear Ring - Bold & Simple */}
              <circle cx="50" cy="50" r="38" stroke="white" strokeWidth="12"/>
              {/* Precision Teeth - 4 points for clarity */}
              <rect x="44" y="0" width="12" height="15" fill="white" rx="2"/>
              <rect x="44" y="85" width="12" height="15" fill="white" rx="2"/>
              <rect x="0" y="44" width="15" height="12" fill="white" rx="2"/>
              <rect x="85" y="44" width="15" height="12" fill="white" rx="2"/>
              {/* Minimalist Bike Symbol */}
              <circle cx="35" cy="55" r="10" stroke="white" strokeWidth="6"/>
              <circle cx="65" cy="55" r="10" stroke="white" strokeWidth="6"/>
              <path d="M35 55L50 40H65L65 55" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
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
