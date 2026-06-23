import { useState } from 'react'
import { Upload, FileVideo, X, Film, Clock, Hash, AlertCircle } from 'lucide-react'

interface VideoUploaderProps {
  onFileSelect: (file: File, duration: number) => void
  disabled?: boolean
}

export default function VideoUploader({ onFileSelect, disabled }: VideoUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (f: File): boolean => {
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (f.size > maxSize) {
      setError('File too large. Maximum 500MB.')
      return false
    }
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.')
      return false
    }
    setError(null)
    return true
  }

  const getDuration = (f: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.onerror = () => resolve(0)
      video.src = URL.createObjectURL(f)
    })
  }

  const handleFile = async (f: File) => {
    if (!validateFile(f)) return
    setFile(f)
    const dur = await getDuration(f)
    setDuration(dur)
    onFileSelect(f, dur)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) await handleFile(f)
  }

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) await handleFile(f)
  }

  const remove = () => {
    setFile(null)
    setDuration(0)
    setError(null)
    onFileSelect(null as unknown as File, 0)
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${dragOver
              ? 'border-frost-400 bg-frost-500/5 scale-[1.01]'
              : 'border-night-600 hover:border-frost-500/40 bg-night-800/50 hover:bg-night-800/80'
            }`}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleInput}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            disabled={disabled}
          />
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
              ${dragOver ? 'bg-frost-500/20 scale-110' : 'bg-night-700'}`}>
              <Upload size={28} className={dragOver ? 'text-frost-300' : 'text-white/30'} />
            </div>
            <p className="text-lg font-semibold text-white/80 mb-2">
              Drop your video here
            </p>
            <p className="text-sm text-white/30 mb-1">
              or click to browse &bull; MP4, MOV, AVI, WebM
            </p>
            <p className="text-xs text-white/20">
              Max 500MB &bull; All processing is done in your browser — 100% private
            </p>
          </div>
        </div>
      ) : (
        <div className="card glass-hover">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-frost-500/10 flex items-center justify-center flex-shrink-0">
              <FileVideo size={24} className="text-frost-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white/90 truncate">{file.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button onClick={remove} disabled={disabled}
                  className="text-white/20 hover:text-red-400 transition-colors p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <Film size={13} /> {file.type.split('/')[1]?.toUpperCase() || 'VIDEO'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/5 rounded-xl px-4 py-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
