# 🧠 Smart Brainstorm App

An intelligent, real-time collaborative brainstorming platform with draggable sticky notes, a live whiteboard, and room-based collaboration.

## 🚀 Features
- Create or join brainstorming rooms
- Real-time syncing using WebSockets (Socket.IO), with server-side room state so late joiners and reconnects see the full board
- Draggable sticky notes with user color tagging
- Collaborative whiteboard (pen, eraser, clear) that persists per room and works with touch/pen
- Separate sticky notes for each user, plus a live presence list
- Fully responsive, clean UI

## 🛠️ Tech Stack
- React.js
- Node.js
- Socket.IO
- HTML 
- Render for Deployment

## 📦 How to Run Locally
1. Clone the repository
2. Run `npm install` in both `client/` and `server/`
3. `npm run dev` in `server/` (port 4000) and `npm start` in `client/`
4. Open `http://localhost:3000`

### Config
- Server: `PORT`, `CLIENT_ORIGIN` (comma-separated allowed origins)
- Client: `REACT_APP_SOCKET_URL` (see `client/.env.example`)

See `INTERVIEW_NOTES.md` for design decisions and trade-offs.

## 🌱 Future Enhancements
- User authentication
- Export brainstorm session as PDF
- AI suggestion for notes


