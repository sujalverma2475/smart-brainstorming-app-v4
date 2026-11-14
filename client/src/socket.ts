import { io } from 'socket.io-client';

// Dev talks to a local server; production falls back to the Render deployment
// unless REACT_APP_SOCKET_URL says otherwise. autoConnect is off: the room hook
// connects only once it knows which room to join.
const SERVER_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://smart-brainstorm-app-1.onrender.com'
    : 'http://localhost:4000');

const socket = io(SERVER_URL, { autoConnect: false });

export default socket;
