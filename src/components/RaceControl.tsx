import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flag, 
  ShieldAlert, 
  ShieldX, 
  Car, 
  CheckSquare,
  Info, 
  Radio, 
  Timer 
} from 'lucide-react';
import { useLIFX } from '../hooks/useLIFX';
import { useTrackStatus } from '../hooks/useTrackStatus';
import { useF1Schedule } from '../hooks/useF1Schedule';
import { formatDistanceToNow, parseISO, isBefore } from 'date-fns';
import { cn } from '../lib/utils';

const RaceControl: React.FC = () => {
  const { setFlag, error: lifxError, selectedDevices } = useLIFX();
  const { status: apiFlag, isLive, error: apiError, lastUpdate } = useTrackStatus();
  const [activeFlag, setActiveFlag] = useState('green');
  const [autoMode, setAutoMode] = useState(true);
  const { getNextRace } = useF1Schedule();
  const nextRace = getNextRace();
  const [nextSession, setNextSession] = useState<{ name: string; date: string; time: string } | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Update active flag when API flag changes
  useEffect(() => {
    if (autoMode && isLive && apiFlag !== activeFlag) {
      setActiveFlag(apiFlag);
    }
  }, [apiFlag, autoMode, isLive, activeFlag]);

  // Find the next upcoming session
  useEffect(() => {
    if (!nextRace) return;

    const now = new Date();
    const sessions = [
      { name: 'FP1', ...nextRace.FirstPractice },
      { name: 'FP2', ...nextRace.SecondPractice },
      { name: 'FP3', ...nextRace.ThirdPractice },
      { name: 'Sprint Shootout', ...nextRace.SprintShootout },
      { name: 'Sprint', ...nextRace.Sprint },
      { name: 'Qualifying', ...nextRace.Qualifying },
      { name: 'Race', date: nextRace.date, time: nextRace.time }
    ].filter(session => session.date && session.time);

    const nextUpcomingSession = sessions.find(session => {
      const sessionDate = parseISO(`${session.date}T${session.time}`);
      return isBefore(now, sessionDate);
    });

    setNextSession(nextUpcomingSession || null);
  }, [nextRace]);

  // Update countdown
  useEffect(() => {
    if (!nextSession) return;

    const updateCountdown = () => {
      const sessionDate = parseISO(`${nextSession.date}T${nextSession.time}`);
      setCountdown(formatDistanceToNow(sessionDate, { addSuffix: true }));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [nextSession]);

  const handleFlagClick = useCallback(async (flag: 'green' | 'yellow' | 'red' | 'safety' | 'checkered') => {
    if (autoMode && isLive) return;
    setActiveFlag(flag);
    if (selectedDevices.size > 0) {
      try {
        await setFlag(flag);
      } catch (error) {
        console.error('Failed to set flag:', error);
      }
    }
  }, [autoMode, isLive, selectedDevices, setFlag]);

  const getFlagIcon = (flagType: string) => {
    switch (flagType) {
      case 'green':
        return Flag;
      case 'yellow':
        return ShieldAlert;
      case 'red':
        return ShieldX;
      case 'safety':
        return Car;
      case 'checkered':
        return CheckSquare;
      default:
        return Flag;
    }
  };

  const getFlagStyle = (flagType: string) => {
    const isActive = activeFlag === flagType;
    return cn(
      'relative flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300',
      'border border-[#1E2642] backdrop-blur-sm',
      isActive 
        ? 'bg-[#1A1F35]/90 ring-1 ring-white/20 shadow-lg' 
        : 'bg-[#151A2D]/80 hover:bg-[#1A1F35]/70 hover:scale-[1.02]',
      autoMode && isLive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    );
  };

  const getIconStyle = (flagType: string) => {
    const isActive = activeFlag === flagType;
    return cn(
      'h-12 w-12 mb-3 transition-all duration-300',
      {
        'green': 'text-[#34C759]',
        'yellow': 'text-yellow-500',
        'red': 'text-[#FF3B30]',
        'safety': 'text-orange-500',
        'checkered': 'text-white'
      }[flagType],
      isActive && 'scale-110 animate-pulse',
      isActive && 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'
    );
  };

  const getGlowStyle = (flagType: string) => {
    const isActive = activeFlag === flagType;
    if (!isActive) return '';

    const glowColors = {
      'green': 'bg-[#34C759]',
      'yellow': 'bg-yellow-500',
      'red': 'bg-[#FF3B30]',
      'safety': 'bg-orange-500',
      'checkered': 'bg-white'
    };

    return cn(
      'absolute inset-0 -z-10 rounded-xl opacity-20 blur-xl transition-opacity duration-300',
      glowColors[flagType as keyof typeof glowColors]
    );
  };

  const renderFlagButton = (
    flagType: 'green' | 'yellow' | 'red' | 'safety' | 'checkered',
    label: string,
    description: string
  ) => {
    const Icon = getFlagIcon(flagType);
    
    return (
      <button
        onClick={() => handleFlagClick(flagType)}
        className={getFlagStyle(flagType)}
        disabled={autoMode && isLive}
      >
        <div className={getGlowStyle(flagType)} />
        <Icon className={getIconStyle(flagType)} />
        <span className="text-white font-medium mb-1">{label}</span>
        <span className="text-gray-400 text-sm">{description}</span>
      </button>
    );
  };

  return (
    <div className="bg-[#0D1119] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Race Control</h2>
          <p className="text-sm text-gray-400 mt-1">Manage race flags and light effects</p>
        </div>
        <div className="flex items-center space-x-4">
          {isLive && (
            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer 
                            peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                            peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                            after:start-[2px] after:bg-white after:border-gray-300 after:border 
                            after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]">
                </div>
              </label>
              <span className="text-sm text-gray-400">Auto Mode</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <button
          className={cn(
            'w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200',
            isLive
              ? 'bg-[#34C759] hover:bg-[#2FB350] text-white'
              : 'bg-gray-700 cursor-not-allowed text-gray-400'
          )}
          disabled={!isLive}
        >
          {isLive ? (
            <>
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="font-medium">Connected to Live Race</span>
            </>
          ) : (
            <>
              <Timer className="w-5 h-5" />
              <span className="font-medium">
                {nextSession 
                  ? `${nextSession.name} starts ${countdown}`
                  : 'No Upcoming Sessions'}
              </span>
            </>
          )}
        </button>
      </div>

      {isLive && (
        <div className="bg-[#1A1F35] p-4 rounded-lg border border-[#1E2642] mb-6">
          <div className="flex items-start space-x-2">
            <Radio className="w-4 h-4 text-[#34C759] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Live Session Active</p>
              <p className="text-sm text-gray-400 mt-1">
                {autoMode 
                  ? 'Flags are automatically syncing with the live broadcast' 
                  : 'Manual mode enabled - automatic sync disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLive && (
        <div className="bg-[#1A1F35] p-4 rounded-lg border border-[#1E2642] mb-6">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-400">
              <p className="text-white font-medium mb-1">Testing Mode</p>
              <p>Use these controls to test if your lights are properly synced. Click each flag to see how your lights respond.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {renderFlagButton('green', 'Green Flag', 'Track is clear')}
        {renderFlagButton('yellow', 'Yellow Flag', 'Hazard ahead')}
        {renderFlagButton('red', 'Red Flag', 'Session stopped')}
        {renderFlagButton('safety', 'Safety Car', 'SC deployed')}
        {renderFlagButton('checkered', 'Checkered', 'Session complete')}
      </div>

      <div className="flex items-center justify-between bg-[#151A2D] rounded-lg p-4 border border-[#1E2642]">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Current Flag:</span>
          <span className="text-white font-medium capitalize">{activeFlag}</span>
        </div>
        {lastUpdate && (
          <div className="text-sm text-gray-400">
            Last Update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {(lifxError || apiError) && (
        <div className="mt-4 text-red-500 text-sm bg-red-500/10 rounded-lg p-4">
          {lifxError || apiError}
        </div>
      )}
    </div>
  );
};

export default RaceControl;