"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("short");
  const [customMinutes, setCustomMinutes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productionKit, setProductionKit] = useState<any>(null);
  
  const [step, setStep] = useState<"input" | "review" | "processing" | "ready">("input");
  const [activeTab, setActiveTab] = useState<"canvas" | "thumbnail">("canvas");
  const [voiceType, setVoiceType] = useState("deep-male");
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  const [viralMeta, setViralMeta] = useState<any>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailText, setThumbnailText] = useState("");
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const playRealAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch((e) => console.log("Audio play error:", e));

    if (bgmEnabled) {
      if (!bgmRef.current) {
        bgmRef.current = new Audio("https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg");
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.12;
      }
      bgmRef.current.play().catch(() => {});
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
  };

  // Automatic Video Player Logic
  useEffect(() => {
    let timer: any;
    if (isPlayingVideo && productionKit?.scenes) {
      const currentScene = productionKit.scenes[currentSceneIdx];
      const durationMs = (currentScene?.durationInSeconds || 6) * 1000;

      if (currentScene?.audioUrl) {
        playRealAudio(currentScene.audioUrl);
      }

      timer = setTimeout(() => {
        if (currentSceneIdx < productionKit.scenes.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          setIsPlayingVideo(false);
          setCurrentSceneIdx(0);
          stopAudio();
        }
      }, durationMs);
    }
    return () => {
      clearTimeout(timer);
      stopAudio();
    };
  }, [isPlayingVideo, currentSceneIdx, productionKit]);

  if (!mounted) return null;

  const handleInitialGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setProductionKit(null);
    setThumbnailUrl("");
    setViralMeta(null);
    setStep("input");

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, duration, customMinutes }),
      });

      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error("Using fallback bundle!");
      }

      setProductionKit(data.data);
      setThumbnailText(data.data.title || topic);
      
      setViralMeta({
        titles: [
          `🔥 The Brutal Truth About ${topic} (Must Watch)`,
          `Why 99% Fail at ${topic} Until They Learn This`,
          `Mastering ${topic}: The Ultimate Mindset Shift`
        ],
        description: `In this video, we dive deep into ${topic}. Discover the exact secrets, rules, and discipline required to completely transform your reality.\n\n#${topic.replace(/\s+/g, '')} #Motivation #Mindset #Success`,
        tags: [topic, "Motivation", "Mindset", "Discipline", "Success Secrets"]
      });

      const thumbPrompt = encodeURIComponent(`Epic cinematic YouTube thumbnail, ultra high CTR, dramatic cinematic lighting, 8k, photorealistic, subject: ${topic}, bold contrast`);
      setThumbnailUrl(`https://image.pollinations.ai/prompt/${thumbPrompt}?width=1280&height=720&seed=${Date.now()}`);

      setStep("review");
    } catch (err: any) {
      const fallbackData = {
        title: `The Untold Truth About ${topic}`,
        fullScript: `The journey to success on ${topic} begins with relentless discipline and execution.`,
        scenes: [
          {
            sceneNumber: 1,
            durationInSeconds: 10,
            voiceover: `The ultimate truth about ${topic} is that consistency beats pure talent every single time.`,
            imagePrompt: `Cinematic moody landscape representing ${topic}, 8k`,
            imageUrl: `https://image.pollinations.ai/prompt/Cinematic%20moody%20landscape%20representing%20${encodeURIComponent(topic)}?width=1280&height=720&seed=1`,
            audioUrl: "https://actions.google.com/sounds/v1/ambiences/wind_howl.ogg"
          },
          {
            sceneNumber: 2,
            durationInSeconds: 12,
            voiceover: "When others sleep, you must grind. When others quit, you push forward.",
            imagePrompt: "Determined person working hard under dark cinematic studio light, 8k",
            imageUrl: "https://image.pollinations.ai/prompt/Determined%20person%20working%20hard%20under%20dark%20cinematic%20studio%20light?width=1280&height=720&seed=2",
            audioUrl: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg"
          },
          {
            sceneNumber: 3,
            durationInSeconds: 10,
            voiceover: "Your future self will thank you for the sacrifices you make today. Stay unstoppable.",
            imagePrompt: "Victorious person standing on mountain peak looking at golden sunrise, 8k",
            imageUrl: "https://image.pollinations.ai/prompt/Victorious%20person%20standing%20on%20mountain%20peak%20looking%20at%20golden%20sunrise?width=1280&height=720&seed=3",
            audioUrl: "https://actions.google.com/sounds/v1/ambiences/ocean_surf.ogg"
          }
        ]
      };

      setProductionKit(fallbackData);
      setThumbnailText(fallbackData.title);
      setViralMeta({
        titles: [
          `🔥 The Brutal Truth About ${topic} (Must Watch)`,
          `Why 99% Fail at ${topic} Until They Learn This`,
          `Mastering ${topic}: The Ultimate Mindset Shift`
        ],
        description: `In this video, we dive deep into ${topic}. Discover the exact secrets, rules, and discipline required.\n\n#${topic.replace(/\s+/g, '')} #Motivation #Mindset #Success`,
        tags: [topic, "Motivation", "Mindset", "Discipline", "Success Secrets"]
      });

      setThumbnailUrl(`https://image.pollinations.ai/prompt/Epic%20YouTube%20Thumbnail%20for%20${encodeURIComponent(topic)}?width=1280&height=720&seed=${Date.now()}`);
      setStep("review");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateThumbnail = () => {
    if (!topic.trim()) return;
    setIsGeneratingThumb(true);
    setTimeout(() => {
      const customPrompt = encodeURIComponent(`Hyper-realistic viral YouTube thumbnail, high click-through rate, dramatic dark and gold mood, professional studio lighting, focus on: ${thumbnailText || topic}`);
      setThumbnailUrl(`https://image.pollinations.ai/prompt/${customPrompt}?width=1280&height=720&seed=${Math.random()}`);
      setIsGeneratingThumb(false);
    }, 800);
  };

  const startVideoPlayback = () => {
    if (!productionKit?.scenes?.length) return;
    setCurrentSceneIdx(0);
    setIsPlayingVideo(true);
  };

  const stopVideoPlayback = () => {
    setIsPlayingVideo(false);
    stopAudio();
    setCurrentSceneIdx(0);
  };

  const handleRegenerateScene = (index: number) => {
    if (!productionKit?.scenes?.[index]) return;
    const updatedScenes = [...productionKit.scenes];
    const targetScene = updatedScenes[index];
    const encodedPrompt = encodeURIComponent(targetScene.imagePrompt || "Cinematic 8k moody motivational view");
    
    targetScene.imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${Math.random()}`;
    setProductionKit({ ...productionKit, scenes: updatedScenes });
  };

  const handleExportMasterVideo = () => {
    if (!productionKit) {
      alert("Please generate a production plan first!");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ productionKit, viralMeta }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${topic.replace(/\s+/g, '_')}_master_package.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert("Master Video Package exported successfully!");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#111827] border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <span className="bg-[#ffb703] text-gray-950 font-extrabold px-3 py-1 rounded text-xs">AI Studio Pro</span>
          
          <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setActiveTab("canvas")}
              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                activeTab === "canvas" ? "bg-[#ffb703] text-gray-950" : "text-gray-400 hover:text-white"
              }`}
            >
              🎬 Studio Canvas
            </button>
            <button
              onClick={() => setActiveTab("thumbnail")}
              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "thumbnail" ? "bg-[#ffb703] text-gray-950" : "text-gray-400 hover:text-white"
              }`}
            >
              🖼️ AI Thumbnail Studio
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Resolution: 1080p (Cinematic)</span>
          <button 
            onClick={handleExportMasterVideo}
            disabled={isExporting}
            className="bg-[#ffb703] hover:bg-[#e0a102] text-gray-950 text-xs font-bold px-4 py-1.5 rounded transition cursor-pointer shadow disabled:opacity-50"
          >
            {isExporting ? "Compiling..." : "Export Master Package 📥"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Horizontal Canvas Items */}
        <div className="flex-1 bg-[#0b0f19] p-6 overflow-x-auto overflow-y-auto flex gap-5 items-start">
          
          {/* Node 1: Script & Studio Generator */}
          <div className="w-72 bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col shrink-0 shadow-lg space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <span className="text-xs font-bold text-[#ffb703]"># script & studio generator</span>
              <span className="text-[10px] text-gray-500">Node v2</span>
            </div>

            <form onSubmit={handleInitialGenerate} className="space-y-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g. Discipline)..."
                className="w-full bg-[#0b0f19] border border-gray-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#ffb703]"
              />
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#0b0f19] border border-gray-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#ffb703]"
              >
                <option value="short">🔥 Motivational Short (30-40s)</option>
                <option value="medium">Standard Long Video (2 mins)</option>
                <option value="long">Deep Documentary (4-5 mins)</option>
              </select>

              <div className="flex items-center justify-between bg-[#0b0f19] p-2 rounded border border-gray-800">
                <span className="text-[11px] text-gray-300">Neural Voice:</span>
                <select
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value)}
                  className="bg-[#111827] text-[#ffb703] text-[11px] rounded p-1 font-bold focus:outline-none"
                >
                  <option value="deep-male">Deep Cinematic</option>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Stoic Calm</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-[#0b0f19] p-2 rounded border border-gray-800">
                <span className="text-[11px] text-gray-300">Epic Ambient BGM:</span>
                <input
                  type="checkbox"
                  checked={bgmEnabled}
                  onChange={(e) => setBgmEnabled(e.target.checked)}
                  className="accent-[#ffb703] cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ffb703] hover:bg-[#e0a102] text-gray-950 font-bold text-xs py-2.5 rounded transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Drafting Script..." : "Generate Production Plan"}
              </button>
            </form>

            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

            {productionKit && (
              <div className="mt-2 space-y-1 overflow-y-auto max-h-36 text-xs text-gray-300 bg-[#0b0f19] p-2.5 rounded border border-gray-800">
                <p className="font-bold text-[#ffb703] text-[11px]">{productionKit.title}</p>
                <p className="text-[10px] text-gray-400">{productionKit.fullScript}</p>
              </div>
            )}
          </div>

          {activeTab === "thumbnail" ? (
            <div className="flex-1 min-w-[600px] bg-[#111827] border border-gray-800 rounded-xl p-6 flex flex-col shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <div>
                  <h2 className="text-sm font-bold text-[#ffb703]">🖼️ High-CTR YouTube Thumbnail Creator</h2>
                  <p className="text-[11px] text-gray-400">Generate photorealistic 16:9 viral thumbnails for your video</p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 font-bold">16:9 Ultra HD</span>
              </div>

              <div className="grid grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300">Thumbnail Overlay Text:</label>
                    <input
                      type="text"
                      value={thumbnailText}
                      onChange={(e) => setThumbnailText(e.target.value)}
                      placeholder="e.g., THE UNSTOPPABLE MINDSET"
                      className="w-full bg-[#0b0f19] border border-gray-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#ffb703]"
                    />
                  </div>

                  <button
                    onClick={handleGenerateThumbnail}
                    disabled={isGeneratingThumb || !topic}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-gray-950 font-bold text-xs py-3 rounded-lg transition cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isGeneratingThumb ? "Rendering High-CTR Art..." : "🎨 Render Viral Thumbnail"}
                  </button>

                  {thumbnailUrl && (
                    <a
                      href={thumbnailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg transition shadow cursor-pointer"
                    >
                      📥 Download Full Resolution (1280x720)
                    </a>
                  )}
                </div>

                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-[#ffb703]/50 flex items-center justify-center shadow-xl">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="High CTR Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <span className="text-3xl mb-2 block">🖼️</span>
                      <p className="text-xs text-gray-400">Generate a production plan first</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Node 2: Viral Titles & SEO */}
              {viralMeta && (
                <div className="w-72 bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col shrink-0 shadow-lg space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                    <span className="text-xs font-bold text-[#ffb703]"># viral titles & seo</span>
                    <span className="text-[10px] text-amber-400 font-bold">High CTR</span>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[380px]">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Suggested Titles:</p>
                    {viralMeta.titles.map((t: string, i: number) => (
                      <div key={i} className="bg-[#0b0f19] p-2 rounded border border-gray-800 text-[11px] text-gray-200 hover:border-[#ffb703] cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText(t);
                        alert(`Copied: "${t}"`);
                      }}>
                        {t} 📋
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Node 3: Storyboard */}
              {productionKit && (
                <div className="w-72 bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col shrink-0 shadow-lg">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800 mb-3">
                    <span className="text-xs font-bold text-[#ffb703]">
                      # storyboard ({productionKit.scenes?.length || 0} Scenes)
                    </span>
                    <button
                      onClick={startVideoPlayback}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 rounded font-bold cursor-pointer"
                    >
                      ▶ Play Full Video
                    </button>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                    {productionKit.scenes?.map((scene: any, idx: number) => (
                      <div key={idx} className="bg-[#0b0f19] p-2 rounded border border-gray-800 flex gap-2.5 items-center">
                        <img src={scene.imageUrl} alt="thumb" className="w-10 h-14 object-cover rounded border border-gray-700 shrink-0" />
                        <div className="overflow-hidden flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-[11px] font-bold text-[#ffb703]">
                              Scene {scene.sceneNumber} <span className="text-[9px] text-emerald-400">({scene.durationInSeconds}s)</span>
                            </p>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleRegenerateScene(idx)}
                                title="Regenerate"
                                className="text-[9px] bg-blue-900/50 hover:bg-blue-800 text-blue-300 px-1 py-0.5 rounded cursor-pointer"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => playRealAudio(scene.audioUrl)}
                                title="Play Audio"
                                className="text-[9px] bg-gray-800 hover:bg-gray-700 text-[#ffb703] px-1 py-0.5 rounded cursor-pointer"
                              >
                                🔊
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{scene.voiceover}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Node 4: Final Video Canvas Player */}
              {productionKit && (
                <div className="w-80 bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col shrink-0 shadow-lg">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800 mb-3">
                    <span className="text-xs font-bold text-[#ffb703]"># final video canvas</span>
                    {isPlayingVideo && (
                      <button
                        onClick={stopVideoPlayback}
                        className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                      >
                        ⏹ Stop
                      </button>
                    )}
                  </div>

                  <div className="relative w-full h-72 bg-black rounded-lg overflow-hidden border border-[#ffb703] flex flex-col items-center justify-center">
                    {isPlayingVideo && productionKit.scenes?.[currentSceneIdx] ? (
                      <>
                        <img
                          src={productionKit.scenes[currentSceneIdx].imageUrl}
                          alt="playing"
                          className="w-full flex-1 object-cover animate-fadeIn"
                        />
                        <div className="absolute top-2 left-2 bg-black/80 text-[#ffb703] px-2 py-1 rounded text-[10px] font-bold border border-[#ffb703]/30">
                          Scene {currentSceneIdx + 1} of {productionKit.scenes.length} ({productionKit.scenes[currentSceneIdx].durationInSeconds}s)
                        </div>
                        <div className="w-full bg-black/90 p-2 text-center border-t border-gray-800 shrink-0">
                          <p className="text-[11px] text-[#ffb703] font-medium leading-tight px-1 break-words">
                            "{productionKit.scenes[currentSceneIdx].voiceover}"
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-xs text-gray-400 mb-3">Play complete video with synchronized audio & subtitles</p>
                        <button
                          onClick={startVideoPlayback}
                          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow cursor-pointer"
                        >
                          ▶ Play Master Canvas
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Details */}
        <div className="w-72 bg-[#111827] border-l border-gray-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs font-bold text-[#ffb703]">Chats & Assets Details</span>
            <span className="text-[10px] bg-[#ffb703]/10 text-[#ffb703] px-2 py-0.5 rounded border border-[#ffb703]/20">Active</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {productionKit && (
              <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-gray-800 space-y-2.5 shadow-md">
                <p className="text-xs font-bold text-[#ffb703]">AI Studio Status:</p>
                <p className="text-[11px] text-gray-300">
                  Script, Viral SEO Meta, and {productionKit.scenes?.length} Scenes compiled.
                </p>
                <button
                  onClick={startVideoPlayback}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded shadow transition cursor-pointer"
                >
                  ▶ Play Complete Video
                </button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Audio Assets ({productionKit?.scenes?.length || 0} Tracks)
              </p>
              
              {productionKit?.scenes?.map((scene: any, idx: number) => (
                <div key={idx} className="bg-[#0b0f19] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={scene.imageUrl} alt="" className="w-7 h-7 object-cover rounded shrink-0 border border-gray-700" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-200 truncate">s0{scene.sceneNumber}_audio_{scene.durationInSeconds}s.mp3</p>
                      <p className="text-[9px] text-emerald-400">Neural Track ({scene.durationInSeconds}s)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playRealAudio(scene.audioUrl)}
                    className="text-[10px] bg-gray-800 hover:bg-gray-700 text-[#ffb703] px-2 py-1 rounded shrink-0 cursor-pointer"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-800 bg-[#0b0f19]">
            <input
              type="text"
              placeholder="Ask AI or adjust script..."
              className="w-full bg-[#111827] border border-gray-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffb703]"
            />
          </div>
        </div>

      </div>
    </main>
  );
}