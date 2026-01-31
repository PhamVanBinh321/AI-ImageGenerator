import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
    <div
        className={`animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-500 h-12 w-12 ${className}`}
    ></div>
);

export default Spinner;
