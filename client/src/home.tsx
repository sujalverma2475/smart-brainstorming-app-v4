import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { colorForUser, darkenColor } from './utils/color';
import './App.css';

// Must match the server's ROOM_RE (letters, digits, "_" and "-", max 32).
const ROOM_RE = /^[\w-]{1,32}$/;

const SAMPLE_NOTES = [
  { user: 'Asha', text: 'What if onboarding took two minutes?', x: '4%', y: '8%', tilt: -3 },
  { user: 'Ben', text: 'Ask five users before we build anything', x: '48%', y: '2%', tilt: 2.5 },
  { user: 'Mei', text: 'Ship the small version first', x: '12%', y: '50%', tilt: 1.5 },
  { user: 'Dev', text: 'Vote on favourites at 4 pm', x: '54%', y: '46%', tilt: -2 },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => navigate(`/room/${uuidv4().slice(0, 6)}`);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const id = roomInput.trim();
    if (!ROOM_RE.test(id)) {
      setError('Room codes use letters, numbers, "-" and "_" (up to 32 characters).');
      return;
    }
    navigate(`/room/${id}`);
  };

  return (
    <main className="home">
      <section className="home__intro">
        <p className="brand brand--large">
          <span className="brand__mark" aria-hidden="true" />
          Brainstorm
        </p>
        <h1>Think out loud, together.</h1>
        <p className="home__lede">
          Open a room, drop sticky notes and sketch on a shared board. Everyone in the room sees
          every change as it happens.
        </p>

        <button className="btn-primary" onClick={handleCreateRoom}>
          Start a new room
        </button>

        <form className="home__join" onSubmit={handleJoinRoom}>
          <label className="sr-only" htmlFor="room-code">Room code</label>
          <input
            id="room-code"
            type="text"
            placeholder="Have a room code?"
            value={roomInput}
            onChange={(e) => {
              setRoomInput(e.target.value);
              setError('');
            }}
          />
          <button type="submit" className="btn-secondary">Join</button>
        </form>
        {error && <p className="home__error" role="alert">{error}</p>}
      </section>

      <section className="home__preview" aria-hidden="true">
        {SAMPLE_NOTES.map((n) => {
          const c = colorForUser(n.user);
          return (
            <div
              key={n.user}
              className="sticky-note sticky-note--static"
              style={{ left: n.x, top: n.y, transform: `rotate(${n.tilt}deg)`, backgroundColor: c }}
            >
              <div className="sticky-note__bar" style={{ backgroundColor: darkenColor(c, 10) }}>
                <span className="sticky-note__handle">{n.user}</span>
              </div>
              <p className="sticky-note__text sticky-note__text--static">{n.text}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
};

export default Home;
