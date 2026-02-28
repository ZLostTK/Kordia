import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sileo';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registra el Service Worker de forma automática
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-center" 
        options={{
          fill: "#171717",
          roundness: 12,
          styles: {
            title: "!text-[#FFFFFF]",
            description: "!text-[#D1D5DB]"
          }
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
