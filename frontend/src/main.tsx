import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh: () => {
      if (confirm('New content available. Reload to update?')) {
        window.location.reload();
      }
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
