import './main.css';
// CoStudy wall redesign — clay design system (order matters: base → pages → clay → desktop → app patches)
import './styles/wall-base.css';
import './styles/wall-pages.css';
import './styles/wall-clay.css';
import './styles/wall-desktop.css';
import './styles/wall-app.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);