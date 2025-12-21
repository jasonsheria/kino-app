import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { preloadAgents } from './data/fakedata';

// Preload agents on app bootstrap and wait (up to timeout) before first render
(async function bootstrap() {
  try {
    await preloadAgents(6000); // wait up to 6s for agents; adjust if needed
  } catch (e) {
    // proceed even if agents failed to load
  }
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
