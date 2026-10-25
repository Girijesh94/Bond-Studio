import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMidi,exportMidi} from './midi.js';

test('MIDI export has a valid header, tempo, instrument, and ordered notes',()=>{
  const result=parseMidi(exportMidi([60,64,null,67,72],{tempo:90,instrument:10}));
  assert.deepEqual(result.notes,[60,64,67,72]);
  assert.equal(result.tempo,90); assert.equal(result.ticksPerBeat,480);
  assert.equal(result.events[2].tick,360);
});
const file=(track)=>new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,0,0,0,track.length,...track]);
test('MIDI reader handles running status and skips velocity-zero note-ons',()=>{
  const result=parseMidi(file([0,0x90,60,100,120,64,80,120,67,0,0,0xff,0x2f,0]));
  assert.deepEqual(result.notes,[60,64]);
});
test('MIDI reader validates bounded tracks, running status, and data bytes',()=>{
  assert.throws(()=>parseMidi(new Uint8Array([1,2,3])),/truncated/);
  assert.throws(()=>parseMidi(file([0,60,100])),/running status/);
  assert.throws(()=>parseMidi(file([0,0x90,60,0xff])),/note data/);
  assert.throws(()=>parseMidi(file([0,0xff,1,100,1,2])),/truncated/);
  assert.throws(()=>parseMidi(file([0x80,0x80,0x80,0x80,0])),/variable-length/);
});
test('MIDI reader handles sysex and meta events and reports an explicit import limit',()=>{
  const result=parseMidi(file([0,0xf0,2,1,0xf7,0,0xff,1,2,65,66,0,0x90,60,100,0,64,100,0,0xff,0x2f,0]),{maxNotes:1});
  assert.deepEqual(result.notes,[60]);assert.equal(result.totalNotes,2);assert.equal(result.truncated,true);
});
test('MIDI writer rejects malformed notes and settings',()=>{
  for(const notes of [[],[128],[-1],[60.1],['60'],Array(257).fill(60)]) assert.throws(()=>exportMidi(notes));
  assert.throws(()=>exportMidi([60],{tempo:0}));
  assert.throws(()=>exportMidi([60],{instrument:128}));
});
test('MIDI format 1 merges tracks by absolute tick',()=>{
  const a=[0,0x90,72,100,120,0x90,74,90,0,0xff,0x2f,0];
  const b=[60,0x90,60,100,0,0xff,0x2f,0];
  const chunk=track=>[77,84,114,107,0,0,0,track.length,...track];
  const result=parseMidi(new Uint8Array([77,84,104,100,0,0,0,6,0,1,0,2,1,224,...chunk(a),...chunk(b)]));
  assert.deepEqual(result.notes,[72,60,74]);
});
