import React from 'react';

const AIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 8V4H8" />
    <rect x="4" y="12" width="16" height="8" rx="2" />
    <path d="M12 12v8" />
    <path d="M17.5 12a4.5 4.5 0 1 0-9 0" />
    <path d="M16 12v8" />
    <path d="M8 12v8" />
  </svg>
);

export default AIIcon;