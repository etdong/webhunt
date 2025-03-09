import './index.css'
import ReactDOM from 'react-dom/client';
import ReactUI from './pages/ReactUI';
import Login from './pages/Login';
import initGame from "src/initGame";
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <BrowserRouter>
      <Routes> {/* The Routes decides which component to show based on the current URL.*/}
      <Route path='/' element={<ReactUI />}></Route>
      <Route path='/login' element={<Login />}></Route>
    </Routes>
  </BrowserRouter>
);

initGame();
