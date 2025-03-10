import { io } from 'socket.io-client';

const socket = io("https://webhunt.onrender.com");

export default socket;