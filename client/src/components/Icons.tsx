import React from 'react';

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const PlusIcon = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>;
export const PenIcon = () => <Svg><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></Svg>;
export const EraserIcon = () => (
  <Svg>
    <path d="M20 20H9l-5-5a2 2 0 0 1 0-2.8l9.2-9.2a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L12 20" />
    <path d="M8 11l6 6" />
  </Svg>
);
export const TrashIcon = () => <Svg><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Svg>;
export const LinkIcon = () => (
  <Svg>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </Svg>
);
export const CheckIcon = () => <Svg><path d="M20 6L9 17l-5-5" /></Svg>;
export const CloseIcon = () => <Svg><path d="M18 6L6 18M6 6l12 12" /></Svg>;
export const TidyIcon = () => (
  <Svg>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Svg>
);
export const SnapIcon = () => (
  <Svg>
    <circle cx="6" cy="6" r="1.2" />
    <circle cx="12" cy="6" r="1.2" />
    <circle cx="18" cy="6" r="1.2" />
    <circle cx="6" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="18" cy="12" r="1.2" />
    <circle cx="6" cy="18" r="1.2" />
    <circle cx="12" cy="18" r="1.2" />
    <circle cx="18" cy="18" r="1.2" />
  </Svg>
);
