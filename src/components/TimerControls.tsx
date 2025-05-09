import React from 'react';
export const TimerControls = ({
  onClick,
  icon,
  label,
  color
}) => {
  return <button onClick={onClick} className={`${color} hover:opacity-90 text-white rounded-full px-6 py-3 flex items-center justify-center gap-2 shadow-md transition-all`}>
      {icon}
      <span className="font-medium">{label}</span>
    </button>;
};