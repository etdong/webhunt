import { io } from 'socket.io-client';

// create a singleton socket connection to the server
const socket = io("https://webhunt.onrender.com");

export default socket;