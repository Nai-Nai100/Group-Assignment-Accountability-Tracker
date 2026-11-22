import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { applyTheme, savedTheme } from './theme.js';

applyTheme(savedTheme()); // before the first render, so the page doesn't flash the wrong theme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
