import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createMp4Middleware } from './mp4.js';
const run = promisify(execFile);

test('MP4 export produces real H.264 picture and AAC audio, and rejects other origins', async t => {
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  try { await run(ffmpeg, ['-version'], {windowsHide:true}); } catch (e) { if (e.code === 'ENOENT') { t.skip('Install FFmpeg to run the MP4 integration check.'); return; } throw e; }
  const folder = await mkdtemp(join(tmpdir(), 'bond-mp4-test-')), input = join(folder,'test.webm'), output = join(folder,'result.mp4');
  const middleware = createMp4Middleware();
  const server = createServer((req,res) => middleware(req,res,() => {res.writeHead(404);res.end();}));
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve)); const url = `http://127.0.0.1:${server.address().port}/api/export-mp4`;
  try {
    await run(ffmpeg,['-v','error','-f','lavfi','-i','color=c=black:s=540x960:d=0.4','-f','lavfi','-i','sine=frequency=220:duration=0.4','-c:v','libvpx-vp9','-c:a','libopus','-shortest','-y',input],{windowsHide:true});
    const response = await fetch(url,{method:'POST',headers:{'X-Bond-Duration':'0.4'},body:await readFile(input)});
    assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'video/mp4');
    const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(bytes.toString('ascii',4,8),'ftyp'); await writeFile(output,bytes);
    const probe = await run('ffprobe',['-v','quiet','-show_entries','stream=codec_name,codec_type,width,height,avg_frame_rate:format=duration','-of','json',output],{windowsHide:true});
    const info = JSON.parse(probe.stdout), streams = info.streams;
    assert.equal(streams.find(s=>s.codec_type==='video').codec_name,'h264'); assert.equal(streams.find(s=>s.codec_type==='audio').codec_name,'aac');
    assert.equal(streams.find(s=>s.codec_type==='video').height,960);
    assert.equal(streams.find(s=>s.codec_type==='video').avg_frame_rate,'30/1'); assert.ok(Math.abs(Number(info.format.duration) - .4) < .03);
    assert.equal((await fetch(url,{method:'POST',headers:{Origin:'https://example.com'},body:'bad'})).status,403);
    assert.equal((await fetch(url)).status,405);
    assert.equal((await fetch(url,{method:'POST',headers:{'X-Bond-Duration':'900'},body:'bad'})).status,400);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await Promise.allSettled([input,output].map(path=>unlink(path))); await rmdir(folder);
  }
});
