import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Coffee, Radio, Volume2, VolumeX, Play, Square } from 'lucide-react';
import { Language } from '../types';
import { AMBIENT_SOUND_PRESETS, AmbientSoundId, AmbientSoundPreset } from '../data/ambientSoundsData';

interface AmbientNoisePlayerProps {
  language: Language;
  isFocusMode: boolean;
}

interface AudioNodesBundle {
  ctx: AudioContext;
  masterGain: GainNode;
  sources: AudioNode[];
}

export const AmbientNoisePlayer: React.FC<AmbientNoisePlayerProps> = ({
  language,
  isFocusMode
}) => {
  const [presets, setPresets] = useState<AmbientSoundPreset[]>(AMBIENT_SOUND_PRESETS);
  const [selectedSound, setSelectedSound] = useState<AmbientSoundId>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_ambient_sound');
      if (saved === 'rain' || saved === 'cafe' || saved === 'white-noise') return saved;
    } catch {}
    return 'rain';
  });
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('ai_mastery_ambient_volume'));
      if (Number.isFinite(saved) && saved >= 0 && saved <= 1) return saved;
    } catch {}
    return 0.45;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<AudioNodesBundle | null>(null);

  // Sync preset metadata with backend API v1 catalog
  useEffect(() => {
    let active = true;
    fetch('/api/v1/focus/ambient')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.ok && Array.isArray(data.sounds) && data.sounds.length > 0) {
          setPresets(data.sounds);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_ambient_sound', selectedSound);
    } catch {}
  }, [selectedSound]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_ambient_volume', String(volume));
    } catch {}
  }, [volume]);

  const stopAudioEngine = () => {
    const bundle = audioRef.current;
    if (!bundle) return;
    bundle.sources.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {}
    });
    try {
      bundle.masterGain.disconnect();
      bundle.ctx.close();
    } catch {}
    audioRef.current = null;
  };

  const buildNoiseBuffer = (
    ctx: AudioContext,
    noiseType: 'pink' | 'brown' | 'white',
    durationSecs = 4
  ): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSecs;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (noiseType === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      return buffer;
    }

    if (noiseType === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 2.6;
      }
      return buffer;
    }

    // Smooth Voss-McCartney style pink noise approximation for Rain
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  };

  const startAudioEngine = (soundId: AmbientSoundId, targetVol: number, muted: boolean) => {
    stopAudioEngine();

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx: AudioContext = new AudioCtx();
    const preset = presets.find((p) => p.id === soundId) || AMBIENT_SOUND_PRESETS[0];
    const profile = preset.synthesisProfile;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(muted ? 0 : targetVol * 0.65, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const sources: AudioNode[] = [];

    // Primary continuous buffer loop
    const source = ctx.createBufferSource();
    source.buffer = buildNoiseBuffer(ctx, profile.noiseType, 4);
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(profile.lowpassHz, ctx.currentTime);

    let chainHead: AudioNode = source;

    if (profile.bandpassHz) {
      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.setValueAtTime(profile.bandpassHz, ctx.currentTime);
      presence.Q.setValueAtTime(0.9, ctx.currentTime);
      presence.gain.setValueAtTime(soundId === 'cafe' ? 5 : 2.5, ctx.currentTime);
      chainHead.connect(presence);
      chainHead = presence;
    }

    chainHead.connect(lowpass);

    // Subtle organic LFO swell for Rain & Cafe room murmur
    if (profile.lfoRateHz) {
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0.85, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(profile.lfoRateHz, ctx.currentTime);

      const lfoDepth = ctx.createGain();
      lfoDepth.gain.setValueAtTime(0.15, ctx.currentTime);

      lfo.connect(lfoDepth);
      lfoDepth.connect(swellGain.gain);
      lowpass.connect(swellGain);
      swellGain.connect(masterGain);

      lfo.start();
      sources.push(lfo);
    } else {
      lowpass.connect(masterGain);
    }

    // Add gentle cafe acoustic chatter layer (filtered brown-pink bed) when 'cafe' is active
    if (soundId === 'cafe') {
      const murmurSource = ctx.createBufferSource();
      murmurSource.buffer = buildNoiseBuffer(ctx, 'pink', 3);
      murmurSource.loop = true;

      const murmurFilter = ctx.createBiquadFilter();
      murmurFilter.type = 'bandpass';
      murmurFilter.frequency.setValueAtTime(580, ctx.currentTime);
      murmurFilter.Q.setValueAtTime(1.4, ctx.currentTime);

      const murmurGain = ctx.createGain();
      murmurGain.gain.setValueAtTime(0.28, ctx.currentTime);

      murmurSource.connect(murmurFilter);
      murmurFilter.connect(murmurGain);
      murmurGain.connect(masterGain);
      murmurSource.start();
      sources.push(murmurSource);
    }

    source.start();
    sources.push(source);

    audioRef.current = { ctx, masterGain, sources };
  };

  // Update volume or mute live without restarting audio buffer
  useEffect(() => {
    const bundle = audioRef.current;
    if (!bundle) return;
    const target = isMuted ? 0 : volume * 0.65;
    try {
      bundle.masterGain.gain.setTargetAtTime(target, bundle.ctx.currentTime, 0.05);
    } catch {}
  }, [volume, isMuted]);

  // Stop audio automatically when exiting Focus Mode or unmounting
  useEffect(() => {
    if (!isFocusMode && isPlaying) {
      stopAudioEngine();
      setIsPlaying(false);
    }
  }, [isFocusMode]);

  useEffect(() => {
    return () => {
      stopAudioEngine();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioEngine();
      setIsPlaying(false);
    } else {
      startAudioEngine(selectedSound, volume, isMuted);
      setIsPlaying(true);
    }
  };

  const handleSelectSound = (id: AmbientSoundId) => {
    setSelectedSound(id);
    if (isPlaying) {
      startAudioEngine(id, volume, isMuted);
    }
  };

  const activePreset = presets.find((p) => p.id === selectedSound) || presets[0];

  const getSoundIcon = (id: AmbientSoundId) => {
    if (id === 'rain') return CloudRain;
    if (id === 'cafe') return Coffee;
    return Radio;
  };

  return (
    <div
      className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm space-y-4 transition-colors ${
        isPlaying
          ? 'border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPlaying
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlaying && !isMuted ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
              <span>Ambient Focus Audio</span>
              {isPlaying && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  ON
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hinglish'
                ? 'Concentration ke liye soothing background sound'
                : 'Built-in soundscapes for distraction-free study'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>
      </div>

      {/* Soundscape Selector Grid */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const Icon = getSoundIcon(preset.id);
          const active = selectedSound === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectSound(preset.id)}
              aria-pressed={active}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                active
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <div className="text-xs leading-tight truncate">{preset.name}</div>
            </button>
          );
        })}
      </div>

      {/* Active Preset Description */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-700/60">
        {language === 'hinglish' ? activePreset.hinglishTagline : activePreset.tagline}
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
          title={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
          aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : Math.round(volume * 100)}
          onChange={(e) => {
            const nextVol = Number(e.target.value) / 100;
            setVolume(nextVol);
            if (isMuted && nextVol > 0) setIsMuted(false);
          }}
          aria-label="Ambient audio volume"
          className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
        />

        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 w-9 text-right">
          {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
