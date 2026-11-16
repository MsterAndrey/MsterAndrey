import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró #root');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
