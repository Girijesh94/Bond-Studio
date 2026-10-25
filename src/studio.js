import { MODES, ModeSimulation } from './modes.js';
import './studio.css';

export const STUDIO_DEFAULTS = { mode: 'classic', seed: 8271, options: { gravity: 400, speed: 1, count: 4, rings: 6, gap: .65, rotation: .4, trail: 150, bounce: 1 }, watermark: '', showTimer: true };
const $ = s => document.querySelector(s);
const numeric = (v, fallback, lo, hi) => Number.isFinite(Number(v)) ? Math.max(lo, Math.min(hi, Number(v))) : fallback;
export function normalizeStudio(value = {}) {
  const o = value.options || {}, d = STUDIO_DEFAULTS.options;
  return { mode: MODES.some(m => m.id === value.mode) ? value.mode : 'classic', seed: numeric(value.seed, 8271, 0, 4294967295) >>> 0,
    options: { gravity: numeric(o.gravity,d.gravity,0,1000), speed:numeric(o.speed,d.speed,.25,2), count:Math.round(numeric(o.count,d.count,2,8)), rings:Math.round(numeric(o.rings,d.rings,2,10)), gap:numeric(o.gap,d.gap,.25,1.6), rotation:numeric(o.rotation,d.rotation,-2,2), trail:Math.round(numeric(o.trail,d.trail,20,350)), bounce:numeric(o.bounce,d.bounce,.7,1.2) },
    watermark: typeof value.watermark === 'string' ? value.watermark.slice(0,48) : '', showTimer:value.showTimer !== false };
}
const definitions = [
  ['gravity','Gravity',0,1000,25,'px/s²'], ['speed','Launch speed',.25,2,.05,'×'], ['bounce','Bounce',.7,1.2,.05,'×'],
  ['rings','Ring count',2,10,1,''], ['gap','Ring opening',.25,1.6,.05,'rad'], ['rotation','Rotation',-2,2,.05,'rad/s'],
  ['count','Contestants',2,8,1,''], ['trail','Trail length',20,350,10,'points']
];
const fieldModes = { gravity:['classic','infinite','destruction','accumulation','collision','web','trail','fragment','battle','hill','symmetric'],speed:['classic','infinite','destruction','accumulation','collision','web','trail','fragment','battle','hill','symmetric'],bounce:['classic','infinite','destruction','accumulation','collision','web','trail','fragment','battle','hill','symmetric'],rings:['classic'],gap:['classic','infinite'],rotation:['classic','infinite','destruction','spiral'],count:['battle','hill'],trail:['trail','spiral'] };

export function mountStudio({onChange, onExportProject, onImportProject, onSnapshot}) {
  let state = normalizeStudio(), locked = false, searching = false, searchTicket = 0; const disabledBeforeRecord = new Map();
  $('.page-heading h1').textContent = 'A little physics. Endless possibilities.';
  $('.page-heading p').textContent = 'Thirteen simulations. Your images, your notes, your next video.';
  $('.header-middle').textContent = 'A physics & sound studio';
  $('.page-heading').insertAdjacentHTML('afterend', `<section class="mode-workspace" aria-labelledby="mode-heading"><div class="mode-heading"><h2 id="mode-heading">Choose your simulation</h2><label class="mobile-mode-label">Simulation<select id="mode-select">${MODES.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}</select></label><div class="project-actions"><button id="project-save" class="button subtle">Save project</button><button id="project-open-button" class="button subtle" type="button">Open project</button><input id="project-open" type="file" accept="application/json,.json" hidden></div></div><div class="mode-strip" role="group" aria-label="Simulation modes">${MODES.map(m=>`<button data-mode="${m.id}" aria-pressed="false">${m.name}</button>`).join('')}</div><div class="current-mode"><strong id="current-mode-name"></strong><span id="mode-description"></span></div></section>`);
  const sequence = $('.sequence-panel'), column=document.createElement('div'); column.className='assets-column'; sequence.before(column); column.append(sequence);
  const controls=document.createElement('section'); controls.className='panel scene-panel'; controls.innerHTML=`<div class="panel-title"><h2>Scene settings</h2><button id="reset-settings" class="text-button">Reset</button></div><p id="fixed-merge-note" class="panel-intro" hidden>Bond keeps its fixed 60-second sequence and eight increasing sizes.</p><div id="scene-fields">${definitions.map(([key,label,min,max,step,unit])=>`<label class="scene-control" data-control="${key}"><span>${label}<output id="value-${key}"></output></span><input id="scene-${key}" type="range" min="${min}" max="${max}" step="${step}" data-option="${key}" aria-label="${label}"><small>${unit}</small></label>`).join('')}</div><div class="seed-controls"><label for="scene-seed">Seed</label><input id="scene-seed" type="number" min="0" max="4294967295" aria-label="Simulation seed"><button id="new-seed" class="icon-button" aria-label="Randomize seed"><i data-lucide="shuffle" aria-hidden="true"></i></button></div><button id="search-seed" class="button full subtle">Find an active seed</button><p id="seed-result" class="small-note" aria-live="polite">The same seed and settings replay the same motion.</p></section>`;
  column.prepend(controls);
  $('.sequence-panel .panel-title h2').innerHTML='Your cast <span>8 images</span>';
  $('.sequence-panel .panel-intro').innerHTML='Choose the images and colors in your simulation.<br>In Bond, this is the merge order.';
  $('.sequence-note').innerHTML='Images and their sounds stay together when reordered.';
  $('.export-panel').insertAdjacentHTML('afterbegin', `<div class="export-options"><label class="watermark-label" for="watermark">Custom watermark<input id="watermark" maxlength="48" placeholder="Your name or @handle"></label><label class="timer-control"><span>Show timer</span><input id="show-timer" type="checkbox" checked></label></div>`);
  $('.transport').insertAdjacentHTML('beforeend','<button id="snapshot" class="icon-button" aria-label="Download a PNG snapshot" title="Download snapshot"><i data-lucide="camera" aria-hidden="true"></i></button>');
  $('.settings').insertAdjacentHTML('afterbegin','<section id="music-editor" class="panel melody-panel" aria-label="Melody editor"></section>');
  $('.settings').insertAdjacentHTML('afterbegin','<div class="settings-tabs" role="tablist" aria-label="Sound design"><button id="sound-tab" role="tab" aria-selected="true" aria-controls="collision-sounds">Sound & images</button><button id="melody-tab" role="tab" aria-selected="false" aria-controls="music-editor" tabindex="-1">Melody & MIDI</button></div>');
  $('#music-editor').hidden=true;$('#music-editor').setAttribute('role','tabpanel');$('#music-editor').setAttribute('aria-labelledby','melody-tab');$('.sound-panel').id='collision-sounds';$('.sound-panel').setAttribute('role','tabpanel');$('.sound-panel').setAttribute('aria-labelledby','sound-tab');
  function soundTab(music) { $('#music-editor').hidden=!music;$('.sound-panel').hidden=music;$('.selected-panel').hidden=music;$('#sound-tab').setAttribute('aria-selected',String(!music));$('#melody-tab').setAttribute('aria-selected',String(music));$('#sound-tab').tabIndex=music?-1:0;$('#melody-tab').tabIndex=music?0:-1; }
  $('#sound-tab').onclick=()=>soundTab(false);$('#melody-tab').onclick=()=>soundTab(true);
  $('.settings-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||locked)return;e.preventDefault();const music=e.key==='End'?true:e.key==='Home'?false:e.target.id==='sound-tab';soundTab(music);$(music?'#melody-tab':'#sound-tab').focus();};
  $('.export-panel h2').textContent='Export your creation'; $('.export-panel p').textContent='Portrait MP4 with your complete soundtrack.';
  $('.sound-panel h2').textContent='Collision sound'; $('.sound-panel .panel-intro').textContent='One sound, played by the physics.';
  $('#help-dialog .dialog-top h2').textContent='Your physics studio';
  $('#help-dialog ol').insertAdjacentHTML('afterbegin','<li><strong>Pick a simulation.</strong> Explore thirteen modes. Adjust its scene settings, choose a repeatable seed, or search for more active motion.</li><li><strong>Compose the collisions.</strong> Turn on Melody to make impacts play your notes. Draw a melody, import MIDI, and choose one of nine instruments. Uploaded audio is used when Melody is off.</li>');
  const helpNote=$('#help-dialog p'); helpNote.textContent='All images, audio, MIDI, and settings are stored on this device. Bond reaches its final image during the 60th second. Other modes run for 60 seconds. MP4 conversion uses the local server. MIDI note order is preserved; impacts determine playback rhythm. Keep the tab visible while recording.';
  function emit(reset=true) { onChange?.(getState(),reset); }
  function getState(){return structuredClone(state);}
  function render(){
    const mode=MODES.find(m=>m.id===state.mode);$('#mode-select').value=state.mode;
    $('#current-mode-name').textContent=mode.name;$('#mode-description').textContent=mode.description;
    document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===state.mode)));
    for(const [key] of definitions){$(`#scene-${key}`).value=state.options[key];$(`#value-${key}`).value=Number(state.options[key].toFixed(2));$(`[data-control="${key}"]`).hidden=!fieldModes[key].includes(state.mode);}
    $('#fixed-merge-note').hidden=state.mode!=='merge';$('#scene-seed').value=state.seed;$('#watermark').value=state.watermark;$('#show-timer').checked=state.showTimer;
    $('#search-seed').disabled=locked||state.mode==='merge';$('#new-seed').disabled=locked;
    $('.sequence-note').textContent=state.mode==='merge'?'Two matching images become the next in line. The last image is the final form.':'Uploaded images replace ball colors. Each image can have its own collision sound.';
    document.body.dataset.mode=state.mode;
  }
  function changeMode(mode){if(locked||!MODES.some(m=>m.id===mode))return;searchTicket++;state.mode=mode;render();emit();}
  $('.mode-strip').onclick=e=>{const b=e.target.closest('[data-mode]');if(b)changeMode(b.dataset.mode);};$('#mode-select').onchange=e=>changeMode(e.target.value);
  $('#scene-fields').onchange=e=>{if(locked||!e.target.dataset.option)return;state.options[e.target.dataset.option]=Number(e.target.value);state=normalizeStudio(state);render();emit();};
  $('#scene-fields').oninput=e=>{if(e.target.dataset.option)$(`#value-${e.target.dataset.option}`).value=Number(Number(e.target.value).toFixed(2));};
  $('#scene-seed').onchange=e=>{if(locked)return;state.seed=numeric(e.target.value,8271,0,4294967295)>>>0;render();emit();};
  $('#new-seed').onclick=()=>{state.seed=crypto.getRandomValues(new Uint32Array(1))[0];render();emit();};
  $('#reset-settings').onclick=()=>{if(locked)return;state.options={...STUDIO_DEFAULTS.options};render();emit();};
  $('#watermark').oninput=e=>{state.watermark=e.target.value;emit(false);};$('#show-timer').onchange=e=>{state.showTimer=e.target.checked;emit(false);};
  $('#project-open-button').onclick=()=>$('#project-open').click();
  $('#snapshot').onclick=()=>onSnapshot?.();$('#project-save').onclick=()=>onExportProject?.();$('#project-open').onchange=async e=>{if(e.target.files[0])await onImportProject?.(e.target.files[0]);e.target.value='';};
  $('#search-seed').onclick=async()=>{
    if(searching){searchTicket++;return;}if(locked||state.mode==='merge')return;
    searching=true;const ticket=++searchTicket,mode=state.mode;let best=null;
    $('#search-seed').textContent='Cancel search';
    for(let i=0;i<16&&ticket===searchTicket;i++){
      const seed=crypto.getRandomValues(new Uint32Array(1))[0], trial=new ModeSimulation(mode,state.options);trial.reset(seed);
      for(let frame=0;frame<600;frame++)trial.step(1/30);
      const score=trial.hits+trial.stats.escapes*8+trial.stats.splits*3+trial.stats.cuts*5+trial.stats.broken*2;
      if(!best||score>best.score)best={seed,score};
      $('#seed-result').textContent=`Comparing motion… ${i+1} / 16 seeds`;await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(ticket===searchTicket&&best){state.seed=best.seed;render();emit();$('#seed-result').textContent=`16 seeds compared over 20 seconds each. Best activity score: ${best.score}.`;}
    else $('#seed-result').textContent='Search cancelled. Your current seed is unchanged.';
    searching=false;$('#search-seed').textContent='Find an active seed';
  };
  render();
  return {getState,restore(value){searchTicket++;state=normalizeStudio(value);render();},lock(value){if(value===locked)return;locked=value;searchTicket++;if(value){for(const el of document.querySelectorAll('.scene-panel input,.scene-panel button,.mode-workspace button,.mode-workspace select,.settings-tabs button,#watermark,#show-timer,#project-open,#snapshot,.melody-panel button,.melody-panel input,.melody-panel select')){disabledBeforeRecord.set(el,el.disabled);el.disabled=true;}}else{disabledBeforeRecord.forEach((disabled,el)=>{if(el.isConnected)el.disabled=disabled;});disabledBeforeRecord.clear();}render();},get searching(){return searching;}};
}
