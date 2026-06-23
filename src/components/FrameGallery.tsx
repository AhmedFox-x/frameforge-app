import { useState } from 'react'
import { Download, Check, Image, FileDown } from 'lucide-react'
import type { ExtractedFrame } from '../lib/ffmpeg'
import { formatSize } from '../lib/ffmpeg'

interface FrameGalleryProps {
  frames: ExtractedFrame[]
}

export default function FrameGallery({ frames }: FrameGalleryProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [viewIndex, setViewIndex] = useState<number | null>(null)

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(frames.map((_, i) => i)))
  const deselectAll = () => setSelected(new Set())

  const downloadFrame = (frame: ExtractedFrame) => {
    const a = document.createElement('a')
    a.href = frame.url
    a.download = frame.name
    a.click()
  }

  const downloadSelected = async () => {
    for (const i of Array.from(selected).sort()) {
      downloadFrame(frames[i])
      await new Promise(r => setTimeout(r, 200))
    }
  }

  const downloadAll = () => {
    selectAll()
    setTimeout(downloadSelected, 100)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Image size={16} />
          <span><strong className="text-white/80">{frames.length}</strong> frames extracted</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="btn-ghost text-xs">Select All</button>
          <button onClick={deselectAll} className="btn-ghost text-xs">Deselect</button>
          {selected.size > 0 && (
            <button onClick={downloadSelected} className="btn-primary text-xs">
              <Download size={14} /> Download Selected ({selected.size})
            </button>
          )}
          <button onClick={downloadAll} className="btn-ghost text-xs">
            <FileDown size={14} /> All
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {frames.map((frame, i) => (
          <div
            key={i}
            className={`group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer
              ${selected.has(i)
                ? 'border-frost-500/50 ring-2 ring-frost-500/20'
                : 'border-night-700 hover:border-night-500'
              }`}
            onClick={() => toggleSelect(i)}
            onDoubleClick={() => setViewIndex(i)}
          >
            <div className="aspect-video bg-night-800 overflow-hidden">
              <img
                src={frame.url}
                alt={frame.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-night-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white/60 font-mono">
                #{i + 1}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); downloadFrame(frame) }}
                className="text-white/60 hover:text-white transition-colors p-0.5"
              >
                <Download size={12} />
              </button>
            </div>
            {selected.has(i) && (
              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-frost-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
            <div className="px-2 py-1.5 bg-night-800/80">
              <p className="text-[10px] text-white/40 font-mono truncate">{frame.name}</p>
              <p className="text-[9px] text-white/20">{formatSize(frame.size)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {viewIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/95 backdrop-blur-lg"
          onClick={() => setViewIndex(null)}>
          <div className="relative max-w-5xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={frames[viewIndex].url}
              alt={frames[viewIndex].name}
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => downloadFrame(frames[viewIndex])}
                className="w-10 h-10 rounded-xl bg-night-800/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => setViewIndex(null)}
                className="w-10 h-10 rounded-xl bg-night-800/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <p className="text-sm text-white/60 font-mono">{frames[viewIndex].name}</p>
              <p className="text-sm text-white/40">{formatSize(frames[viewIndex].size)}</p>
            </div>
            {viewIndex > 0 && (
              <button
                onClick={() => setViewIndex(viewIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-night-800/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            {viewIndex < frames.length - 1 && (
              <button
                onClick={() => setViewIndex(viewIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-night-800/80 backdrop-blur border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
