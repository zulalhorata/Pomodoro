import React, { useEffect, useState } from 'react';
import { AnalogClock } from './components/AnalogClock';
import { TimerControls } from './components/TimerControls';
import { DurationSettings } from './components/DurationSettings';
import { PlayIcon, PauseIcon, CoffeeIcon } from 'lucide-react';
export function App() {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);
  // Reset timer when durations change
  useEffect(() => {
    resetTimer();
  }, [workDuration, breakDuration]);
  // Format time as MM:SS
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  // Handle timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.play();
      if (isBreak) {
        // Break finished, start work session
        setTimeLeft(workDuration * 60);
        setIsBreak(false);
        setCycles(cycles + 1);
      } else {
        // Work finished, start break
        setTimeLeft(breakDuration * 60);
        setIsBreak(true);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, cycles, workDuration, breakDuration]);
  // Timer controls
  const startTimer = () => {
    setIsActive(true);
  };
  const pauseTimer = () => {
    setIsActive(false);
  };
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
  };
  const toggleBreak = () => {
    setIsActive(false);
    setIsBreak(!isBreak);
    setTimeLeft(!isBreak ? breakDuration * 60 : workDuration * 60);
  };
  const handleWorkDurationChange = newDuration => {
    if (newDuration >= 1 && newDuration <= 60) {
      setWorkDuration(newDuration);
    }
  };
  const handleBreakDurationChange = newDuration => {
    if (newDuration >= 1 && newDuration <= 30) {
      setBreakDuration(newDuration);
    }
  };
  return <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 w-full p-8">
      <h1 className="text-4xl font-bold text-indigo-800 mb-8">
        Pomodoro Timer
      </h1>
      <DurationSettings workDuration={workDuration} breakDuration={breakDuration} onWorkDurationChange={handleWorkDurationChange} onBreakDurationChange={handleBreakDurationChange} />
      <div className="bg-white rounded-full p-8 shadow-xl mb-8">
        <AnalogClock timeLeft={timeLeft} totalTime={isBreak ? breakDuration * 60 : workDuration * 60} isBreak={isBreak} />
      </div>
      <div className="text-5xl font-mono font-bold text-indigo-900 mb-8">
        {formatTime(timeLeft)}
      </div>
      <div className="flex gap-4 mb-8">
        {!isActive ? <TimerControls onClick={startTimer} icon={<PlayIcon />} label="Start" color="bg-green-500" /> : <TimerControls onClick={pauseTimer} icon={<PauseIcon />} label="Pause" color="bg-yellow-500" />}
        <TimerControls onClick={resetTimer} icon={<div />} label="Reset" color="bg-red-500" />
        <TimerControls onClick={toggleBreak} icon={<CoffeeIcon />} label={isBreak ? 'Work' : 'Break'} color={isBreak ? 'bg-indigo-500' : 'bg-blue-500'} />
      </div>
      <div className="text-center text-gray-600">
        <p className="text-xl font-medium mb-2">
          {isBreak ? 'Break Time' : 'Focus Time'}
        </p>
        <p className="text-sm">Completed cycles: {cycles}</p>
      </div>
    </div>;
}