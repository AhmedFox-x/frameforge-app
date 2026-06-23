import { useState, useEffect, useCallback, useRef } from 'react'
import { Film, Settings2, Timer, ImageDown, Loader2, Info, Sparkles, ArrowRight } from 'lucide-react'
import VideoUploader from './components/VideoUploader'
import FrameGallery from './components/FrameGallery'
import { extractFrames, type ExtractedFrame, formatDuration } from './lib/ffmpeg'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [interval, setInterval] = useState(1)
  const [maxFrames, setMaxFrames] = useState(50)
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [frames, setFrames] = useState<ExtractedFrame[]>([])
  const [error, setError] = useState<string | null>(null)
  const progressRef = useRef<((e: CustomEvent) => void) | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const { detail } = e as CustomEvent
      setProgress(detail)
    }
    window.addEventListener('ffmpeg-progress', handler as EventListener)
    return () => window.removeEventListener('ffmpeg-progress', handler as EventListener)
  }, [])

  const handleFileSelect = (f: File, dur: number) => {
    setFile(f)
    setDuration(dur)
    setFrames([])
    setError(null)
  }

  const process = useCallback(async () => {
    if (!file) return
    setProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const result = await extractFrames({
        file,
        interval,
        maxFrames,
        format,
        quality: 3,
      })
      setFrames(result)
    } catch (e: any) {
      setError(e?.message || 'Processing failed. The video format may not be supported.')
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }, [file, interval, maxFrames, format])

  const estimatedFrames = Math.min(Math.floor(duration / interval), maxFrames)

  const scrollToFrames = () => {
    document.getElementById('frames-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-night-900">
      {/* ─── NAV ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.03] bg-night-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-frost-500 to-frost-700 flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Frame<span className="gradient-text">Forge</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#how-it-works" className="text-sm text-white/40 hover:text-white/70 transition-colors hidden sm:block">
              How it Works
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-white/30 hover:text-white/70 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-frost-600/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-frost-400/5 rounded-full blur-3xl animate-float" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-frost-500/10 border border-frost-500/20 text-frost-300 text-xs font-medium mb-8">
            <Sparkles size={14} />
            Powered by FFmpeg WASM — 100% in your browser
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Extract Frames from
            <br />
            <span className="gradient-text">Any Video Instantly</span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-4">
            No uploads. No servers. Your video never leaves your device.
            Fast, private, and free frame extraction powered by WebAssembly.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-10 text-sm">
            {[
              ['🎯', 'High Quality', 'Lossless PNG or JPG'],
              ['⚡', 'Blazing Fast', 'Browser-native speed'],
              ['🔒', '100% Private', 'Nothing leaves your PC'],
              ['🆓', 'Completely Free', 'No sign-up required'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="text-center">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-white/70 font-medium text-xs">{title}</p>
                <p className="text-white/30 text-[10px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONVERTER ─────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="card gradient-border space-y-8">
          {/* Upload */}
          <div>
            <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <Film size={16} className="text-frost-400" />
              1. Upload Your Video
            </h2>
            <VideoUploader onFileSelect={handleFileSelect} disabled={processing} />
          </div>

          {/* Settings */}
          {file && (
            <div>
              <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                <Settings2 size={16} className="text-frost-400" />
                2. Configure Extraction
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium flex items-center gap-1.5">
                    <Timer size={13} /> Interval (seconds)
                  </label>
                  <div className="relative">
                    <input type="number" min={0.1} max={60} step={0.1} value={interval}
                      onChange={e => setInterval(parseFloat(e.target.value) || 1)}
                      className="input-field pr-12" disabled={processing} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/20">sec</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium flex items-center gap-1.5">
                    <ImageDown size={13} /> Max Frames
                  </label>
                  <input type="number" min={1} max={500} value={maxFrames}
                    onChange={e => setMaxFrames(parseInt(e.target.value) || 50)}
                    className="input-field" disabled={processing} />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium flex items-center gap-1.5">
                    <ImageDown size={13} /> Output Format
                  </label>
                  <select value={format} onChange={e => setFormat(e.target.value as 'png' | 'jpg')}
                    className="input-field" disabled={processing}>
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpg">JPG (Smaller)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/30 bg-white/[0.02] rounded-xl px-4 py-3">
                <Info size={14} />
                Estimated: <strong className="text-white/50">{estimatedFrames}</strong> frames
                &bull; Duration: <strong className="text-white/50">{formatDuration(duration)}</strong>
              </div>
            </div>
          )}

          {/* Process button */}
          {file && (
            <button
              onClick={process}
              disabled={processing}
              className="btn-primary w-full text-base py-4 relative overflow-hidden group"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 size={18} className="animate-spin" />
                  Extracting frames... {progress > 0 && `${progress}%`}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Extract {estimatedFrames} Frames
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          )}

          {/* Progress bar */}
          {processing && progress > 0 && (
            <div className="w-full bg-night-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-frost-600 to-frost-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl px-5 py-4 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ─── FRAMES ────────────────────────────────────────── */}
      {frames.length > 0 && (
        <section id="frames-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="card">
            <FrameGallery frames={frames} />
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12">
          How It <span className="gradient-text">Works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '📤', title: 'Upload Video', desc: 'Drop any video file — MP4, MOV, AVI, or WebM up to 500MB.' },
            { step: '02', icon: '⚙️', title: 'Set Parameters', desc: 'Choose frame interval, max frames, and output format (PNG or JPG).' },
            { step: '03', icon: '🎉', title: 'Download Frames', desc: 'Extract frames instantly in your browser. Download individually or as a batch.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="card text-center glass-hover group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
              <p className="text-[10px] text-frost-400 font-mono font-medium mb-2">{step}</p>
              <h3 className="font-semibold text-white/80 mb-2">{title}</h3>
              <p className="text-sm text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.03] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-white/20">
            <Film size={14} className="text-frost-400/50" />
            <span>FrameForge &mdash; Open source video frame extractor</span>
          </div>
          <p className="text-xs text-white/10">
            Built with FFmpeg WASM &bull; All processing happens client-side
          </p>
        </div>
      </footer>
    </div>
  )
}
