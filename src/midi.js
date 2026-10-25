// Small, dependency-free Standard MIDI File reader/writer. Imported chords are
// flattened in tick order because the bonding player advances one note per hit.
export function parseMidi(input, { maxNotes = 256 } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 0;
  const need = n => { if (p + n > bytes.length) throw new Error('The MIDI file is truncated.'); };
  const u8 = () => { need(1); return bytes[p++]; };
  const u16 = () => { need(2); const n = view.getUint16(p); p += 2; return n; };
  const u32 = () => { need(4); const n = view.getUint32(p); p += 4; return n; };
  const tag = () => String.fromCharCode(u8(), u8(), u8(), u8());
  if (tag() !== 'MThd') throw new Error('Choose a Standard MIDI file (.mid or .midi).');
  const headerLength = u32();
  if (headerLength < 6) throw new Error('Invalid MIDI header.');
  need(headerLength);
  const format = u16(), tracks = u16(), division = u16();
  if (format > 1 || !tracks || (format === 0 && tracks !== 1)) throw new Error('Only MIDI format 0 and 1 are supported.');
  if (!division || division & 0x8000) throw new Error('This MIDI timing format is not supported.');
  p += headerLength - 6;
  const events = [], tempos = [];
  for (let track = 0; track < tracks; track++) {
    if (tag() !== 'MTrk') throw new Error('Missing MIDI track.');
    const length = u32(); need(length); const end = p + length;
    let tick = 0, running = 0;
    const byte = () => { if (p >= end) throw new Error('The MIDI track is truncated.'); return u8(); };
    const variable = () => { let value = 0; for (let i = 0; i < 4; i++) { const b = byte(); value = value * 128 + (b & 127); if (!(b & 128)) return value; } throw new Error('Invalid MIDI variable-length number.'); };
    const skip = n => { if (p + n > end) throw new Error('The MIDI event is truncated.'); p += n; };
    while (p < end) {
      tick += variable();
      let status = byte();
      if (status < 128) { if (!running) throw new Error('Invalid MIDI running status.'); p--; status = running; }
      if (status === 0xff) {
        running = 0; const type = byte(), size = variable();
        if (type === 0x51 && size === 3) { if (p + 3 > end) throw new Error('Truncated MIDI tempo.'); const micros = byte() * 65536 + byte() * 256 + byte(); if (!micros) throw new Error('Invalid MIDI tempo.'); tempos.push({tick, microsecondsPerBeat: micros}); }
        else skip(size);
        if (type === 0x2f) { p = end; break; }
      } else if (status === 0xf0 || status === 0xf7) { running = 0; skip(variable()); }
      else if (status >= 0x80 && status <= 0xef) {
        running = status; const a = byte(), b = (status & 0xe0) === 0xc0 ? 0 : byte();
        if (a > 127 || b > 127) throw new Error('Invalid MIDI note data.');
        if ((status & 0xf0) === 0x90 && b) {
          if (events.length >= 100000) throw new Error('This MIDI file is too complex. Choose a shorter melody.');
          events.push({tick, note:a, velocity:b, track, channel:status & 15, order:events.length});
        }
      } else throw new Error('Unsupported MIDI system event.');
    }
  }
  events.sort((a,b) => a.tick - b.tick || a.track - b.track || a.order - b.order);
  tempos.sort((a,b) => a.tick - b.tick);
  if (!events.length) throw new Error('This MIDI file contains no playable notes.');
  return { notes:events.slice(0,maxNotes).map(e => e.note), events:events.slice(0,maxNotes), totalNotes:events.length, truncated:events.length > maxNotes, ticksPerBeat:division, tempos, tempo:Math.round(60000000 / (tempos[0]?.microsecondsPerBeat || 500000)) };
}

export function exportMidi(notes, { tempo = 120, instrument = 0 } = {}) {
  if (!Array.isArray(notes) || !notes.length || notes.length > 256 || notes.some(n => n !== null && (!Number.isInteger(n) || n < 0 || n > 127))) throw new Error('Melody must contain 1–256 MIDI notes or rests.');
  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 300) throw new Error('Tempo must be between 20 and 300 BPM.');
  if (!Number.isInteger(instrument) || instrument < 0 || instrument > 127) throw new Error('Invalid MIDI instrument.');
  const vlq = n => { const a = [n & 127]; while ((n = Math.floor(n / 128))) a.unshift((n & 127) | 128); return a; };
  const micros = Math.round(60000000 / tempo);
  const data = [0,0xff,0x51,3,(micros >> 16) & 255,(micros >> 8) & 255,micros & 255,0,0xc0,instrument];
  let rest = 0;
  for (const note of notes) { if (note === null) rest += 120; else { data.push(...vlq(rest),0x90,note,90,...vlq(120),0x80,note,0); rest = 0; } }
  data.push(...vlq(rest),0xff,0x2f,0);
  const size = data.length;
  return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(size >>> 24) & 255,(size >>> 16) & 255,(size >>> 8) & 255,size & 255,...data]);
}
