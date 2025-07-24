// components/SessionStatus.tsx (Optional - to show remaining session time)
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SessionStatus: React.FC = () => {
  const { user, getRemainingTime, extendSession } = useAuth();
  const [remainingTime, setRemainingTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!user) return;

    const updateTimer = () => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
      
      // Show warning when less than 10 minutes remaining
      setShowWarning(remaining < 10 * 60 * 1000 && remaining > 0);
    };

    // Update immediately
    updateTimer();

    // Update every 30 seconds
    const interval = setInterval(updateTimer, 30000);

    return () => clearInterval(interval);
  }, [user, getRemainingTime]);

  if (!user || remainingTime <= 0) return null;

  const minutes = Math.floor(remainingTime / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const displayMinutes = minutes % 60;

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}h ${displayMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      showWarning 
        ? 'bg-red-100 text-red-700 border border-red-200' 
        : 'bg-green-100 text-green-700 border border-green-200'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          showWarning ? 'bg-red-500 animate-pulse' : 'bg-green-500'
        }`}></div>
        <span>Session: {formatTime()}</span>
        {showWarning && (
          <button
            onClick={extendSession}
            className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
          >
            Extend
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionStatus;