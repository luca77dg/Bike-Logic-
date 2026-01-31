
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/40">
            <i className="fa-solid fa-bicycle text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">BikeLogic <span className="text-blue-500">AI</span></h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Maintenance Master</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-slate-400">Bentornato, Rider</span>
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <i className="fa-solid fa-user text-slate-400"></i>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
      <footer className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} BikeLogic AI. Built for the ride.
      </footer>
    </div>
  );
};
