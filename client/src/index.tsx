import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactUI from './ReactUI';
import initGame from './initGame';
import './index.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ReactUI />
  </React.StrictMode>
);

initGame()

