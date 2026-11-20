export type FocusStreamCategory = 'lofi' | 'ambient' | 'deep-focus';

export type FocusSynthesisStyle =
  | 'lofi-groove'
  | 'rain-jazz'
  | 'vinyl-chill'
  | 'ambient-pad'
  | 'rain-sanctuary'
  | 'espresso-cafe'
  | 'alpha-drone'
  | 'gamma-focus';

export interface FocusAudioStream {
  id:
    | 'midnight-rhodes'
    | 'rainy-kyoto'
    | 'tokyo-tape'
    | 'deep-work-tape'
    | 'monsoon-rain'
    | 'espresso-lounge'
    | 'alpha-study'
    | 'gamma-neural';
  title: string;
  category: FocusStreamCategory;
  categoryLabel: string;
  subtitle: string;
  hinglishSubtitle: string;
  bpm: number;
  vibeTag: string;
  chords: number[][];
  tempoBpm: number;
  warmthHz: number;
  beatStyle: FocusSynthesisStyle;
}

export const FOCUS_AUDIO_STREAMS: FocusAudioStream[] = [
  {
    id: 'midnight-rhodes',
    title: 'Midnight Lo-Fi Rhodes',
    category: 'lofi',
    categoryLabel: 'Lo-Fi',
    subtitle: 'Warm electric piano chords, dusty sub & mellow boom-bap groove',
    hinglishSubtitle: 'Warm electric piano chords aur soft late-night coding beat',
    bpm: 76,
    vibeTag: 'CODING FLOW',
    chords: [
      [174.61, 220.0, 261.63, 329.63],
      [164.81, 196.0, 246.94, 293.66],
      [146.83, 174.61, 220.0, 261.63],
      [130.81, 164.81, 196.0, 246.94],
    ],
    tempoBpm: 76,
    warmthHz: 1150,
    beatStyle: 'lofi-groove',
  },
  {
    id: 'rainy-kyoto',
    title: 'Rainy Kyoto Desk Beats',
    category: 'lofi',
    categoryLabel: 'Lo-Fi',
    subtitle: 'Jazz-hop lo-fi percussion layered with gentle rain-washed keys',
    hinglishSubtitle: 'Halki barish jaisa texture + relaxing jazz lo-fi rhythm',
    bpm: 80,
    vibeTag: 'CHILL BEATS',
    chords: [
      [146.83, 174.61, 220.0, 329.63],
      [196.0, 246.94, 293.66, 329.63],
      [130.81, 164.81, 246.94, 293.66],
      [110.0, 164.81, 207.65, 261.63],
    ],
    tempoBpm: 80,
    warmthHz: 1300,
    beatStyle: 'rain-jazz',
  },
  {
    id: 'tokyo-tape',
    title: 'Shibuya Cassette Drift',
    category: 'lofi',
    categoryLabel: 'Lo-Fi',
    subtitle: 'Slow nostalgic cassette chords with warm vinyl crackle texture',
    hinglishSubtitle: 'Soft nostalgic cassette chords aur cozy vinyl texture',
    bpm: 72,
    vibeTag: 'LATE NIGHT',
    chords: [
      [164.81, 207.65, 246.94, 311.13],
      [146.83, 185.0, 220.0, 277.18],
      [130.81, 164.81, 196.0, 246.94],
      [123.47, 155.56, 185.0, 233.08],
    ],
    tempoBpm: 72,
    warmthHz: 980,
    beatStyle: 'vinyl-chill',
  },
  {
    id: 'deep-work-tape',
    title: 'Deep Work Analog Tape',
    category: 'ambient',
    categoryLabel: 'Ambient',
    subtitle: 'Floating tape synths & slow harmonic swells for complex system design',
    hinglishSubtitle: 'Deep algorithms & Math solve karne ke liye calm tape swells',
    bpm: 68,
    vibeTag: 'AMBIENT PAD',
    chords: [
      [130.81, 196.0, 246.94, 293.66],
      [110.0, 164.81, 220.0, 246.94],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 329.63],
    ],
    tempoBpm: 68,
    warmthHz: 900,
    beatStyle: 'ambient-pad',
  },
  {
    id: 'monsoon-rain',
    title: 'Monsoon Glasshouse Rain',
    category: 'ambient',
    categoryLabel: 'Ambient',
    subtitle: 'Steady warm pink-noise rain wash with subtle distant harmonic warmth',
    hinglishSubtitle: 'Shaant baarish ki steady sound reading aur concentration ke liye',
    bpm: 60,
    vibeTag: 'RAIN WASH',
    chords: [
      [130.81, 196.0, 261.63],
      [146.83, 220.0, 293.66],
    ],
    tempoBpm: 60,
    warmthHz: 1100,
    beatStyle: 'rain-sanctuary',
  },
  {
    id: 'espresso-lounge',
    title: 'Library & Espresso Bed',
    category: 'ambient',
    categoryLabel: 'Ambient',
    subtitle: 'Warm brown-noise indoor acoustics for steady zero-distraction coding',
    hinglishSubtitle: 'Cozy library aur cafe room jaisa soothing warm tone',
    bpm: 64,
    vibeTag: 'ROOM TONE',
    chords: [
      [110.0, 164.81, 220.0],
      [130.81, 196.0, 261.63],
    ],
    tempoBpm: 64,
    warmthHz: 680,
    beatStyle: 'espresso-cafe',
  },
  {
    id: 'alpha-study',
    title: 'Alpha Memory Harmonics',
    category: 'deep-focus',
    categoryLabel: 'Deep Focus',
    subtitle: 'Calming 10Hz alpha-modulated fifths engineered for active recall',
    hinglishSubtitle: 'Reading, notes aur flashcards ke liye 10Hz gentle alpha drone',
    bpm: 72,
    vibeTag: '10HZ ALPHA',
    chords: [
      [130.81, 196.0, 261.63, 392.0],
      [146.83, 220.0, 293.66, 329.63],
      [164.81, 246.94, 329.63, 392.0],
      [130.81, 196.0, 261.63, 293.66],
    ],
    tempoBpm: 72,
    warmthHz: 820,
    beatStyle: 'alpha-drone',
  },
  {
    id: 'gamma-neural',
    title: '40Hz Gamma Neural Lock',
    category: 'deep-focus',
    categoryLabel: 'Deep Focus',
    subtitle: 'Subtle 40Hz stereo focus entrainment over warm harmonic drone',
    hinglishSubtitle: 'High-focus debugging aur intense derivations ke liye 40Hz focus lock',
    bpm: 66,
    vibeTag: '40HZ GAMMA',
    chords: [
      [110.0, 164.81, 220.0, 329.63],
      [123.47, 185.0, 246.94, 369.99],
    ],
    tempoBpm: 66,
    warmthHz: 760,
    beatStyle: 'gamma-focus',
  },
];

/**
 * Generates a warm, seamless stereo 16-bit PCM WAV Blob URL for the HTML5 <audio> element
 * so curated Lo-Fi, Ambient, and Deep Focus streams play reliably offline/online with zero broken CDN links.
 */
export function buildFocusStreamWavUrl(stream: FocusAudioStream): string {
  const sampleRate = 22050;
  const beatsPerBar = 4;
  const numBars = stream.chords.length;
  const beatDuration = 60 / stream.tempoBpm;
  const totalSeconds = Math.max(8, beatDuration * beatsPerBar * numBars);
  const totalSamples = Math.floor(sampleRate * totalSeconds);

  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const rc = 1 / (2 * Math.PI * stream.warmthHz);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let lpL = 0;
  let lpR = 0;
  let brownL = 0;
  let brownR = 0;

  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barFloat = t / (beatDuration * beatsPerBar);
    const barIdx = Math.min(numBars - 1, Math.floor(barFloat));
    const barLocalT = t - barIdx * beatDuration * beatsPerBar;
    const barDur = beatDuration * beatsPerBar;

    const attackEnv = Math.min(1, barLocalT / 0.16);
    const releaseEnv = Math.min(1, (barDur - barLocalT) / 0.2);
    const chordEnv = attackEnv * releaseEnv;

    const chord = stream.chords[barIdx];

    let sampleL = 0;
    let sampleR = 0;

    const isPureAmbience =
      stream.beatStyle === 'rain-sanctuary' || stream.beatStyle === 'espresso-cafe';

    for (let v = 0; v < chord.length; v++) {
      const freq = chord[v];
      const decay =
        stream.beatStyle === 'lofi-groove' ||
        stream.beatStyle === 'rain-jazz' ||
        stream.beatStyle === 'vinyl-chill'
          ? Math.exp(-barLocalT * 0.42) * 0.72 + 0.28
          : 1;

      const tremolo =
        stream.beatStyle === 'alpha-drone'
          ? 0.85 + 0.15 * Math.sin(2 * Math.PI * 10 * t)
          : 0.92 + 0.08 * Math.sin(2 * Math.PI * 0.35 * t + v);

      const phaseL = 2 * Math.PI * (freq * (1 - 0.0018)) * t;
      const phaseR = 2 * Math.PI * (freq * (1 + 0.0018)) * t;

      const toneL = (Math.sin(phaseL) + 0.16 * Math.sin(2 * phaseL)) * tremolo * decay;
      const toneR = (Math.sin(phaseR) + 0.16 * Math.sin(2 * phaseR)) * tremolo * decay;

      const chordWeight = isPureAmbience ? 0.055 : v === 0 ? 0.26 : 0.16;
      sampleL += toneL * chordWeight;
      sampleR += toneR * chordWeight;
    }

    // Warm sub bass root note
    const bassFreq = chord[0] * 0.5;
    const bassSub = Math.sin(2 * Math.PI * bassFreq * t) * (isPureAmbience ? 0.06 : 0.19) * chordEnv;
    sampleL += bassSub;
    sampleR += bassSub;

    // 40Hz subtle stereo gamma entrainment (200Hz L / 240Hz R)
    if (stream.beatStyle === 'gamma-focus') {
      const binauralL = Math.sin(2 * Math.PI * 200 * t) * 0.075;
      const binauralR = Math.sin(2 * Math.PI * 240 * t) * 0.075;
      sampleL += binauralL;
      sampleR += binauralR;
    }

    // Lo-Fi percussion groove
    if (
      stream.beatStyle === 'lofi-groove' ||
      stream.beatStyle === 'rain-jazz' ||
      stream.beatStyle === 'vinyl-chill'
    ) {
      const beatIndexFloat = t / beatDuration;
      const beatInBar = Math.floor(beatIndexFloat) % 4;
      const beatLocalT = (beatIndexFloat - Math.floor(beatIndexFloat)) * beatDuration;

      if (beatInBar === 0 || beatInBar === 2) {
        const kickEnv = Math.exp(-beatLocalT * 18);
        const kickFreq = 52 + 85 * Math.exp(-beatLocalT * 42);
        const kick = Math.sin(2 * Math.PI * kickFreq * beatLocalT) * kickEnv * 0.32;
        sampleL += kick;
        sampleR += kick;
      }

      if (beatInBar === 1 || beatInBar === 3) {
        const snareEnv = Math.exp(-beatLocalT * 26);
        const brushNoise = (nextRand() * 2 - 1) * snareEnv * 0.11;
        const rimTone = Math.sin(2 * Math.PI * 185 * beatLocalT) * snareEnv * 0.07;
        sampleL += brushNoise + rimTone;
        sampleR += brushNoise * 0.85 + rimTone;
      }

      const eighthLocalT = ((beatIndexFloat * 2) % 1) * (beatDuration * 0.5);
      const hatEnv = Math.exp(-eighthLocalT * 65);
      const hat = (nextRand() * 2 - 1) * hatEnv * 0.035;
      sampleL += hat * 0.7;
      sampleR += hat;
    }

    // Noise bed for Rain / Cafe / Vinyl textures
    const whiteL = nextRand() * 2 - 1;
    const whiteR = nextRand() * 2 - 1;
    brownL = (brownL + 0.025 * whiteL) / 1.025;
    brownR = (brownR + 0.025 * whiteR) / 1.025;

    let textureL = 0;
    let textureR = 0;
    if (stream.beatStyle === 'rain-sanctuary') {
      const rainSwell = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.12 * t);
      textureL = (whiteL * 0.09 + brownL * 0.45) * rainSwell;
      textureR = (whiteR * 0.09 + brownR * 0.45) * rainSwell;
    } else if (stream.beatStyle === 'espresso-cafe') {
      const roomSwell = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.09 * t);
      textureL = brownL * 0.65 * roomSwell;
      textureR = brownR * 0.65 * roomSwell;
    } else {
      const bedAmp = stream.beatStyle === 'rain-jazz' ? 0.03 : 0.013;
      textureL = whiteL * bedAmp;
      textureR = whiteR * bedAmp * 0.9;
    }

    sampleL = (sampleL * chordEnv + textureL) * 0.74;
    sampleR = (sampleR * chordEnv + textureR) * 0.74;

    lpL = lpL + alpha * (sampleL - lpL);
    lpR = lpR + alpha * (sampleR - lpR);

    const fadeSamples = Math.floor(sampleRate * 0.045);
    let loopGain = 1;
    if (i < fadeSamples) loopGain = i / fadeSamples;
    else if (i > totalSamples - fadeSamples) loopGain = (totalSamples - i) / fadeSamples;

    left[i] = Math.max(-0.92, Math.min(0.92, lpL * loopGain));
    right[i] = Math.max(-0.92, Math.min(0.92, lpR * loopGain));
  }

  const dataBytes = totalSamples * 2 * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const lSample = Math.max(-1, Math.min(1, left[i]));
    const rSample = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, lSample < 0 ? lSample * 0x8000 : lSample * 0x7fff, true);
    view.setInt16(offset + 2, rSample < 0 ? rSample * 0x8000 : rSample * 0x7fff, true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
