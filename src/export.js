export async function prepareMp4(capture, seconds) {
  const headers = {'Content-Type':capture.type || 'application/octet-stream'};
  if (Number.isFinite(seconds) && seconds > 0) headers['X-Bond-Duration'] = String(seconds);
  const response = await fetch('/api/export-mp4', {method:'POST',headers,body:capture});
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Run the local app server with FFmpeg available, then retry MP4 export.');
  }
  if (!response.headers.get('content-type')?.startsWith('video/mp4')) throw new Error('MP4 export requires the local app server.');
  return response.blob();
}
