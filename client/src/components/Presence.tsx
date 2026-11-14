import React from 'react';
import { Peer } from '../types';
import { colorForUser } from '../utils/color';

const MAX_SHOWN = 5;

const initials = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const Presence: React.FC<{ peers: Peer[]; me: string }> = ({ peers, me }) => {
  const shown = peers.slice(0, MAX_SHOWN);
  const extra = peers.length - shown.length;

  return (
    <div className="presence" aria-label={`${peers.length} people in this room`}>
      {shown.map((p) => (
        <span
          key={p.id}
          className="presence__avatar"
          style={{ backgroundColor: colorForUser(p.name) }}
          title={p.name === me ? `${p.name} (you)` : p.name}
        >
          {initials(p.name)}
        </span>
      ))}
      {extra > 0 && <span className="presence__avatar presence__more">+{extra}</span>}
    </div>
  );
};

export default Presence;
