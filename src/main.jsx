import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

console.log('APP BOOT: main entry loaded');

const rootSelector = document.getElementById('root');
const bootMarker = document.getElementById('boot-marker');

function removeBootMarker() {
  if (bootMarker && bootMarker.parentNode) {
    bootMarker.parentNode.removeChild(bootMarker);
  }
}

function renderFatalFallback(error) {
  if (!rootSelector) return;
  rootSelector.innerHTML = `
    <section class="fatal-fallback">
      <h1>App failed to start</h1>
      <p>Open DevTools Console.</p>
      <details style="margin-top:12px;max-width:560px;">
        <summary>View error</summary>
        <pre>${error.message}</pre>
      </details>
    </section>
  `;
}

try {
  const root = ReactDOM.createRoot(rootSelector);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
  console.log('APP BOOT: mounted');
} catch (error) {
  console.error('APP BOOT: fatal error', error);
  renderFatalFallback(error);
} finally {
  removeBootMarker();
}
