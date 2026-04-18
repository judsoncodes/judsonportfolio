'use client';
import { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio/AudioEngine';

export default function SoundToggle() {
  const [muted, setMuted] = useState(true);

  // Sync state on mount just in case
  useEffect(() => {
    if (audioEngine) {
      setMuted(audioEngine.muted);
    }
  }, []);

  const toggle = () => {
    if (audioEngine) {
      audioEngine.toggleMute();
      setMuted(audioEngine.muted);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Turn Sound On" : "Turn Sound Off"}
      className="fixed top-8 right-8 z-[100] px-4 py-2 bg-[#00e5ff0d] border border-[#00e5ff2e] backdrop-blur-[20px] rounded-lg text-[#00e5ff] font-mono text-xs tracking-widest hover:bg-[#00e5ff22] transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)] focus:outline-none focus:ring-2 focus:ring-[#00e5ff]"
    >
      [ SOUND {muted ? 'OFF' : 'ON'} ]
    </button>
  );
}
