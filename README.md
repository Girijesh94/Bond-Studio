# Bond Studio

A local physics and music studio with thirteen original simulation modes, custom images and sounds, a MIDI editor, and MP4 recording.

All included features are available without login, membership, subscription, payment, or an activation key. After dependencies are installed, the studio runs locally without an internet connection. MP4 export uses your local FFmpeg installation.

For step-by-step checks of every mode and control, see [the manual testing guide](MANUAL-TESTING.md).

## Run

Install Node.js and FFmpeg (with H.264/AAC support). Run `npm install`, then `npm run dev` in this folder and open the printed local address. Windows users can double-click `Start Bond Studio.cmd`. FFmpeg is used only for local MP4 preparation; files never leave your computer. Set the `FFMPEG_PATH` environment variable if FFmpeg is not on your PATH.

## Images and sound

Upload up to eight images at once or use each row's image button. Reorder rows with arrows or dragging. Two matching images merge into the next stage.

Below image upload, choose **Change to circle** for an immediate circular cover crop, or **Keep same** for an image-only logo without a circle. Plain edge-connected backgrounds and transparent padding are removed automatically in Keep same mode. Use transparent PNGs for complex backgrounds.

Each image row has its own Add audio / Replace audio button, filename, preview, and removal control. A shared MP3, WAV, M4A, or browser-supported audio file supplies the other stages. Both shared and assigned sounds deepen with each higher stage: 0, -3, -6, -9, -12, -15, -18, -24 semitones. The final form uses the deepest pitch. Pitch changes also change clip speed and duration; each event plays at most three seconds. The starter's assigned sound is available for preview; merges produce stages 2–8.

## Choose a simulation

Use the mode strip (or the Simulation menu on a phone): Bond, Ring escape, Infinite loop, Ring destruction, Spike garden, Collision burst, Web expansion, Rainbow trail, Spiral escape, Fragment burst, Web battle, King of the hill, and Mirror drop. These are original local implementations inspired by the public categories on BallSimulator.com; the member-only engine was not accessed. See [reference findings](REFERENCE.md).

Scene controls show only settings the current mode uses: gravity, launch speed, bounce, ring count/opening, rotation, contestants, and trail length. Each seed replays the same motion. **Find an active seed** compares sixteen seeds over twenty simulated seconds and selects the highest local activity score. Searches can be cancelled. Ball populations and retained effects are bounded for responsive rendering; multiplication modes cap at 96 balls.

Choose **Melody & MIDI** in Sound design to draw notes, import a standard format 0/1 MIDI file, or export the current sequence as MIDI. Nine procedural instruments are available: piano, music box, bell, marimba, guitar, strings, flute, 8-bit and ambient. Enable **Use melody** to make collisions play successive notes through the same volume, mute, limiter and recording stream. Turning it off restores uploaded collision sounds. MIDI preserves note order and flattens chords; impacts supply timing, so original MIDI rhythms and tempo changes are not reproduced. Up to 256 notes can be imported, with an explicit limit message and pagination.

**Save project** downloads a JSON file containing images, audio, colors, mode, seed, physics, watermark and melody. **Open project** validates and restores that file. The camera button downloads the current frame as PNG. Your custom watermark and optional timer are included in recordings and snapshots.

## Bond simulation and recording

The Bond cannon shoots all 128 starters at a regular cadence through 59.6 seconds. Matching pairs are guided together late in the run; the final bond occurs during the 60th second (59.8 seconds at the normal 120 Hz update). All modes stop at 60 seconds. Default recording ends at 60 seconds with no added finale hold. Shorter 15- or 30-second recordings capture partial runs.

Ball radii increase strictly through 24, 32, 41, 52, 65, 80, 97, and 116 pixels. Merges use a brief expanding outline and gentle pop. The arena has a softly glowing rotating rainbow border, with no outer progress arc or clock marks.

Record starts a fresh run. Keep the tab visible while recording; hiding it stops capture and preserves the captured portion. After capture, the local server prepares a real **MP4 with H.264 video and AAC audio**, at 540 × 960 and 30 fps. Click Download video when preparation finishes. Failed conversions retain the capture for Retry MP4 export. A static file host alone cannot provide this local conversion endpoint: use `npm run dev`, or `npm run build` followed by `npm run preview`.

Images, sound assignments, names, colors, volume, order, image modes, simulation settings, seed, watermark, and melody save locally in IndexedDB. Existing eight-image projects remain supported. Use the same browser and local address to recover them. Mute and volume affect the captured sound. The font is bundled locally.

## Checks

`npm test` checks all modes through complete runs, frame-rate independent seeded replay, differing seeds, individual mechanics, mirrored drops, bounded geometry, MIDI parsing and round trips, portable project files, equal-stage merges, circular wall collisions, starter conservation, final-bond timing, image cleanup, descending pitch, and actual H.264/AAC MP4 conversion. The MP4 integration check requires FFmpeg and ffprobe. `npm run build` creates the production browser bundle in `dist`.
