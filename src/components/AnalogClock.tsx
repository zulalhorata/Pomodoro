// Define the props type
interface AnalogClockProps {
  timeLeft: number;
  totalTime: number;
  isBreak: boolean;
}

export const AnalogClock = ({
  timeLeft,
  totalTime,
  isBreak
}: AnalogClockProps) => {
  // Calculate the progress as a percentage
  const progress = 1 - timeLeft / totalTime;
  // Calculate degrees for the hand rotation (0 at top, clockwise)
  const degrees = progress * 360;
  // Size parameters
  const size = 240;
  const center = size / 2;
  const strokeWidth = 8;
  const radius = center - strokeWidth;
  // Colors
  const workColor = '#4f46e5'; // indigo
  const breakColor = '#0ea5e9'; // sky blue
  const backgroundColor = '#e0e7ff'; // light indigo
  return <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="white" stroke={backgroundColor} strokeWidth={strokeWidth} />
        {/* Progress arc */}
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke={isBreak ? breakColor : workColor} strokeWidth={strokeWidth} strokeDasharray={2 * Math.PI * radius} strokeDashoffset={2 * Math.PI * radius * (1 - progress)} transform={`rotate(-90 ${center} ${center})`} strokeLinecap="round" />
        {/* Clock markers */}
        {[...Array(12)].map((_, i) => {
        const angle = i * 30 * Math.PI / 180;
        const markerLength = i % 3 === 0 ? 15 : 8;
        const x1 = center + (radius - markerLength) * Math.sin(angle);
        const y1 = center - (radius - markerLength) * Math.cos(angle);
        const x2 = center + radius * Math.sin(angle);
        const y2 = center - radius * Math.cos(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth={i % 3 === 0 ? 3 : 2} />;
      })}
        {/* Clock hand */}
        <line x1={center} y1={center} x2={center + radius * 0.7 * Math.sin(degrees * Math.PI / 180)} y2={center - radius * 0.7 * Math.cos(degrees * Math.PI / 180)} stroke={isBreak ? breakColor : workColor} strokeWidth={4} strokeLinecap="round" />
        {/* Center dot */}
        <circle cx={center} cy={center} r={8} fill={isBreak ? breakColor : workColor} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-sm font-medium px-2 py-1 rounded-full ${isBreak ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'}`}>
          {isBreak ? 'Break' : 'Focus'}
        </div>
      </div>
    </div>;
};