import './style.css';
import '@fontsource-variable/dm-sans';
import { createIcons, icons } from 'lucide';
import { Simulation } from './physics.js';
import { drawSimulation } from './renderer.js';
import { BondAudio, SEMITONES } from './audio.js';
import { saveProject, loadProject } from './storage.js';
import { prepareImage } from './image-processing.js';

const colors = ['#a9c7f5', '#c0a5eb', '#ffbc87', '#fb8f9d', '#a9dcb7', '#f4da7a', '#79d3d4', '#eea6d2'];
let stages = colors.map((color, i) => ({ id: `stage-${i}`, name: `Ball ${i + 1}`, color, image: null, imageMode: 'circle', imageName: '', sound: null, soundName: '' }));
let selected = stages[0].id, sharedFile = null, running = false, recorder = null, recording = false, recordStart = 0, recordDuration = 60, chunks = [], downloadUrl = null, saveTimer, dragId, previewTimers = [];
const images = new Map(), audio = new BondAudio();
const $ = s => document.querySelector(s);
const icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sim = new Simulation(level => { audio.play(level, stages[level].id); $('#last-event').textContent = `Two ${stages[level - 1].name} → ${stages[level].name}`; });

$('#app').innerHTML = `
  <header class="topbar"><a class="brand" href="/" aria-label="Bond Studio home"><span class="brand-mark">${icon('orbit')}</span>bond<span class="brand-light">studio</span></a><div class="header-middle">Your images. Your sound. A little physics.</div><span id="save-status" class="save-status">${icon('hard-drive')} Saved on this device</span><button id="help" class="icon-button" aria-label="How it works">${icon('circle-help')}</button></header>
  <main>
    <div class="page-heading"><div><h1>Make something click.</h1><p>Turn eight images into one satisfying chain reaction.</p></div><div class="heading-note">${icon('shield-check')} Your files stay in your browser</div></div>
    <div class="workspace">
      <section class="panel sequence-panel" aria-labelledby="sequence-heading"><div class="panel-title"><h2 id="sequence-heading">Merge sequence <span>8 stages</span></h2><button id="bulk-upload" class="icon-button" aria-label="Upload up to eight images" title="Upload up to eight images">${icon('images')}</button></div><p class="panel-intro">Two of a kind become the next in line.<br>Drag to reorder, or use the arrows.</p><div id="stages" class="stages"></div><button id="add-images" class="button full subtle">${icon('upload')} Upload images <span>up to 8</span></button><div id="image-options"></div><div class="sequence-note">${icon('git-merge')} Matching balls merge automatically.<br>The last stage is the final form.</div></section>
      <section class="preview-section" aria-label="Simulation preview"><div class="preview-top"><div><span class="live-dot"></span><span id="preview-status">Ready to play</span></div><span>9:16 <span class="muted">/</span> 540 × 960</span></div><div class="canvas-wrap"><canvas id="canvas" width="540" height="960" aria-label="Bouncing balls in a circular arena on a black background. Press Play to start."></canvas><div id="preview-overlay" class="preview-overlay" hidden><span>${icon('mouse-pointer-2')} Press play to set things in motion</span></div><span id="record-badge" class="record-badge" hidden>REC <b>00:00</b></span></div><div class="transport"><button id="reset" class="icon-button" aria-label="Restart simulation" title="Restart">${icon('rotate-ccw')}</button><button id="play" class="button play-button">${icon('play')} Play simulation</button><button id="mute" class="icon-button" aria-label="Mute audio" title="Mute audio">${icon('volume-2')}</button></div><div class="simulation-stats"><span><strong id="merge-count">0</strong> merges</span><span id="last-event">A new chain reaction is waiting.</span><span id="elapsed">00:00</span></div></section>
      <aside class="settings"><section class="panel sound-panel" aria-labelledby="sound-heading"><div class="panel-title"><h2 id="sound-heading">The sound of a merge</h2>${icon('audio-lines')}</div><p class="panel-intro">One sound. Eight personalities.</p><button id="shared-upload" class="audio-drop"><span class="upload-circle">${icon('music-2')}</span><strong id="shared-name">Add your signature sound</strong><span>Upload MP3, WAV, or M4A</span><span class="browse-label">Choose audio ${icon('arrow-up-right')}</span></button><div class="sound-file-actions"><span id="shared-detail">Built-in chime until you add a sound</span><button id="clear-shared" class="text-button" hidden>Remove</button></div><div class="pitch-label"><strong>${icon('sparkles')} Automatic pitch</strong><span>Always on</span></div><div id="pitch-ladder" class="pitch-ladder" aria-label="Deepening pitch by stage"></div><p class="small-note">Each new form sounds deeper. Assigned sounds deepen too.</p><button id="audition" class="button full subtle">${icon('headphones')} Listen to the sequence</button><label class="volume-label" for="volume"><span>Volume</span><span id="volume-value">65%</span></label><input id="volume" type="range" min="0" max="100" value="65"></section>
      <section class="panel selected-panel" aria-labelledby="selected-heading"><div class="panel-title"><h2 id="selected-heading">Selected image audio</h2><span class="optional">Optional</span></div><div id="selected-details"></div></section>
      <section class="export-panel"><div><h2>Made to be watched.</h2><p>Record your simulation, sound included.</p></div><label for="duration">Video length<select id="duration"><option value="15">15 seconds</option><option value="30">30 seconds</option><option value="60" selected>60 seconds + 2s finale</option><option value="120">120 seconds</option></select></label><button id="record" class="button export-button">${icon('circle')} Record video</button><a id="download" class="button download-button" hidden>${icon('download')} Download video</a><span id="export-note">60s run + 2s finale · WebM / MP4</span></section></aside>
    </div><footer><span>Built for satisfying little collisions.</span><span>Images + sound are yours. The physics takes care of itself.</span></footer>
  </main><div id="toast" role="status" aria-live="polite"></div><dialog id="help-dialog"><div class="dialog-top"><h2>A little guide to bonding</h2><button id="close-help" class="icon-button" aria-label="Close guide">${icon('x')}</button></div><ol><li><strong>Choose your cast.</strong> Upload up to eight images. Choose Change to circle for a circular crop, or Keep same for an image-only logo. Plain backgrounds are removed automatically; transparent PNGs work best for complex artwork.</li><li><strong>Set the order.</strong> Drag a stage or use its arrows. Two matching balls create one ball from the next stage.</li><li><strong>Give it a sound.</strong> Upload a shared audio clip. Higher stages use a deeper pitch; this also makes the clip longer. Clips play for up to three seconds.</li><li><strong>Make exceptions.</strong> Select an image and assign its own sound. Assigned sounds also deepen by stage and move with their image.</li><li><strong>Capture the chain reaction.</strong> Record restarts the simulation and saves a portrait video with sound. Keep this tab visible while recording.</li></ol><p>Your images, sounds, and order are saved in this browser on this device. Stage 1 is the falling starter ball; its sound is for auditioning, because merges create stages 2–8. The cannon fires 128 starters. Timed attraction brings matching pairs together, with the final merge at exactly 60 seconds of simulation time. A 60-second recording includes a two-second finale hold so the final form and its sound are captured.</p><button id="got-it" class="button play-button">Got it</button></dialog><input id="image-input" type="file" accept="image/*" hidden><input id="bulk-input" type="file" accept="image/*" multiple hidden><input id="shared-input" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" hidden><input id="custom-input" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" hidden>`;

function refreshIcons() { createIcons({ icons, attrs: { 'stroke-width': 1.7 } }); }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
function persist() {
  clearTimeout(saveTimer); $('#save-status').innerHTML = `${icon('loader-circle')} Saving…`; refreshIcons();
  saveTimer = setTimeout(async () => {
    try { await saveProject({ stages, sharedFile, volume: audio.volume }); $('#save-status').innerHTML = `${icon('hard-drive')} Saved on this device`; }
    catch { $('#save-status').textContent = 'Changes are not saved'; toast('Browser storage is full or unavailable. Keep this tab open to keep your files.'); }
    refreshIcons();
  }, 250);
}
function thumbnail(stage, cls = '') { return `<span class="ball-thumb ${stage.imageMode === 'original' && stage.image ? 'image-only' : ''} ${cls}" style="--ball:${stage.color}">${stage.image ? `<img src="${stage.image}" alt="">` : icon('circle-dot')}</span>`; }
function renderStages() {
  $('#stages').innerHTML = stages.map((s, i) => `<div class="stage-row ${selected === s.id ? 'selected' : ''}" draggable="true" data-id="${s.id}"><span class="drag-handle" aria-hidden="true">${icon('grip-vertical')}</span><button class="stage-select" data-select="${s.id}" aria-label="Select ${escape(s.name)}, stage ${i + 1}" aria-pressed="${selected === s.id}">${thumbnail(s)}<span class="stage-copy"><strong>${escape(s.name)}</strong><span>${i === 0 ? 'Starter ball' : i === 7 ? 'Final form' : `Stage ${i + 1}`} ${s.sound ? '· Custom sound' : ''}</span></span></button><div class="stage-actions"><button class="icon-button tiny" data-image="${s.id}" aria-label="${s.image ? 'Replace' : 'Upload'} image for ${escape(s.name)}">${icon(s.image ? 'image' : 'plus')}</button><div class="reorder-buttons"><button data-move="${s.id}" data-direction="-1" aria-label="Move ${escape(s.name)} earlier" ${i === 0 ? 'disabled' : ''}>${icon('chevron-up')}</button><button data-move="${s.id}" data-direction="1" aria-label="Move ${escape(s.name)} later" ${i === 7 ? 'disabled' : ''}>${icon('chevron-down')}</button></div></div><div class="stage-audio"><button class="stage-audio-upload" data-audio-upload="${s.id}" aria-label="${s.sound ? 'Replace' : 'Add'} audio for ${escape(s.name)}">${icon('audio-lines')} ${s.sound ? 'Replace audio' : 'Add audio'}</button><span title="${escape(s.soundName || 'Shared sound')}">${escape(s.soundName || 'Shared sound')}</span>${s.sound ? `<button class="icon-button tiny" data-audio-preview="${s.id}" aria-label="Preview audio for ${escape(s.name)}">${icon('play')}</button><button class="icon-button tiny" data-audio-clear="${s.id}" aria-label="Remove audio for ${escape(s.name)}">${icon('x')}</button>` : ''}</div></div>`).join('');
  $('#pitch-ladder').innerHTML = stages.map((s, i) => `<button class="pitch-step" data-sound="${s.id}" aria-label="Preview ${escape(s.name)}, ${s.sound ? 'custom sound' : SEMITONES[i] + ' semitones'}"><span style="height:${45 - i * 4}px;background:${s.color}"></span><small>${i + 1}</small></button>`).join('');
  renderSelected(); renderImageOptions(); refreshIcons();
}
function renderSelected() {
  const s = stages.find(s => s.id === selected), i = stages.indexOf(s);
  $('#selected-details').innerHTML = `<div class="selected-identity">${thumbnail(s)}<div><label class="sr-only" for="ball-name">Ball name</label><input id="ball-name" maxlength="28" value="${escape(s.name)}" aria-label="Ball name"><span>Stage ${i + 1}${i === 0 ? ' · Starter / preview only' : ` · ${SEMITONES[i] + ' semitones'}`}</span></div><button id="test-stage" class="icon-button" aria-label="Preview selected ball sound">${icon('play')}</button></div><button id="custom-upload" class="button full subtle">${icon('audio-lines')} ${s.sound ? 'Replace custom sound' : 'Assign a custom sound'}</button><div class="custom-status"><span>${s.sound ? escape(s.soundName) : 'Uses the shared sound + automatic pitch'}</span>${s.sound ? '<button id="clear-custom" class="text-button">Remove</button>' : ''}</div>${s.image ? '<button id="clear-image" class="text-button remove-image">Remove this image</button>' : ''}`;
  $('#custom-upload').onclick = () => { $('#custom-input').dataset.target = selected; $('#custom-input').click(); };
  $('#test-stage').onclick = async () => { await audio.init(); audio.play(i, s.id); };
  $('#ball-name').onchange = event => { s.name = event.target.value.trim() || `Ball ${i + 1}`; renderStages(); persist(); };
  if ($('#clear-custom')) $('#clear-custom').onclick = () => { s.sound = null; s.soundName = ''; audio.overrides.delete(s.id); renderStages(); persist(); };
  if ($('#clear-image')) $('#clear-image').onclick = () => { s.image = null; s.originalImage = null; s.circleImage = null; s.logoImage = null; s.imageName = ''; images.delete(s.id); renderStages(); persist(); };
}
function updateShared() { $('#shared-name').textContent = sharedFile?.name || 'Add your signature sound'; $('#shared-detail').textContent = sharedFile ? 'Shared sound · automatically pitched' : 'Built-in chime until you add a sound'; $('#clear-shared').hidden = !sharedFile; }
function cancelAudition() { previewTimers.forEach(clearTimeout); previewTimers = []; audio.stopAll(); }
function restart() { cancelAudition(); sim.reset(); $('#last-event').textContent = 'A new chain reaction is waiting.'; }
function setRunning(value) { if (value && !running) previous = performance.now(); running = value; $('#play').innerHTML = `${icon(value ? 'pause' : 'play')} ${value ? 'Pause simulation' : 'Play simulation'}`; $('#preview-status').textContent = recording ? 'Recording' : value ? 'Simulation is running' : sim.elapsed > 0 ? 'Paused' : 'Ready to play'; $('#preview-overlay').hidden = true; refreshIcons(); }
function reorder(from, to) { if (recording || from === to || to < 0 || to > 7) return; const [s] = stages.splice(from, 1); stages.splice(to, 0, s); restart(); renderStages(); persist(); }
$('#stages').onclick = async event => {
  const audioUpload = event.target.closest('[data-audio-upload]'), audioPreview = event.target.closest('[data-audio-preview]'), audioClear = event.target.closest('[data-audio-clear]');
  if (recording) return;
  if (audioUpload) { selected = audioUpload.dataset.audioUpload; renderStages(); $('#custom-input').dataset.target = selected; $('#custom-input').click(); return; }
  if (audioPreview) { const index = stages.findIndex(s => s.id === audioPreview.dataset.audioPreview); await audio.init(); audio.play(index, stages[index].id); return; }
  if (audioClear) { const s = stages.find(s => s.id === audioClear.dataset.audioClear); s.sound = null; s.soundName = ''; audio.overrides.delete(s.id); renderStages(); persist(); return; }
  const select = event.target.closest('[data-select]'), upload = event.target.closest('[data-image]'), move = event.target.closest('[data-move]');
  if (select) { selected = select.dataset.select; renderStages(); }
  if (upload) { selected = upload.dataset.image; renderStages(); $('#image-input').dataset.target = upload.dataset.image; $('#image-input').click(); }
  if (move) { const from = stages.findIndex(s => s.id === move.dataset.move); reorder(from, from + Number(move.dataset.direction)); }
};
$('#stages').ondragstart = event => { if (recording) { event.preventDefault(); return; } dragId = event.target.closest('.stage-row')?.dataset.id; event.dataTransfer.setData('text/plain', dragId); event.dataTransfer.effectAllowed = 'move'; };
$('#stages').ondragover = event => { if (dragId) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } };
$('#stages').ondrop = event => { event.preventDefault(); const target = event.target.closest('.stage-row')?.dataset.id; if (dragId && target) reorder(stages.findIndex(s => s.id === dragId), stages.findIndex(s => s.id === target)); dragId = null; };
$('#stages').ondragend = () => { dragId = null; };
$('#pitch-ladder').onclick = async event => { const el = event.target.closest('[data-sound]'); if (el) { await audio.init(); const i = stages.findIndex(s => s.id === el.dataset.sound); audio.play(i, stages[i].id); } };
$('#bulk-upload').onclick = $('#add-images').onclick = () => $('#bulk-input').click();
async function applyImage(stage) {
  stage.image = stage.imageMode === 'original' ? stage.logoImage : stage.circleImage;
  const img = new Image(); img.src = stage.image; await img.decode(); images.set(stage.id, img);
}
async function setImage(stage, file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file such as PNG, JPG, or WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('That image is too large. Choose an image under 20 MB.');
  const url = URL.createObjectURL(file);
  try { Object.assign(stage, await prepareImage(url)); stage.imageMode = stage.imageMode || 'circle'; stage.imageName = file.name; await applyImage(stage); }
  finally { URL.revokeObjectURL(url); }
}
function renderImageOptions() {
  const s = stages.find(s => s.id === selected), hasImage = Boolean(s.image);
  $('#image-options').innerHTML = `<div class="image-options"><div class="image-mode-preview">${thumbnail(s)}<span>${escape(s.name)}</span></div><button class="button full subtle" data-upload-selected>${icon('image')} ${hasImage ? 'Replace selected image' : 'Upload selected image'}</button><div class="image-mode-buttons" role="group" aria-label="Image shape"><button data-image-mode="circle" aria-pressed="${s.imageMode !== 'original'}" ${!hasImage ? 'disabled' : ''}>${icon('circle')} Change to circle</button><button data-image-mode="original" aria-pressed="${s.imageMode === 'original'}" ${!hasImage ? 'disabled' : ''}>${icon('scan')} Keep same</button></div><p>${s.imageMode === 'original' ? 'No circle. Plain backgrounds are removed automatically; complex backgrounds may remain.' : 'Center-crops the image to fill the circle immediately.'}</p></div>`;
}
$('#image-options').onclick = async event => {
  const s = stages.find(s => s.id === selected);
  if (event.target.closest('[data-upload-selected]')) { $('#image-input').dataset.target = selected; $('#image-input').click(); return; }
  const mode = event.target.closest('[data-image-mode]'); if (!mode || !s.image || recording) return;
  try { s.imageMode = mode.dataset.imageMode; await applyImage(s); renderStages(); persist(); }
  catch { toast('This image could not be processed. Try uploading it again.'); }
};
$('#image-input').onchange = async event => { const file = event.target.files[0]; if (!file) return; try { await setImage(stages.find(s => s.id === event.target.dataset.target), file); renderStages(); persist(); toast('Image added to your sequence.'); } catch (e) { toast(e.message || 'This image could not be opened. Try PNG or JPG.'); } event.target.value = ''; };
$('#bulk-input').onchange = async event => { const files = [...event.target.files]; try { for (let i = 0; i < Math.min(files.length, 8); i++) await setImage(stages[i], files[i]); toast(files.length > 8 ? 'The first eight images were added.' : `${files.length} image${files.length === 1 ? '' : 's'} added in file order.`); } catch (e) { toast(e.message); } renderStages(); persist(); event.target.value = ''; };
$('#shared-upload').onclick = () => $('#shared-input').click();
async function uploadSound(file, target) {
  if (file.size > 30 * 1024 * 1024) throw new Error('Choose an audio file smaller than 30 MB.');
  const buffer = await audio.decode(file); if (!buffer.duration) throw new Error('This audio file is empty.');
  if (target) { const s = stages.find(s => s.id === target); s.sound = file; s.soundName = file.name; audio.overrides.set(target, buffer); }
  else { sharedFile = file; audio.shared = buffer; updateShared(); }
  renderStages(); persist(); toast(target ? `Audio assigned to ${stages.find(s => s.id === target).name}.` : 'Shared sound is ready.');
}
for (const input of ['shared-input', 'custom-input']) $(`#${input}`).onchange = async event => { const file = event.target.files[0]; if (!file) return; try { await uploadSound(file, input === 'custom-input' ? event.target.dataset.target : null); } catch (e) { toast(e.message?.includes('30 MB') ? e.message : 'This audio could not be opened. Try a different MP3 or WAV file.'); } event.target.value = ''; };
$('#clear-shared').onclick = () => { sharedFile = null; audio.shared = null; updateShared(); persist(); };
$('#audition').onclick = async () => { await audio.init(); cancelAudition(); stages.forEach((s, i) => previewTimers.push(setTimeout(() => audio.play(i, s.id), i * 600))); };
$('#volume').oninput = event => { audio.volume = Number(event.target.value) / 100; audio.updateVolume(); $('#volume-value').textContent = `${event.target.value}%`; persist(); };
$('#mute').onclick = () => { audio.muted = !audio.muted; audio.updateVolume(); $('#mute').innerHTML = icon(audio.muted ? 'volume-x' : 'volume-2'); $('#mute').setAttribute('aria-label', audio.muted ? 'Unmute audio' : 'Mute audio'); refreshIcons(); };
$('#play').onclick = async () => { try { await audio.init(); if (running) cancelAudition(); if (sim.complete && sim.elapsed >= 62) restart(); setRunning(!running); } catch { toast('Audio is unavailable in this browser. Try Chrome or Edge.'); } };
$('#reset').onclick = () => { restart(); setRunning(running); };
$('#help').onclick = () => $('#help-dialog').showModal();
$('#close-help').onclick = $('#got-it').onclick = () => $('#help-dialog').close();
$('#duration').onchange = event => { recordDuration = Number(event.target.value); $('#export-note').textContent = recordDuration === 60 ? '60s run + 2s finale · sound included' : recordDuration < 60 ? 'Partial run · final form arrives at 60s' : 'Final form at 60s · sound included'; };
function lockEditor(lock) { for (const el of document.querySelectorAll('.sequence-panel button, .selected-panel input, .selected-panel button, .sound-panel button, .image-mode-buttons button, #duration, #reset, #play')) el.disabled = lock; }
function formatTime(t) { return `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`; }
function stopRecording() { if (recorder?.state === 'recording') recorder.stop(); }
$('#record').onclick = async () => {
  if (recording) { stopRecording(); return; }
  if (!window.MediaRecorder || !$('#canvas').captureStream) { toast('Video recording requires a recent Chrome or Edge browser.'); return; }
  let stream;
  try {
    await audio.init(); restart();
    if (audio.muted) { audio.muted = false; audio.updateVolume(); $('#mute').innerHTML = icon('volume-2'); $('#mute').setAttribute('aria-label', 'Mute audio'); }
    stream = $('#canvas').captureStream(30); stream.addTrack(audio.destination.stream.getAudioTracks()[0].clone());
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t));
    if (!mimeType) throw new Error('No supported recording format');
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 }); chunks = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      recording = false; lockEditor(false); renderStages(); $('#record-badge').hidden = true; setRunning(false); cancelAudition(); stream.getTracks().forEach(t => t.stop());
      $('#record').innerHTML = `${icon('circle')} Record video`; $('#record').classList.remove('is-recording');
      if (chunks.length) { if (downloadUrl) URL.revokeObjectURL(downloadUrl); const blob = new Blob(chunks, { type: mimeType }); downloadUrl = URL.createObjectURL(blob); $('#download').href = downloadUrl; $('#download').download = `bond-studio-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`; $('#download').hidden = false; $('#export-note').textContent = `${formatTime(sim.elapsed)} · ${(blob.size / 1024 / 1024).toFixed(1)} MB · Sound included`; toast('Your video is ready to download.'); }
      refreshIcons();
    };
    recorder.onerror = () => { toast('Recording failed. Try a shorter video in Chrome or Edge.'); if (recorder.state !== 'inactive') recorder.stop(); };
    recording = true; recordStart = sim.elapsed; $('#download').hidden = true; lockEditor(true); $('#record-badge').hidden = false;
    $('#record').innerHTML = `${icon('square')} Stop recording`; $('#record').classList.add('is-recording'); $('#export-note').textContent = recordDuration === 60 ? 'Final form at 60s · 2s finale hold' : 'Recording live · final form at 60s';
    recorder.start(1000); setRunning(true);
  } catch (e) { stream?.getTracks().forEach(t => t.stop()); recording = false; lockEditor(false); toast('Recording could not start. Try a recent Chrome or Edge browser.'); }
};
document.addEventListener('visibilitychange', () => { if (document.hidden && recording) { stopRecording(); toast('Recording stopped because the tab was hidden. Your captured video is ready.'); } else if (document.hidden && running) { setRunning(false); cancelAudition(); } });

const canvas = $('#canvas'), ctx = canvas.getContext('2d');
function draw() { drawSimulation(ctx, sim, stages, images); }
let previous = 0, accumulator = 0, lastStats = 0;
function frame(now) {
  const dt = previous ? Math.max(0, (now - previous) / 1000) : 0; previous = now;
  if (running) { accumulator += dt; while (accumulator >= 1 / 120) { sim.step(1 / 120); accumulator -= 1 / 120; if (recording && sim.elapsed - recordStart >= recordDuration + (recordDuration === 60 ? 2 : 0)) { stopRecording(); break; } } } else accumulator = 0;
  if (running && !recording && sim.elapsed >= 62) setRunning(false);
  draw();
  if (now - lastStats > 150) { $('#merge-count').textContent = sim.merges; $('#elapsed').textContent = formatTime(sim.elapsed); if (recording) $('#record-badge b').textContent = formatTime(sim.elapsed - recordStart); lastStats = now; }
  requestAnimationFrame(frame);
}
renderStages(); refreshIcons(); requestAnimationFrame(frame);
async function restore() {
  try {
    const project = await loadProject(); if (!project?.stages || project.stages.length !== 8) return;
    stages = project.stages; sharedFile = project.sharedFile; selected = stages[0].id;
    if (typeof project.volume === 'number') audio.volume = project.volume;
    $('#volume').value = audio.volume * 100; $('#volume-value').textContent = `${Math.round(audio.volume * 100)}%`;
    await Promise.all(stages.filter(s => s.image).map(async s => { if (!s.circleImage || !s.logoImage) Object.assign(s, await prepareImage(s.originalImage || s.image)); s.imageMode = s.imageMode || 'circle'; await applyImage(s); }));
    // Decode persisted clips without resuming playback before a user gesture.
    const decodeContext = new OfflineAudioContext(1, 1, 44100);
    if (sharedFile) audio.shared = await decodeContext.decodeAudioData(await sharedFile.arrayBuffer());
    for (const s of stages) if (s.sound) audio.overrides.set(s.id, await decodeContext.decodeAudioData(await s.sound.arrayBuffer()));
    updateShared(); renderStages();
  } catch { toast('Some saved files could not be restored. You can upload them again.'); }
}
restore();
