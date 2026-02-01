
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#073550] p-2 rounded-xl shadow-lg shadow-blue-900/40 border border-white/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white" fillOpacity="0.3"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6Z" fill="white"/>
              <path d="M7 14L8 14L9 15M11 15L12 14L13 14M9.5 11.5L10.5 11.5L11.5 13M10 11.5L9 14M11 11.5L12 14" stroke="#073550" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="14" r="1.2" fill="#073550"/>
              <circle cx="12" cy="14" r="1.2" fill="#073550"/>
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
