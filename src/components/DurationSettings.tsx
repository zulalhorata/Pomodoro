import { BrainIcon, CoffeeIcon } from 'lucide-react';

interface DurationSettingsProps {
  workDuration: number;
  breakDuration: number;
  onWorkDurationChange: (value: number) => void;
  onBreakDurationChange: (value: number) => void;
}

export const DurationSettings = ({
  workDuration,
  breakDuration,
  onWorkDurationChange,
  onBreakDurationChange
}: DurationSettingsProps) => {
  return <div className="flex gap-6 mb-8">
      <div className="bg-white rounded-xl p-5 shadow-lg transition-all hover:shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BrainIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Work Session</h3>
        </div>
        <div className="relative">
          <input id="workDuration" type="number" min="1" max="60" value={workDuration} onChange={e => onWorkDurationChange(parseInt(e.target.value))} className="w-full text-3xl font-bold text-indigo-600 bg-indigo-50/50 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />

        </div>
        <p className="text-xs text-gray-500 mt-2">Recommended: 25-50 minutes</p>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-lg transition-all hover:shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CoffeeIcon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Break Time</h3>
        </div>
        <div className="relative">
          <input id="breakDuration" type="number" min="1" max="30" value={breakDuration} onChange={e => onBreakDurationChange(parseInt(e.target.value))} className="w-full text-3xl font-bold text-blue-600 bg-blue-50/50 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />

        </div>
        <p className="text-xs text-gray-500 mt-2">Recommended: 5-15 minutes</p>
      </div>
    </div>;
};