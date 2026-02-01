
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#0e4d7d] rounded-[1.4rem] shadow-xl shadow-blue-900/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {/* Logo BikeLogic AI - Versione Professionale Ultra-Visible */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[85%] h-[85%]">
              {/* Ingranaggio Esterno Solido */}
              <path 
                d="M50 15C48 15 46 13 46 11V5C46 2.2 47.8 0 50 0C52.2 0 54 2.2 54 5V11C54 13 52 15 50 15ZM74.7 25.3C73.3 23.9 73.3 21.1 74.7 19.7L78.9 15.5C80.9 13.5 84.1 13.5 86.1 15.5C88.1 17.5 88.1 20.7 86.1 22.7L81.9 26.9C80.5 28.3 77.7 28.3 76.3 26.9L74.7 25.3ZM89 54H85C83 54 81 52 81 50C81 48 83 46 85 46H91C93.8 46 96 47.8 96 50C96 52.2 93.8 54 91 54H89ZM74.7 76.3C73.3 74.9 73.3 72.1 74.7 70.7L78.9 66.5C80.9 64.5 84.1 64.5 86.1 66.5C88.1 68.5 88.1 71.7 86.1 73.7L81.9 77.9C80.5 79.3 77.7 79.3 76.3 77.9L74.7 76.3ZM50 85C52 85 54 87 54 89V95C54 97.8 52.2 100 50 100C47.8 100 46 97.8 46 95V89C46 87 48 85 50 85ZM25.3 74.7C26.7 76.1 26.7 78.9 25.3 80.3L21.1 84.5C19.1 86.5 15.9 86.5 13.9 84.5C11.9 82.5 11.9 79.3 13.9 77.3L18.1 73.1C19.5 71.7 22.3 71.7 23.7 73.1L25.3 74.7ZM11 46H15C17 46 19 48 19 50C19 52 17 54 15 54H9C6.2 54 4 52.2 4 50C4 47.8 6.2 46 9 46H11ZM25.3 23.7C26.7 25.1 26.7 27.9 25.3 29.3L21.1 33.5C19.1 35.5 15.9 35.5 13.9 33.5C11.9 31.5 11.9 28.3 13.9 26.3L18.1 22.1C19.5 20.7 22.3 20.7 23.7 22.1L25.3 23.7Z" 
                fill="white"
              />
              <circle cx="50" cy="50" r="34" stroke="white" strokeWidth="10" fill="none"/>
              
              {/* Silhouette Bici Ultra-Spessa */}
              <g transform="translate(26, 38) scale(2.8)">
                <circle cx="4" cy="11" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="13" cy="11" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
                <path d="M4 11L7.5 5.5H12L13.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="-1" y1="16" x2="18" y2="16" stroke="white" strokeWidth="1.2"/>
              </g>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white leading-none">BikeLogic <span className="text-blue-400">AI</span></h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.35em] font-black mt-1">Maintenance Master</p>
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
