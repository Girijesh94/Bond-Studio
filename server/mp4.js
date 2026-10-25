import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, stat, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile), MAX_BYTES = 200 * 1024 * 1024;
export function createMp4Middleware() {
  let active = 0;
  return async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/export-mp4') return next();
    const fail = (status, message) => { if (!res.headersSent) { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:message})); } };
    if (req.method !== 'POST') return fail(405, 'Use POST to prepare an MP4.');
    if (req.headers.origin) {
      try { if (new URL(req.headers.origin).host !== req.headers.host) return fail(403, 'Open the app on this local server to export.'); }
      catch { return fail(403, 'Invalid request origin.'); }
    }
    if (Number(req.headers['content-length']) > MAX_BYTES) return fail(413, 'Choose a shorter recording (maximum 200 MB).');
    const duration = req.headers['x-bond-duration'] === undefined ? null : Number(req.headers['x-bond-duration']);
    if (duration !== null && (!Number.isFinite(duration) || duration <= 0 || duration > 180)) return fail(400, 'Recording length must be between 0 and 180 seconds.');
    if (active >= 2) return fail(429, 'Another MP4 is being prepared. Try again shortly.');
    active++; let folder;
    try {
      folder = await mkdtemp(join(tmpdir(), 'bond-studio-mp4-'));
      const input = join(folder, 'capture.input'), output = join(folder, 'video.mp4'); let received = 0;
      const limiter = new Transform({ transform(chunk, encoding, callback) { received += chunk.length; callback(received > MAX_BYTES ? new Error('Recording exceeds 200 MB.') : null, chunk); } });
      await pipeline(req, limiter, createWriteStream(input));
      await run(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-i', input,
        '-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-r', '30', '-fps_mode', 'cfr', '-c:a', 'aac', '-b:a', '192k',
        ...(duration === null ? [] : ['-vf','tpad=stop_mode=clone:stop_duration=0.25','-af','apad','-t',String(duration)]),
        '-movflags', '+faststart', output,
      ], { timeout:180000, maxBuffer:1024 * 1024, windowsHide:true });
      const info = await stat(output);
      res.writeHead(200, {'Content-Type':'video/mp4','Content-Length':info.size,'Content-Disposition':'attachment; filename="bond-studio.mp4"','Cache-Control':'no-store'});
      await pipeline(createReadStream(output), res);
    } catch (error) {
      fail(500, error.code === 'ENOENT' ? 'FFmpeg is required for MP4 export. Install FFmpeg or set FFMPEG_PATH, then retry.' : 'MP4 preparation failed. Please retry with a shorter recording.');
    } finally {
      active--;
      // Delete only our two generated files, then their empty temporary folder.
      if (folder) {
        await Promise.allSettled(['capture.input','video.mp4'].map(name => unlink(join(folder, name))));
        await rmdir(folder).catch(() => {});
      }
    }
  };
}
