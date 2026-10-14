import React from 'react';
import { LayoutDashboard, Sparkles, Plus, Settings, Watch } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'progress';
  onSelectTab: (tab: 'dashboard' | 'progress') => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenWorkoutCreator: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  onOpenSettings,
  onOpenWorkoutCreator,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-dark-bg/95 backdrop-blur-xl border-t border-dark-border py-2 px-4 flex items-center justify-around">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
          currentTab === 'dashboard' ? 'text-[#00F0FF]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onSelectTab('progress')}
        className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
          currentTab === 'progress' ? 'text-[#00F0FF]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-5 h-5 text-amber-400" />
        <span>Coach</span>
      </button>

      {/* Floating Center Upload Button */}
      <button
        onClick={onOpenUpload}
        className="w-12 h-12 -mt-5 rounded-full bg-[#00F0FF] text-black flex items-center justify-center shadow-glow-cyan font-bold transition-transform active:scale-95 border-2 border-dark-bg"
        title="Upload Workout"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <button
        onClick={onOpenWorkoutCreator}
        className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Watch className="w-5 h-5 text-[#00E676]" />
        <span>Workout</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
    </nav>
  );
};
