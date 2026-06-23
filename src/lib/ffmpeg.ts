import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let loaded = false

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg

  ffmpeg = new FFmpeg()

  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

  ffmpeg.on('progress', ({ progress }) => {
    const percent = Math.round(progress * 100)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ffmpeg-progress', { detail: percent }))
    }
  })

  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  loaded = true
  return ffmpeg
}

export interface ExtractOptions {
  file: File
  interval: number      // seconds between frames
  maxFrames: number
  quality?: number      // 1-31, lower is better
  format?: 'png' | 'jpg'
  width?: number        // resize width (optional)
}

export interface ExtractedFrame {
  name: string
  url: string
  timestamp: number
  size: number
}

export async function extractFrames(options: ExtractOptions): Promise<ExtractedFrame[]> {
  const ff = await getFFmpeg()
  const { file, interval, maxFrames, quality = 3, format = 'png', width } = options

  const inputName = 'input' + getExtension(file.name)
  const outputPattern = format === 'png' ? 'frame_%04d.png' : 'frame_%04d.jpg'

  await ff.writeFile(inputName, await fetchFile(file))

  const filters: string[] = [`fps=1/${interval}`]
  if (width) filters.push(`scale=${width}:-1`)

  const args = [
    '-i', inputName,
    '-vf', filters.join(','),
    '-q:v', String(quality),
    '-frame_pts', '1',
    '-vsync', 'vfr',
    outputPattern,
  ]

  await ff.exec(args)

  // Read generated files
  const frames: ExtractedFrame[] = []
  const files = await ff.listDir('/')

  const frameFiles = files
    .filter(f => f.name.startsWith('frame_') && (f.name.endsWith('.png') || f.name.endsWith('.jpg')))
    .sort()
    .slice(0, maxFrames)

  for (const f of frameFiles) {
    const data = await ff.readFile(f.name)
    const blob = new Blob([data], { type: format === 'png' ? 'image/png' : 'image/jpeg' })
    const url = URL.createObjectURL(blob)

    // Extract timestamp from filename: frame_0001.png -> pts=1
    const pts = parseInt(f.name.replace('frame_', '').replace('.png', '').replace('.jpg', ''))
    const timestamp = pts * (1000 / 1000) // pts is in seconds when frame_pts is 1

    frames.push({
      name: `frame_${String(frames.length + 1).padStart(4, '0')}.${format}`,
      url,
      timestamp,
      size: blob.size,
    })
  }

  // Cleanup input
  await ff.deleteFile(inputName)

  return frames
}

function getExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  return `.${ext || 'mp4'}`
}

export async function extractFrameAtTimestamps(
  file: File,
  timestamps: number[],
  format: 'png' | 'jpg' = 'png',
): Promise<ExtractedFrame[]> {
  const ff = await getFFmpeg()
  const inputName = 'input' + getExtension(file.name)
  await ff.writeFile(inputName, await fetchFile(file))

  const frames: ExtractedFrame[] = []

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i]
    const outName = `ts_${String(i).padStart(4, '0')}.${format}`

    await ff.exec([
      '-ss', String(ts),
      '-i', inputName,
      '-frames:v', '1',
      '-q:v', '3',
      outName,
    ])

    const data = await ff.readFile(outName)
    const blob = new Blob([data], { type: format === 'png' ? 'image/png' : 'image/jpeg' })
    const url = URL.createObjectURL(blob)

    frames.push({
      name: `frame_${String(i + 1).padStart(4, '0')}.${format}`,
      url,
      timestamp: ts,
      size: blob.size,
    })

    await ff.deleteFile(outName)
  }

  await ff.deleteFile(inputName)
  return frames
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
