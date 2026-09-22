import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'
import { UPLOADS_ROOT } from './product-image.util'

const execFileAsync = promisify(execFile)

/** Hard ceiling for a stored product video. Larger uploads are re-encoded down to this. */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024
/** We accept uploads up to this size and compress them; anything bigger is rejected outright. */
export const VIDEO_UPLOAD_LIMIT_BYTES = 300 * 1024 * 1024
export const VIDEO_ALLOWED_MIME = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/3gpp', 'video/x-msvideo']

// ffmpeg-static ships a platform-specific binary so we do not depend on a
// system-wide ffmpeg install. Falls back to PATH lookup if the package is
// missing for some reason.
function ffmpegBin(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const p = require('ffmpeg-static')
    if (p && fs.existsSync(p)) return p
  } catch {}
  return 'ffmpeg'
}

function productVideoDir(category: string, productId: string) {
  const safeCategory = (category || 'other').replace(/[^a-z0-9_-]/gi, '_')
  return path.join(UPLOADS_ROOT, 'products', safeCategory, productId, 'video')
}

/** Parse "Duration: HH:MM:SS.xx" out of ffmpeg's stderr banner. */
async function probeDurationSeconds(file: string): Promise<number> {
  try {
    await execFileAsync(ffmpegBin(), ['-i', file, '-hide_banner'], { maxBuffer: 4 * 1024 * 1024 })
  } catch (e: any) {
    // ffmpeg exits non-zero when no output is given — the info is in stderr.
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(e?.stderr || '')
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
  }
  return 0
}

/**
 * Re-encode `input` to H.264/AAC MP4 targeting `targetBytes`. Bitrate is
 * derived from the clip duration so the result lands just under the cap.
 * Also caps resolution at 720p and frame-rate at 30 — plenty for a farm
 * product clip and dramatically cheaper to store and stream on rural 4G.
 */
async function compressTo(input: string, output: string, targetBytes: number) {
  const duration = Math.max(await probeDurationSeconds(input), 1)
  const audioKbps = 96
  // 8% safety margin for container overhead.
  const totalKbps = Math.floor((targetBytes * 8 * 0.92) / duration / 1000)
  const videoKbps = Math.max(Math.min(totalKbps - audioKbps, 4000), 250)

  await execFileAsync(
    ffmpegBin(),
    [
      '-y',
      '-i', input,
      '-vf', "scale='min(1280,iw)':-2",
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-b:v', `${videoKbps}k`,
      '-maxrate', `${Math.floor(videoKbps * 1.2)}k`,
      '-bufsize', `${videoKbps * 2}k`,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', `${audioKbps}k`,
      '-ac', '2',
      output,
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  )
}

/**
 * Persist an uploaded video for a product and return its public URL.
 *  - <= 50 MB: stored as-is (remuxed to .mp4 only if it isn't mp4 already).
 *  - >  50 MB: compressed with ffmpeg down to <= 50 MB. If a first pass is
 *    still over the cap (rare — rounding, VBR), a second tighter pass runs.
 */
export async function saveProductVideo(
  category: string,
  productId: string,
  file: { buffer: Buffer; originalname: string; mimetype?: string },
): Promise<string> {
  const dir = productVideoDir(category, productId)
  fs.mkdirSync(dir, { recursive: true })

  const filename = `${uuidv4()}.mp4`
  const finalPath = path.join(dir, filename)
  const tmpIn = path.join(os.tmpdir(), `kp-video-${uuidv4()}${path.extname(file.originalname) || '.bin'}`)
  fs.writeFileSync(tmpIn, file.buffer)

  try {
    const isMp4 = (file.mimetype || '').includes('mp4') || /\.mp4$/i.test(file.originalname)
    if (file.buffer.length <= VIDEO_MAX_BYTES && isMp4) {
      fs.copyFileSync(tmpIn, finalPath)
    } else if (file.buffer.length <= VIDEO_MAX_BYTES) {
      // Small but not mp4 — remux/transcode without a bitrate target so browsers can play it.
      await execFileAsync(ffmpegBin(), ['-y', '-i', tmpIn, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', finalPath], { maxBuffer: 16 * 1024 * 1024 })
      if (fs.statSync(finalPath).size > VIDEO_MAX_BYTES) {
        await compressTo(tmpIn, finalPath, VIDEO_MAX_BYTES)
      }
    } else {
      await compressTo(tmpIn, finalPath, VIDEO_MAX_BYTES)
      if (fs.statSync(finalPath).size > VIDEO_MAX_BYTES) {
        // Second, stricter pass aiming 15% lower.
        await compressTo(tmpIn, finalPath, Math.floor(VIDEO_MAX_BYTES * 0.85))
      }
    }
  } finally {
    try { fs.unlinkSync(tmpIn) } catch {}
  }

  const safeCategory = (category || 'other').replace(/[^a-z0-9_-]/gi, '_')
  return `/uploads/products/${safeCategory}/${productId}/video/${filename}`
}

/** Remove a product's video folder (the image util removes the whole product dir anyway). */
export function deleteProductVideo(category: string, productId: string): void {
  const dir = productVideoDir(category, productId)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}
