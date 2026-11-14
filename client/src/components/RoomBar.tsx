import React, { useState } from 'react';
import { CheckIcon, LinkIcon } from './Icons';

const RoomBar: React.FC<{ roomId?: string }> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this room link:', window.location.href);
    }
  };

  return (
    <div className="roombar">
      <a className="brand" href="#/" aria-label="Back to home">
        <span className="brand__mark" aria-hidden="true" />
        Brainstorm
      </a>
      <span className="roombar__code" title="Room code">{roomId}</span>
      <button className="chip-btn" onClick={copyLink}>
        {copied ? <CheckIcon /> : <LinkIcon />}
        <span>{copied ? 'Link copied' : 'Copy link'}</span>
      </button>
    </div>
  );
};

export default RoomBar;
