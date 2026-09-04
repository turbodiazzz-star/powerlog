import React, { useState } from 'react';
import { WorkoutHistoryAnalytics } from './WorkoutHistoryAnalytics';
import { InBodyTracker } from './InBodyTracker';
import { ProgressPhotoTracker } from './ProgressPhotoTracker';
import { BarChart3, Activity, Camera } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const [subTab, setSubTab] = useState<'history' | 'inbody' | 'photos'>('history');

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation Header with safe area padding */}
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-1.5 shadow-md flex items-center justify-between gap-1 text-xs backdrop-blur-md">
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold transition-all text-xs ${
            subTab === 'history'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>История</span>
        </button>

        <button
          onClick={() => setSubTab('inbody')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold transition-all text-xs ${
            subTab === 'inbody'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>InBody</span>
        </button>

        <button
          onClick={() => setSubTab('photos')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold transition-all text-xs ${
            subTab === 'photos'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Фото</span>
        </button>
      </div>

      {/* Render Sub-tab Content */}
      <div className="animate-fadeIn">
        {subTab === 'history' && <WorkoutHistoryAnalytics />}
        {subTab === 'inbody' && <InBodyTracker />}
        {subTab === 'photos' && <ProgressPhotoTracker />}
      </div>
    </div>
  );
};
