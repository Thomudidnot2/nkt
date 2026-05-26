import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Eye, Calendar, Tag, ShieldCheck, Video, ExternalLink } from "lucide-react";
import { MediaAsset } from "../types";

export default function MediaHub() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [activeMedia, setActiveMedia] = useState<MediaAsset | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch("/api/media");
        if (res.ok) {
          const data = await res.json();
          setMedia(data);
          if (data.length > 0) {
            setActiveMedia(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load media assets:", err);
      }
    };
    fetchMedia();
  }, []);

  return (
    <section className="relative py-20 bg-slate-950/20 border-t border-b border-white/5 px-4">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-white/10 text-cyan-300 mb-3 text-xs font-mono uppercase">
              <Video className="w-4.5 h-4.5 text-cyan-400" />
              Drone Cinematography Showcase
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              Aerial Imagery & Photography
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Sharing scenic recordings and photography showcasing the structural beauty of Thodupuzha and the surrounding Idukki district.
          </p>
        </div>

        {/* Video Theater Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Selected Video Screen */}
          {activeMedia ? (
            <div className="lg:col-span-8 space-y-4">
              <div className="relative aspect-video rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl group flex items-center justify-center">
                {/* Clean responsive visual iframe of YouTube placeholder or map simulation */}
                <iframe
                  id="thomu-theatre-iframe"
                  src={activeMedia.embedUrl}
                  title={activeMedia.title}
                  className="w-full h-full border-0 pointer-events-auto"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video Info Card */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white font-sans">{activeMedia.title}</h3>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 border border-cyan-500/20 text-cyan-400">
                    {activeMedia.resolution}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{activeMedia.description}</p>
                
                <div className="flex items-center gap-5 font-mono text-[10px] text-slate-500 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Published: {activeMedia.publishDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{activeMedia.views.toLocaleString()} views</span>
                  </div>
                </div>

                {/* Subheading items */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {activeMedia.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded">
                      <Tag className="w-2.5 h-2.5 text-cyan-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 flex items-center justify-center bg-slate-950/40 border border-white/5 aspect-video rounded-2xl">
              <span className="text-slate-500 text-sm font-mono leading-none animate-pulse">Establishing stream...</span>
            </div>
          )}

          {/* Sidebar Playlist */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2 px-1">Selected Portfolios</h4>
            
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {media.map((asset) => {
                const isSelected = activeMedia?.id === asset.id;
                return (
                  <button
                    id={`playlist-item-${asset.id}`}
                    key={asset.id}
                    onClick={() => setActiveMedia(asset)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer block ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/30 shadow-md"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                        isSelected ? "bg-cyan-500 text-slate-950" : "bg-slate-900 border border-white/10 text-slate-400"
                      }`}>
                        <Play className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                          {asset.duration} // {asset.resolution}
                        </span>
                        <h5 className="text-xs font-semibold text-white font-sans line-clamp-2 leading-snug">
                          {asset.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 truncate mt-1">
                          {asset.publishDate}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
