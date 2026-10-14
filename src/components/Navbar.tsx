import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/activity';
import { Activity, Plus, Settings, Smartphone } from 'lucide-react';

interface NavbarProps {
  profile: UserProfile;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenUpload,
  onOpenSettings,
}) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    } else {
      alert('To install this app on your phone, open your browser menu (Share on iOS, or three dots on Android) and tap "Add to Home Screen".');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-md border-b border-dark-border px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#0072FF] flex items-center justify-center text-black shadow-glow-cyan">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base md:text-lg font-black tracking-tight text-white">GARMIN<span className="text-[#00F0FF]">TRACK</span></span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden md:block">100% Free • Private • Client-Side</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* PWA Install Button */}
          <button
            onClick={handleInstallClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border hover:border-slate-500 text-xs font-medium text-slate-300 hover:text-white transition-all"
            title="Install App on Desktop or Mobile"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Install App</span>
          </button>

          {/* Import Workout Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 md:py-2 rounded-xl bg-[#00F0FF] text-black font-bold text-xs md:text-sm hover:bg-[#00F0FF]/90 transition-all shadow-glow-cyan"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Import .FIT / .GPX</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-2 px-2.5 rounded-xl bg-dark-card border border-dark-border text-slate-400 hover:text-white hover:border-slate-500 transition-all text-xs"
            title="Settings & Profile"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline text-slate-300 font-medium">{profile.name}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
