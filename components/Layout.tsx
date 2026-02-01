
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0e4d7d] rounded-2xl shadow-lg shadow-blue-900/40 border border-white/10 flex items-center justify-center overflow-hidden">
            {/* Replica Esatta Icona BikeLogic AI */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1.5">
              {/* Gear Body */}
              <circle cx="50" cy="50" r="32" stroke="white" strokeWidth="10" fill="none"/>
              {/* Gear Teeth */}
              <g fill="white">
                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                  <rect key={deg} x="46" y="8" width="8" height="12" rx="1" transform={`rotate(${deg} 50 50)`}/>
                ))}
              </g>
              {/* Bike Silhouette */}
              <g transform="translate(32, 42) scale(2.2)">
                <circle cx="4" cy="11" r="3" stroke="white" strokeWidth="1.2" fill="none"/>
                <circle cx="13" cy="11" r="3" stroke="white" strokeWidth="1.2" fill="none"/>
                <path d="M4 11L7 6H11L13 11" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 6L9 11M10 6L10 11" stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
                <line x1="-2" y1="15" x2="19" y2="15" stroke="white" strokeWidth="0.8"/>
              </g>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">BikeLogic <span className="text-blue-400">AI</span></h1>
            <p className="text-slate-500 text-[9px] uppercase tracking-[0.3em] font-black mt-1">Maintenance Master</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-slate-500">Bentornato, Rider</span>
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
