import React, { useState } from 'react';
import { WorkoutHistoryAnalytics } from './WorkoutHistoryAnalytics';
import { InBodyTracker } from './InBodyTracker';
import { ProgressPhotoTracker } from './ProgressPhotoTracker';
import { BarChart3, Activity, Camera } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const [subTab, setSubTab] = useState<'history' | 'inbody' | 'photos'>('history');

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-1 text-xs">
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
            subTab === 'history'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>История</span>
        </button>

        <button
          onClick={() => setSubTab('inbody')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
            subTab === 'inbody'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>InBody</span>
        </button>

        <button
          onClick={() => setSubTab('photos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
            subTab === 'photos'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Camera className="w-4 h-4" />
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
