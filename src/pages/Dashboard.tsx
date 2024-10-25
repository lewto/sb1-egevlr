import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RaceControl from '../components/RaceControl';
import LightControl from '../components/LightControl';
import BroadcastDelay from '../components/BroadcastDelay';
import RaceSchedule from '../components/RaceSchedule';
import TrialExpiredModal from '../components/TrialExpiredModal';

const Dashboard = () => {
  const { user, isTrialValid } = useAuth();
  const navigate = useNavigate();
  const [showTrialExpired, setShowTrialExpired] = useState(false);

  useEffect(() => {
    if (user?.plan === 'trial' && !isTrialValid) {
      setShowTrialExpired(true);
    }
  }, [user, isTrialValid]);

  const handleUpgrade = () => {
    window.location.href = 'https://www.paypal.com/ncp/payment/ULSN3LZGJUHPQ';
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Control Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RaceControl />
          </div>
          <div>
            <LightControl />
          </div>
        </div>

        {/* Broadcast Delay */}
        <BroadcastDelay />

        {/* Race Schedule */}
        <RaceSchedule />

        {/* Trial Expired Modal */}
        {showTrialExpired && (
          <TrialExpiredModal
            onUpgrade={handleUpgrade}
            onClose={() => {
              setShowTrialExpired(false);
              navigate('/');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;