import React, { useState } from 'react';
import { WorkoutHistoryAnalytics } from './WorkoutHistoryAnalytics';
import { InBodyTracker } from './InBodyTracker';
import { ProgressPhotoTracker } from './ProgressPhotoTracker';
import { AiTrainerReport } from './AiTrainerReport';
import { BarChart3, Activity, Camera, Sparkles } from 'lucide-react';

export const ProgressView: React.FC = () => {
  const [subTab, setSubTab] = useState<'history' | 'inbody' | 'photos' | 'ai'>('history');

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation Header with safe area padding */}
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-1 shadow-md flex items-center justify-between gap-1 text-[11px] backdrop-blur-md">
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg font-bold transition-all ${
            subTab === 'history'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">История</span>
        </button>

        <button
          onClick={() => setSubTab('inbody')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg font-bold transition-all ${
            subTab === 'inbody'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">InBody</span>
        </button>

        <button
          onClick={() => setSubTab('photos')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg font-bold transition-all ${
            subTab === 'photos'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Фото</span>
        </button>

        <button
          onClick={() => setSubTab('ai')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg font-bold transition-all ${
            subTab === 'ai'
              ? 'bg-emerald-400 text-zinc-950 shadow-sm font-black'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">ИИ-Тренер</span>
        </button>
      </div>

      {/* Render Sub-tab Content */}
      <div className="animate-fadeIn">
        {subTab === 'history' && <WorkoutHistoryAnalytics />}
        {subTab === 'inbody' && <InBodyTracker />}
        {subTab === 'photos' && <ProgressPhotoTracker />}
        {subTab === 'ai' && <AiTrainerReport />}
      </div>
    </div>
  );
};
