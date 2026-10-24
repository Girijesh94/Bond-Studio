# Bond Studio

A local ball-merging simulator with an original garden-inspired visual design.

## Run

Install Node.js, then run `npm install` and `npm run dev` in this folder. Open the local address printed by Vite. Double-click `Start Bond Studio.cmd` on Windows for the same workflow.

## Use

1. Upload up to eight images at once, or add each image using its row's plus button. Below image upload, choose Change to circle for an immediate circular crop that fills the ball, or Keep same for the image alone, without a circle. Keep same automatically removes edge-connected plain backgrounds and trims transparent padding. Use a transparent PNG for artwork with complex backgrounds.
2. Drag rows or use up/down arrows to set the merge order. Two identical stages create the next stage. The eighth stage is final.
3. Upload one MP3, WAV, M4A, or other browser-supported audio clip. It automatically deepens through 0, -2, -4, -5, -7, -9, -11, and -12 semitones. A built-in chime is available before uploading.
4. Select a stage to assign a separate sound. Assigned sounds also deepen by stage and stay with their image after reordering. Stage 1 is the starter, so its sound is only used in previews; merges create stages 2–8.
5. Press Play, or choose a length and press Record video. Recording starts a fresh run. Stop early if desired, then use Download video.

Video exports at 540 × 960 and 30 fps with audio, using WebM (preferred) or MP4 if the browser supports it. Chrome or Edge is recommended. Recording runs in real time; hiding the tab stops it and preserves the captured portion. Mute affects the exported sound too; recording unmutes automatically at the start. Pitch shifting changes playback speed and clip duration. Clips are capped at three seconds per merge.

Images, audio, names, volume, and order save locally using IndexedDB. Use the same browser and local address to recover them. No files are uploaded. The font is bundled locally with the app.

The physics uses a fixed 120 Hz update, ball collisions inside a circular arena, an animated cannon, eight increasing radii, and deterministic restarts. The cannon shoots exactly 128 starters. Timed attraction assists equal-stage pairs late in the run; the final two stage-7 balls merge into stage 8 at exactly 60 seconds of simulation time. All 128 starters are conserved through 127 genuine pair merges. The final stage cannot appear early. Live playback holds the finale for two seconds then pauses. A 60-second recording likewise includes a two-second finale hold, making the exported clip approximately 62 seconds so the final image and audio are captured. Shorter exports show a partial run; longer exports keep the completed final form. Simulation text is limited to a timer and fallback stage numbers.

## Checks

`npm test` checks merging, collisions, final-stage behavior, deterministic restarts, stability over two simulated minutes, and audio pitch routing. `npm run build` creates a production build in `dist`.

Every image row has its own Add audio / Replace audio control, uploaded filename, preview button, and remove button. These controls target that image directly; sounds stay assigned after reordering and reopening.

The simulation uses a pure black background and circular playfield with an original mint wall, twelve time marks, amber progress arc, and animated teal cannon. Uploaded media and the sixty-second finale remain independent of this visual treatment.
