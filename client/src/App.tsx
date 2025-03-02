import React from 'react';
import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';
const socket = io("http://localhost:2001");

function App() {
  window.onload = () => {
    let canvas = document.getElementById('ctx') as HTMLCanvasElement;
    canvas.height = canvas.width * 1;
    let ctx = canvas.getContext('2d');
    
    socket.on('socket_info', (data) => {
      if (ctx) {
        ctx.clearRect(0, 0, 500, 500);
        for (let i in data) {
          ctx.fillText(data[i].id, data[i].x, data[i].y);
          if (data[i].x > 500) data[i].x = 0;
        }
      }
    });
  };
  

  return (
    <div className="App">
      <canvas id='ctx'/>
    </div>
  );
}

export default App;
