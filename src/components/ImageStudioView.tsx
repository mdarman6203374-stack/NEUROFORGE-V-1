import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  Download,
  Copy,
  Check,
  Sparkles,
  Upload,
  RefreshCw,
  Loader2,
  Layers,
  ZoomIn,
  Sliders,
  FileImage,
  Video,
  Play,
  Film,
  Camera
} from 'lucide-react';
import { Language } from '../types';

interface GeneratedImageItem {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  modelUsed: string;
  timestamp: string;
}

interface ImageStudioViewProps {
  language: Language;
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ language }) => {
  const [activeMode, setActiveMode] = useState<'image-create' | 'video-animate'>('image-create');

  // Image Generation States
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Video Animation States (gemini-omni-1.2-flash via Interactions API)
  const [videoPrompt, setVideoPrompt] = useState<string>('Smooth cinematic camera pan across neural tensor nodes with atmospheric volumetric lighting');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoErrorMsg, setVideoErrorMsg] = useState<string | null>(null);

  // Gallery of generated images
  const [gallery, setGallery] = useState<GeneratedImageItem[]>(() => {
    try {
      const saved = localStorage.getItem('neuroforge_image_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeImage, setActiveImage] = useState<GeneratedImageItem | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (target === 'edit') {
          setInputImage(res);
        } else {
          setVideoSourceImage(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (presetPrompt?: string) => {
    const targetPrompt = (presetPrompt || prompt).trim();
    if (!targetPrompt || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          inputImage: inputImage || undefined,
          aspectRatio,
          model: 'gemini-nano-banana-2.1',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        prompt: targetPrompt,
        imageUrl: data.imageUrl,
        aspectRatio,
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updated = [newItem, ...gallery];
      setGallery(updated);
      setActiveImage(newItem);
      // Auto-suggest for video animation
      if (!videoSourceImage) {
        setVideoSourceImage(data.imageUrl);
      }
      try {
        localStorage.setItem('neuroforge_image_gallery', JSON.stringify(updated));
      } catch {}
    } catch (err: any) {
      console.error('Image Generation Error:', err);
      setErrorMsg(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnimateVideo = async () => {
    const img = videoSourceImage || activeImage?.imageUrl;
    if (!img) {
      setVideoErrorMsg('Please upload or select an image to animate into video.');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoErrorMsg(null);

    try {
      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: img,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Video synthesis failed with status ${res.status}`);
      }

      const data = await res.json();
      setGeneratedVideoUrl(data.videoUrl);
    } catch (err: any) {
      console.error('Video animation error:', err);
      setVideoErrorMsg(err.message || 'Failed to animate video using gemini-omni-1.2-flash.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownload = (mediaUrl: string, filename: string, ext = 'png') => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imagePresets = [
    {
      title: 'Transformer Architecture Diagram',
      desc: 'Technical 3D exploded diagram of Transformer Attention blocks',
      prompt: 'Detailed blueprint architectural diagram of a Multi-Head Self-Attention Transformer model, glowing cyan and amber data tensor flow, clean modern schematic UI, dark background, vector technical aesthetic',
    },
    {
      title: 'Autonomous Multi-Agent Swarm',
      desc: 'Hierarchical orchestrator and MCP tool-calling pipeline',
      prompt: 'Clean visual infographic of an Autonomous Multi-Agent Swarm cluster with Model Context Protocol (MCP) bus, central planner node, execution agents, and vector memory store, high tech clean diagram',
    },
    {
      title: 'Hybrid GraphRAG Pipeline',
      desc: 'Knowledge graph entity triplets merged with vector space',
      prompt: 'Scientific concept visualization showing Knowledge Graph triplets interconnected with 3D dense vector embeddings, hybrid retrieval fusion node, sleek futuristic cybersecurity analytics dashboard',
    },
    {
      title: 'Quantized Edge SLM on Chip',
      desc: '4-bit low power NPU neural silicon accelerator',
      prompt: 'Microchip silicon wafer with glowing neural network synapses representing 4-bit quantized Small Language Model (SLM) executing on an on-device NPU, macro photography style, deep neon blue lighting',
    },
  ];

  const videoMotionPresets = [
    {
      title: 'Cinematic Dolly Zoom',
      prompt: 'Cinematic forward dolly zoom gliding smoothly into the center attention core with subtle particles drifting',
    },
    {
      title: 'Pulsing Data Flow',
      prompt: 'Dynamic glowing data packets and electrical synapses pulsating continuously along the network connections',
    },
    {
      title: 'Slow Orbit Sweep',
      prompt: 'Slow dramatic rotational orbit around the architecture diagram with shifting volumetric studio spotlights',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>AI VISUAL & MOTION STUDIO</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-400">gemini-nano-banana-2.1 & gemini-omni-1.2-flash</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Architecture Visualizer & Video Animator
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {language === 'hinglish'
                ? 'Text prompt se AI architectures create/edit karein aur kisi bhi photo ko gemini-omni-1.2-flash se video mein animate karein (16:9 landscape ya 9:16 portrait).'
                : 'Create and edit AI architecture diagrams with gemini-nano-banana-2.1, or animate photos into video using gemini-omni-1.2-flash via Interactions API.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => setActiveMode('image-create')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'image-create'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Create & Edit Image</span>
            </button>
            <button
              onClick={() => setActiveMode('video-animate')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'video-animate'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Animate into Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: Create & Edit Images */}
      {activeMode === 'image-create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Prompt Input & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Prompt & Specifications</span>
              </h2>

              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Text Prompt / Edit Instructions:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe the neural network, flowchart, or AI diagram you want to generate or edit..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aspect Ratio:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['16:9', '1:1', '4:3', '9:16'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Input Image for Image Editing */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Image Editing (Optional Base Image):</span>
                  </label>
                  {inputImage && (
                    <button
                      onClick={() => setInputImage(null)}
                      className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {inputImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-28 bg-slate-950 flex items-center justify-center">
                    <img src={inputImage} alt="Base input" className="h-full object-contain" />
                    <span className="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-200">
                      Base Image Attached
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-3 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                    <FileImage className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Upload diagram to edit or refine
                    </span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Image with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{inputImage ? 'Edit & Transform Image' : 'Generate AI Visual'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets Card */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Instant AI Engineering Templates
              </span>
              <div className="space-y-2">
                {imagePresets.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(item.prompt);
                      handleGenerate(item.prompt);
                    }}
                    disabled={isGenerating}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/70 transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Display Stage & Gallery (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  {activeImage ? 'Rendered Concept' : 'Preview Canvas'}
                </span>
                {activeImage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setVideoSourceImage(activeImage.imageUrl);
                        setActiveMode('video-animate');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      title="Send this image to video animation"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Animate to Video</span>
                    </button>
                    <button
                      onClick={() => handleDownload(activeImage.imageUrl, `ai-architecture-${Date.now()}`)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
                {isGenerating ? (
                  <div className="text-center space-y-3 p-6">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Generating diagram with gemini-nano-banana-2.1...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Synthesizing neural layers, vector matrices, and visual schematics.
                    </p>
                  </div>
                ) : activeImage ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={activeImage.imageUrl}
                      alt={activeImage.prompt}
                      className="max-h-[500px] w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-white text-xs space-y-1">
                      <p className="font-medium line-clamp-2">{activeImage.prompt}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>Model: {activeImage.modelUsed}</span>
                        <span>Ratio: {activeImage.aspectRatio}</span>
                        <span>{activeImage.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 p-8 text-slate-400">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-300">No Image Rendered Yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Type a prompt on the left or select an AI Engineering template to generate an architecture visual.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Session Gallery ({gallery.length} Images)
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {gallery.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveImage(item)}
                      className={`relative rounded-xl overflow-hidden border aspect-video bg-slate-950 group cursor-pointer transition-all ${
                        activeImage?.id === item.id
                          ? 'ring-2 ring-indigo-500 border-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 hover:opacity-90'
                      }`}
                    >
                      <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                        <span className="text-[10px] text-white font-medium line-clamp-2">
                          {item.prompt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Animate Image into Video (gemini-omni-1.2-flash via Interactions API) */}
      {activeMode === 'video-animate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>Image-to-Video Animation</span>
                </h2>
                <span className="font-mono text-[10px] text-rose-500 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  gemini-omni-1.2-flash
                </span>
              </div>

              {/* Source Image Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Starting Frame Photo:
                </label>
                {videoSourceImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-950 flex items-center justify-center">
                    <img src={videoSourceImage} alt="Video source" className="h-full object-contain" />
                    <button
                      onClick={() => setVideoSourceImage(null)}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md bg-slate-900/80 text-rose-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-300 dark:border-rose-800/60 hover:border-rose-500 rounded-xl p-5 cursor-pointer transition-colors bg-rose-50/50 dark:bg-rose-950/20">
                    <Camera className="w-6 h-6 text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Upload photo to animate into video
                    </span>
                    <span className="text-[10px] text-slate-400">Or pick an image from the gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'video')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Video Aspect Ratio Selector (Mandatory: 16:9 or 9:16) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Video Aspect Ratio:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      videoAspectRatio === '16:9'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    16:9 (Landscape)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      videoAspectRatio === '9:16'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    9:16 (Portrait)
                  </button>
                </div>
              </div>

              {/* Motion Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Motion Prompt / Camera Directives:
                </label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe camera motion, drifting particles, or animated transitions..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {videoErrorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                  {videoErrorMsg}
                </div>
              )}

              <button
                onClick={handleAnimateVideo}
                disabled={!videoSourceImage || isGeneratingVideo}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Video with gemini-omni-1.2-flash...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Generate Motion Video</span>
                  </>
                )}
              </button>
            </div>

            {/* Motion Presets */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Motion Presets
              </span>
              <div className="space-y-2">
                {videoMotionPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setVideoPrompt(preset.prompt)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700/70 transition-all cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {preset.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Video Output Player (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Generated Video Playback
                </span>
                {generatedVideoUrl && (
                  <button
                    onClick={() => handleDownload(generatedVideoUrl, `ai-video-${Date.now()}`, 'mp4')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </button>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
                {isGeneratingVideo ? (
                  <div className="text-center space-y-3 p-6">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Synthesizing video with gemini-omni-1.2-flash...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Processing temporal consistency, neural motion interpolation, and {videoAspectRatio} frames via the Interactions API.
                    </p>
                  </div>
                ) : generatedVideoUrl ? (
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className={`max-h-[500px] w-full rounded-lg ${
                      videoAspectRatio === '9:16' ? 'max-w-[280px] object-cover' : 'object-contain'
                    }`}
                  />
                ) : (
                  <div className="text-center space-y-2 p-8 text-slate-400">
                    <Film className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-300">No Video Generated Yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Upload a starting photo on the left, choose your aspect ratio ({videoAspectRatio}), and click "Generate Motion Video".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
