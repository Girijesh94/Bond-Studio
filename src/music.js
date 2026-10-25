import { parseMidi, exportMidi } from './midi.js';
import './music.css';

export const INSTRUMENTS = ['piano','musicbox','bell','marimba','guitar','strings','flute','8bit','ambient'];
export const DEFAULT_MELODY = [60,64,67,72,67,64,62,65,69,72,69,65,64,67,71,72];
const names = { piano:'Piano', musicbox:'Music box', bell:'Bell', marimba:'Marimba', guitar:'Guitar', strings:'Strings', flute:'Flute', '8bit':'8-bit', ambient:'Ambient' };
export const noteName = n => `${['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][n % 12]}${Math.floor(n / 12)-1}`;
export function normalizeMelody(state = {}) {
  return { enabled: state.enabled === true, instrument:INSTRUMENTS.includes(state.instrument) ? state.instrument : 'piano', notes:Array.isArray(state.notes) && state.notes.length && state.notes.length <= 256 ? state.notes.map(n => Number.isInteger(n) && n >= 0 && n <= 127 ? n : null) : [...DEFAULT_MELODY] };
}

// All voices feed the existing master gain, compressor, and recording stream.
export class MelodyAudio {
  constructor(bondAudio) { this.audio = bondAudio; this.state = normalizeMelody(); this.cursor = 0; this.voices = new Set(); }
  getState() { return { ...this.state, notes:[...this.state.notes] }; }
  restore(state) { this.state = normalizeMelody(state); this.cursor = 0; }
  resetCursor() { this.cursor = 0; }
  playNext(level = 0) { const note = this.state.notes[this.cursor++ % this.state.notes.length]; if (note !== null) this.playNote(note, this.state.instrument, level); }
  stopAll() { for (const voice of this.voices) voice.stop(); this.voices.clear(); }
  playNote(note, instrument = this.state.instrument, level = 0) {
    const ctx = this.audio.context;
    if (!ctx || ctx.state !== 'running' || !this.audio.master || !Number.isInteger(note) || note < 0 || note > 127) return;
    while (this.voices.size >= 12) this.voices.values().next().value.stop();
    const presets = {
      piano:{type:'triangle',partials:[[1,1],[2,.25],[3,.1]],attack:.005,decay:.85},
      musicbox:{type:'sine',partials:[[1,1],[2,.5],[3,.3],[6,.12]],attack:.003,decay:1.2},
      bell:{type:'sine',partials:[[1,1],[2.76,.45],[5.4,.18]],attack:.003,decay:1.5},
      marimba:{type:'sine',partials:[[1,1],[4,.24],[10,.08]],attack:.003,decay:.4},
      guitar:{type:'triangle',partials:[[1,1],[2,.35],[3,.22],[4,.12]],attack:.004,decay:.65},
      strings:{type:'sawtooth',partials:[[.997,.5],[1.003,.5]],attack:.13,decay:1.1,filter:2200},
      flute:{type:'sine',partials:[[1,1],[2,.15],[3,.035]],attack:.06,decay:.65},
      '8bit':{type:'square',partials:[[1,1]],attack:.001,decay:.23,filter:6000},
      ambient:{type:'sine',partials:[[.996,.55],[1.004,.55],[2,.15]],attack:.2,decay:1.8}
    };
    const preset = presets[instrument] || presets.piano;
    const t = ctx.currentTime, duration = preset.attack + preset.decay, gain = ctx.createGain();
    // Higher bond stages gradually lower the melody, including the final note.
    const frequency = 440 * 2 ** ((note - 69 - Math.min(7,Math.max(0,level)) * 2) / 12);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = preset.filter || 14000;
    filter.connect(gain); gain.connect(this.audio.master);
    gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(.19,t + preset.attack); gain.gain.exponentialRampToValueAtTime(.0001,t + duration);
    const sources = preset.partials.map(([multiple,amount]) => {
      const osc = ctx.createOscillator(), partial = ctx.createGain(); osc.type = preset.type; osc.frequency.value = Math.min(20000,frequency * multiple); partial.gain.value = amount;
      osc.connect(partial); partial.connect(filter); return {osc,partial};
    });
    let ended = 0, cleaned = false;
    const voice = { stop:() => { if (cleaned) return; for (const {osc} of sources) { try { osc.stop(); } catch {} } cleanup(); } };
    const cleanup = () => { if (cleaned) return; cleaned = true; this.voices.delete(voice); for (const {osc,partial} of sources) { osc.disconnect(); partial.disconnect(); } filter.disconnect(); gain.disconnect(); };
    this.voices.add(voice);
    for (const {osc} of sources) { osc.onended = () => { if (++ended === sources.length) cleanup(); }; osc.start(t); osc.stop(t + duration + .02); }
  }
}

export function mountMusicEditor(container, { onChange = () => {}, onPreview = () => {} } = {}) {
  let state = normalizeMelody(), page = 0;
  container.classList.add('music-editor');
  container.innerHTML = `<div class="music-heading"><h3>Melody editor</h3><label class="music-switch"><input type="checkbox" data-music="enabled"> Use melody</label></div><p class="music-help">Each impact plays the next note. The melody repeats.</p><div class="music-tools"><label>Instrument<select data-music="instrument">${INSTRUMENTS.map(id => `<option value="${id}">${names[id]}</option>`).join('')}</select></label><label>Steps<select data-music="length"><option>16</option><option>32</option><option>64</option></select></label><button type="button" class="button subtle" data-music="audition">Hear sound</button></div><div class="music-roll-scroll"><div class="music-roll" role="group" aria-label="Melody piano roll"></div></div><div class="music-pages"><button type="button" class="button subtle" data-music="previous" aria-label="Previous 16 steps"><i data-lucide="chevron-left" aria-hidden="true"></i></button><span data-music="page"></span><button type="button" class="button subtle" data-music="next" aria-label="Next 16 steps"><i data-lucide="chevron-right" aria-hidden="true"></i></button></div><div class="music-actions"><button type="button" class="button subtle" data-music="preset">Preset</button><button type="button" class="button subtle" data-music="clear">Clear</button><button type="button" class="button subtle" data-music="import">Import MIDI</button><button type="button" class="button subtle" data-music="export">Export MIDI</button><input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" data-music="file" hidden></div><p class="music-status" role="status" aria-live="polite"></p>`;
  const $ = key => container.querySelector(`[data-music="${key}"]`), roll = container.querySelector('.music-roll'), status = container.querySelector('.music-status');
  const snapshot = () => ({...state, notes:[...state.notes]});
  const changed = () => {
    const focused = roll.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
    const scroll = container.querySelector('.music-roll-scroll');
    const left = scroll.scrollLeft, top = scroll.scrollTop;
    onChange(snapshot()); render();
    if (focused) {
      [...roll.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === focused)?.focus({preventScroll:true});
      scroll.scrollLeft = left; scroll.scrollTop = top;
    }
  };
  const render = () => {
    $('enabled').checked = state.enabled; $('instrument').value = state.instrument;
    const lengthSelect = $('length');
    for (const option of [...lengthSelect.options]) if (![16,32,64].includes(Number(option.value))) option.remove();
    if (![16,32,64].includes(state.notes.length)) lengthSelect.add(new Option(String(state.notes.length),String(state.notes.length)));
    lengthSelect.value = String(state.notes.length);
    page = Math.min(page,Math.ceil(state.notes.length / 16)-1);
    const first = page * 16, count = Math.min(16,state.notes.length-first);
    const pitches = [...new Set([...Array.from({length:13},(_,i) => 60+i),...state.notes.filter(n => n !== null)])].sort((a,b) => b-a);
    roll.style.gridTemplateColumns = `32px repeat(${count},minmax(18px,1fr))`;
    roll.replaceChildren();
    const heading = document.createElement('span'); heading.className='music-key'; roll.append(heading);
    for (let i=0;i<count;i++) { const label=document.createElement('span'); label.className='music-step'; label.textContent=first+i+1; roll.append(label); }
    for (const pitch of pitches) {
      const key=document.createElement('span'); key.className='music-key'; key.textContent=noteName(pitch); roll.append(key);
      for (let i=0;i<count;i++) { const index=first+i, button=document.createElement('button'); button.type='button'; button.className=`music-note${[1,3,6,8,10].includes(pitch%12)?' accidental':''}`; button.setAttribute('aria-label',`Step ${index+1}, ${noteName(pitch)}`); button.setAttribute('aria-pressed',String(state.notes[index]===pitch)); button.onclick=()=>{state.notes[index]=state.notes[index]===pitch?null:pitch; if(state.notes[index]!==null) onPreview(pitch,state.instrument); changed();}; roll.append(button); }
    }
    $('page').textContent=`Steps ${first+1}–${first+count} of ${state.notes.length}`; $('previous').disabled=page===0; $('next').disabled=first+16>=state.notes.length;
  };
  $('enabled').onchange=()=>{state.enabled=$('enabled').checked; changed();};
  $('instrument').onchange=()=>{state.instrument=$('instrument').value; changed(); onPreview(60,state.instrument);};
  $('length').onchange=()=>{const n=Number($('length').value); state.notes=Array.from({length:n},(_,i)=>state.notes[i]??null); page=0; changed();};
  $('audition').onclick=()=>onPreview(60,state.instrument);
  $('previous').onclick=()=>{page--;render();}; $('next').onclick=()=>{page++;render();};
  $('preset').onclick=()=>{state.notes=[...DEFAULT_MELODY];page=0;status.textContent='Preset melody restored.';changed();};
  $('clear').onclick=()=>{state.notes.fill(null);status.textContent='Melody cleared. Select a cell to add a note.';changed();};
  $('import').onclick=()=>$('file').click();
  $('file').onchange=async()=>{const file=$('file').files[0]; if(!file)return; try {if(file.size>5*1024*1024)throw new Error('Choose a MIDI file smaller than 5 MB.'); const result=parseMidi(await file.arrayBuffer());state.notes=result.notes;page=0;status.textContent=`Imported ${result.notes.length} notes${result.truncated?` of ${result.totalNotes} (256-note limit)`:''}. Chords play one note at a time; impacts set the rhythm.`;changed();}catch(error){status.textContent=error.message;}finally{$('file').value='';}};
  $('export').onclick=()=>{const programs={piano:0,musicbox:10,bell:14,marimba:12,guitar:24,strings:48,flute:73,'8bit':80,ambient:89}; const blob=new Blob([exportMidi(state.notes,{instrument:programs[state.instrument]})],{type:'audio/midi'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bond-melody.mid';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='MIDI exported at 120 BPM.';};
  render();
  return {getState:snapshot,restore(value){state=normalizeMelody(value);page=0;render();},destroy(){container.replaceChildren();container.classList.remove('music-editor');}};
}
