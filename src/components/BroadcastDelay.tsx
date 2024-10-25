import React, { useState } from 'react';
import { Tv, Globe, Video, AlertTriangle, Clock, Info } from 'lucide-react';
import { useLIFX } from '../hooks/useLIFX';
import { delayService } from '../services/delayService';
import { cn } from '../lib/utils';

interface DelayOptionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  isSelected: boolean;
  onClick: () => void;
}

const DelayOption: React.FC<DelayOptionProps> = ({
  icon: Icon,
  title,
  description,
  isSelected,
  onClick
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 w-full text-left',
      isSelected 
        ? 'bg-[#1A1F35] border-race-blue-500 ring-1 ring-race-blue-500/50' 
        : 'border-[#1E2642] hover:border-[#2A365D] hover:bg-[#1A1F35]/50'
    )}
  >
    <Icon className={cn(
      'w-5 h-5 mt-0.5',
      isSelected ? 'text-race-blue-500' : 'text-gray-400'
    )} />
    <div>
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  </button>
);

const BroadcastDelay: React.FC = () => {
  const { broadcastDelay, setBroadcastDelay } = useLIFX();
  const [showWarning, setShowWarning] = useState(false);
  const [customDelay, setCustomDelay] = useState<number>(broadcastDelay);
  const [isCustom, setIsCustom] = useState(false);

  const handleDelayChange = async (delay: number, isCustomValue: boolean = false) => {
    if (!isCustomValue) {
      setIsCustom(false);
    }
    
    // Show warning when reducing delay
    if (delay < broadcastDelay) {
      setShowWarning(true);
      setCustomDelay(delay);
      return;
    }
    
    await setBroadcastDelay(delay);
    delayService.setDelay(delay);
  };

  const confirmDelayChange = async (delay: number) => {
    await setBroadcastDelay(delay);
    delayService.setDelay(delay);
    setShowWarning(false);
  };

  const handleCustomDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 60) {
      setCustomDelay(value);
      setIsCustom(true);
      handleDelayChange(value, true);
    }
  };

  const delayOptions = [
    {
      icon: Tv,
      title: 'CABLE / SATELLITE',
      description: 'Estimated 5-10 second delay',
      delay: 5
    },
    {
      icon: Globe,
      title: 'STREAMING SERVICE',
      description: 'Estimated 20-30 second delay',
      delay: 20
    },
    {
      icon: Video,
      title: 'F1TV',
      description: 'Estimated 30-40 second delay',
      delay: 30
    }
  ];

  return (
    <div className="bg-[#151A2D] rounded-lg p-6 border border-[#1E2642]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Broadcast Delay</h2>
        <p className="text-sm text-gray-400 mt-1">
          Sync your lights with your broadcast by setting an appropriate delay
        </p>
      </div>

      {showWarning && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white">Reduce Broadcast Delay?</h3>
              <p className="text-sm text-gray-400 mt-1">
                Reducing the delay might cause you to see flag changes before they appear on your broadcast.
                Are you sure you want to continue?
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => confirmDelayChange(customDelay)}
                  className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Yes, Reduce Delay
                </button>
                <button
                  onClick={() => {
                    setShowWarning(false);
                    setCustomDelay(broadcastDelay);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {delayOptions.map((option) => (
            <DelayOption
              key={option.title}
              {...option}
              isSelected={!isCustom && broadcastDelay === option.delay}
              onClick={() => handleDelayChange(option.delay)}
            />
          ))}
        </div>

        {/* Custom Delay Option */}
        <div className={cn(
          'p-4 rounded-lg border transition-all duration-200',
          isCustom ? 'bg-[#1A1F35] border-race-blue-500 ring-1 ring-race-blue-500/50' : 'border-[#1E2642]'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className={cn('w-5 h-5', isCustom ? 'text-race-blue-500' : 'text-gray-400')} />
              <div>
                <h3 className="text-sm font-medium text-white">CUSTOM DELAY</h3>
                <p className="text-xs text-gray-400 mt-1">Fine-tune the delay for your specific setup</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="60"
                value={customDelay}
                onChange={handleCustomDelayChange}
                className="w-32 accent-race-blue-500"
              />
              <div className="w-16">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={customDelay}
                  onChange={handleCustomDelayChange}
                  className="w-full bg-[#0D1119] border border-[#1E2642] rounded px-2 py-1 text-sm text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1F35] p-4 rounded-lg border border-[#1E2642] mt-6">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-400">
              <p className="text-white font-medium mb-1">About Broadcast Delays</p>
              <p>These are estimated delays based on typical broadcasting setups. Your actual delay may vary depending on:</p>
              <ul className="mt-2 space-y-1 list-disc pl-4">
                <li>Your location and service provider</li>
                <li>Type of broadcast (satellite, cable, streaming)</li>
                <li>Network conditions and buffering</li>
              </ul>
              <p className="mt-2">
                Use the custom delay option to fine-tune the synchronization for your specific setup.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual feedback for current delay */}
      <div className="mt-6 pt-6 border-t border-[#1E2642]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Current Delay:</span>
          <span className="text-race-blue-500 font-medium">{broadcastDelay} seconds</span>
        </div>
      </div>
    </div>
  );
};

export default BroadcastDelay;