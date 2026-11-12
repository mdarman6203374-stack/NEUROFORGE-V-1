import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2, Bot, AlertCircle, Radio } from 'lucide-react';
import { Language } from '../types';

interface LiveVoiceMentorProps {
  language: Language;
}

export const LiveVoiceMentor: React.FC<LiveVoiceMentorProps> = ({ language }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // Helper to convert Float32Array to 16kHz 16-bit PCM Base64
  const floatTo16BitPCMBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper to play base64 24kHz PCM chunk from Gemini Live
  const playAudioChunk = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const samplesCount = len / 2;
      const float32 = new Float32Array(samplesCount);

      for (let i = 0; i < samplesCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32[i] = int16 / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      audioQueueRef.current.push(source);
      setIsSpeaking(true);

      source.onended = () => {
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
          setIsSpeaking(false);
        }
      };
    } catch (err) {
      console.error('Audio playback chunk error:', err);
    }
  };

  const stopAllAudio = () => {
    audioQueueRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    audioQueueRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  };

  const startVoiceSession = async () => {
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      // 1. Setup AudioContexts (16kHz in, 24kHz out as mandated by Live API skill)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioCtxRef.current = new AudioCtx({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });

      // 2. Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // 3. Connect to server-side Live API WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // 4. Setup Audio Worklet / ScriptProcessor for mic capture
        if (!inputAudioCtxRef.current) return;
        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate volume level for visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          setVolumeLevel(Math.min(100, Math.round((sum / inputData.length) * 400)));

          // Send 16kHz PCM audio chunk to Gemini Live
          const base64Audio = floatTo16BitPCMBase64(inputData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            stopAllAudio();
          }
          if (msg.error) {
            setErrorMessage(msg.error);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Live Error:', err);
        setErrorMessage('Failed to connect to Live API audio stream.');
        stopVoiceSession();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err: any) {
      console.error('Mic access or Live start error:', err);
      setErrorMessage(err.message || 'Microphone access denied or connection failed.');
      setIsConnecting(false);
      stopVoiceSession();
    }
  };

  const stopVoiceSession = () => {
    stopAllAudio();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setVolumeLevel(0);
  };

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>REAL-TIME VOICE CONVERSATION</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">gemini-3.8-live</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mt-1 text-white">
            {language === 'hinglish' ? 'Live Voice AI Mentor' : 'Live Voice AI Coach'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hinglish'
              ? 'Mic se bolkar real-time English ya Hinglish mein baat karein. Zero latency duplex conversation.'
              : 'Speak naturally to practice mock interviews or ask technical concepts with low-latency duplex voice.'}
          </p>
        </div>

        {/* Connect / Disconnect Action Button */}
        <div>
          {!isConnected ? (
            <button
              onClick={startVoiceSession}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Live Session...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Chat</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopVoiceSession}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <MicOff className="w-4 h-4" />
              <span>End Voice Call</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Audio Waveform Status */}
      {isConnected && (
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 animate-pulse'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isSpeaking ? <Volume2 className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {isSpeaking ? 'AI Mentor is speaking...' : 'Listening to your microphone...'}
              </div>
              <div className="text-[11px] text-slate-400">
                16kHz In / 24kHz Out Duplex Stream Active
              </div>
            </div>
          </div>

          {/* Live Audio Visualizer Bars */}
          <div className="flex items-center gap-1.5 h-8">
            {[...Array(12)].map((_, i) => {
              const height = isSpeaking
                ? 12 + Math.sin(Date.now() / 150 + i) * 16
                : Math.min(32, Math.max(6, (volumeLevel / 100) * 32 * (1 + (i % 3) * 0.4)));
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-400 transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
