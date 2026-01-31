
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("BikeLogic: Avvio applicazione...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("BikeLogic: Elemento root non trovato!");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("BikeLogic: React mounted correttamente.");
  } catch (error: any) {
    console.error("BikeLogic: Errore fatale durante il mount:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: #f87171; font-family: sans-serif; text-align: center;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h1 style="font-size: 24px; font-weight: bold;">Errore di Avvio</h1>
        <p style="color: #94a3b8; margin-top: 10px;">${error.message}</p>
      </div>
    `;
  }
}
