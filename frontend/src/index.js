// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

import './i18n';
import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

// تفعيل ثيم Quantum على مستوى الـ body
if (typeof document !== 'undefined' && document.body) {
  document.body.classList.add('quantum-theme');
}

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// قياس الأداء (اختياري)
reportWebVitals();
