export type AmbientSoundId = 'rain' | 'cafe' | 'white-noise';

export interface AmbientSoundPreset {
  id: AmbientSoundId;
  name: string;
  hinglishName: string;
  tagline: string;
  hinglishTagline: string;
  defaultVolume: number;
  recommendedFor: string;
  synthesisProfile: {
    noiseType: 'pink' | 'brown' | 'white';
    lowpassHz: number;
    bandpassHz?: number;
    lfoRateHz?: number;
  };
}

export const AMBIENT_SOUND_PRESETS: AmbientSoundPreset[] = [
  {
    id: 'rain',
    name: 'Rain',
    hinglishName: 'Baarish (Rain)',
    tagline: 'Soft steady rainfall with gentle breeze',
    hinglishTagline: 'Shaant baarish ki aawaz deep reading ke liye',
    defaultVolume: 0.45,
    recommendedFor: 'Concept lectures & deep math reading',
    synthesisProfile: {
      noiseType: 'pink',
      lowpassHz: 1500,
      bandpassHz: 950,
      lfoRateHz: 0.14
    }
  },
  {
    id: 'cafe',
    name: 'Cafe',
    hinglishName: 'Coffee Cafe',
    tagline: 'Warm indoor room acoustics & soft murmur',
    hinglishTagline: 'Cozy study cafe jaisa warm background ambience',
    defaultVolume: 0.5,
    recommendedFor: 'Hands-on Python & PyTorch coding blocks',
    synthesisProfile: {
      noiseType: 'brown',
      lowpassHz: 620,
      bandpassHz: 380,
      lfoRateHz: 0.08
    }
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    hinglishName: 'White Noise',
    tagline: 'Balanced broadband masking for zero distraction',
    hinglishTagline: 'Aas-paas ke shor ko block karne ke liye steady tone',
    defaultVolume: 0.35,
    recommendedFor: 'Timed quizzes, mock interviews & rapid recall',
    synthesisProfile: {
      noiseType: 'white',
      lowpassHz: 4800
    }
  }
];
