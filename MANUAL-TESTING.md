# Bond Studio manual testing

This local project has no sign-in, membership, subscription, paid feature, or activation key. All thirteen modes and all controls are available. It is an original implementation of the reference's public feature descriptions, not its private application.

## Start and prepare

1. Double-click **Start Bond Studio.cmd** in this folder. Keep its window running. Open the local address it prints, normally **http://127.0.0.1:5173/**. Alternatively run `npm install` once, then `npm run dev`. Node.js is required; FFmpeg is required for MP4 conversion.
2. Use a recent Chrome or Edge. Keep the simulation tab visible during playback and recording. On a narrow window, scroll down to reach settings; use the Simulation menu instead of the horizontal mode strip. On desktop, the mode strip scrolls horizontally to its last modes.
3. If you have an existing project, click **Save project** before testing. This downloads a backup containing your assets and settings. Tests change the automatically saved local project.
4. Have eight distinctive PNG/JPG images, two short MP3/WAV sounds, and optionally a standard MIDI file ready. Images must be below 20 MB each; sounds below 30 MB; MIDI below 5 MB.
5. Click **Play simulation** once to allow audio. Turn up your device volume. With no uploads, built-in sounds and colored balls let you test immediately.

Record Pass/Fail and any unexpected behavior against each item below. Use **Restart** (the curved arrow beside Play) between comparisons. Changing scene settings also restarts the scene.

## Every simulation mode

For each row: select the mode, click **Play simulation**, observe for 15–30 seconds, pause, then restart. For a full-duration check, let it run to 01:00. Some events depend on the seed: use **Find an active seed** if a scene is quiet.

| Mode | Expected behavior |
| --- | --- |
| Bond | Cannon recoils when firing. Matching stages merge into larger stages, with a brief expanding outline/pop. All eight sizes increase. Cannon feeding continues into the last second; the final stage appears during the 60th second, then the run stops at 01:00 without a two-second hold. Use a full 60-second run to test this. |
| Ring escape | A ball bounces inside nested rotating rings and passes through their openings. |
| Infinite loop | Balls escape through ring openings and release additional waves. The run still ends at 60 seconds. |
| Ring destruction | Impacts break segments of the circular boundary. |
| Spike garden | Balls lodge on spikes while more shots enter the scene. |
| Collision burst | Collisions create additional balls. Population remains bounded. |
| Web expansion | Wall contacts create threads while the ball grows. |
| Rainbow trail | The moving ball grows and leaves a colored trail. |
| Spiral escape | The ball travels through a rotating spiral corridor toward the outside. |
| Fragment burst | Contact with spikes splits growing balls into smaller pieces. |
| Web battle | Contestants weave threads and cut opposing threads. |
| King of the hill | Contestants compete for time inside a moving central scoring zone. |
| Mirror drop | Paired balls fall through pegs with mirrored motion. |

Multiplication modes cap the population at 96 for performance. This is a local physics limit, not a paid tier. “Infinite” describes repeated waves within the 60-second scene.

## Playback and scene controls

Only controls relevant to the selected mode are shown. Bond uses its fixed sequence instead of adjustable physics controls.

| Option | Test | Expected result |
| --- | --- | --- |
| Play / Pause | Play, pause, wait, then resume. | Motion and elapsed time pause, then continue. |
| Restart | Restart halfway through. | Elapsed time and scene reset; the same seed/settings reproduce the motion. |
| Gravity | In Ring escape, compare 0 with 800. | Stronger downward acceleration at 800. |
| Launch speed | Compare 0.25 with 2. | Starting velocity is faster at 2. This does not shorten the 60-second duration. |
| Bounce | Compare 0.7 with 1.2. | Impacts lose more speed at the lower setting and retain/add more at the higher setting. |
| Ring count | In Ring escape, compare 2 with 10. | The number of nested rings changes. |
| Ring opening | Compare a small opening with a large one. | The visible gaps change; larger gaps are easier to pass. |
| Rotation | In a rotating mode, compare negative, zero, and positive values. | Rotation reverses, stops, and moves forward. Spiral motion also responds. |
| Contestants | In Web battle or King of the hill, compare 2 with 8. | The starting contestant count changes. |
| Trail length | In Rainbow trail or Spiral escape, compare 20 with 350. | More of the path is retained at the higher setting. |
| Reset in Scene settings | Change several sliders, then click Reset. | Physics options return to defaults. This does not erase images or audio. |
| Seed | Enter 123, play briefly, restart; then try 456. | Repeated 123 runs match; a different seed changes motion. |
| Shuffle seed | Click the shuffle icon. | A new seed is selected and the scene restarts. |
| Find an active seed | Run the search in a mode other than Bond. | Sixteen candidates are compared over twenty simulated seconds; the winning seed and activity score appear. |
| Cancel search | Click Cancel search before it finishes. | The search stops without applying an unfinished result. Bond intentionally disables this search. |

## Images, colors, names, and order

1. **Bulk upload:** use Add images and select eight distinctive images. Each cast row should get a different thumbnail. Selecting more than eight uses the first eight and reports that limit.
2. **Individual upload/replace:** select a row, then Upload selected image, or use its image icon. Only that image should change.
3. **Change to circle:** upload a square photo and choose this option. The image should fill a circular crop, without a square visible inside it.
4. **Keep same:** use a logo on a plain background. The background and outer padding should be removed, leaving the image without an added circle. Transparent PNGs should retain transparency. Complex photographic backgrounds are not guaranteed to be removed.
5. **Remove this image:** remove the selected image. Its colored ball should return.
6. **Ball color:** with the image removed, change the color and play. The ball should use the new color. An uploaded image covers the base color.
7. **Ball name:** edit the selected ball's name. Its row should update. Names identify assets; they are not automatically added as canvas captions.
8. **Order:** move a row using its up/down buttons, then try dragging it. The image, name, and assigned sound should move together. First/last arrows are disabled at their respective boundaries.
9. **Bond order:** run Bond after reordering. Matching images should progress through the new row order, with the last row as the final form.

## Uploaded collision audio

Turn **Use melody off** before testing uploaded sounds.

1. Upload a short MP3/WAV as the shared collision sound. Its filename should appear. Play a scene and hear it on impacts.
2. Use the eight pitch-preview bars or the complete-sequence preview. Each later stage should sound deeper: 0, -3, -6, -9, -12, -15, -18, and -24 semitones. Pitch shifting also changes speed and duration; each event plays at most three seconds.
3. For **every row from 1 through 8**, click Add audio and assign a sound. Confirm each row has its own filename. Preview each row independently.
4. Replace one row's audio with the second sound. Its preview should change while other assignments stay intact.
5. Remove that row's custom sound. It should fall back to the shared sound. Remove the shared sound too; unassigned stages should fall back to the built-in chime.
6. The selected-image sound panel provides the same assign, preview, and remove actions. Check that it edits the selected row.
7. In Bond, stage 1 is the starter and its sound can be previewed; merges produce stages 2–8. The final merge should use the deepest stage sound. Other modes trigger sounds for the image levels involved in their impacts.
8. Change Volume and confirm preview/playback loudness responds. Test the speaker mute button and then unmute. Recording starts by unmuting audio automatically; use Volume 0 if you want a silent recording.

## Melody and MIDI

1. Open **Melody & MIDI** and enable **Use melody**. Play a scene. Each sound-triggering impact should advance to the next note; the sequence loops. This replaces uploaded collision audio while enabled.
2. Click an empty piano-roll cell to add a note. Click the same selected cell to clear it. There is one note or rest per step. Preview the result with impacts.
3. Test all nine Instrument choices using **Hear sound**: Piano, Music box, Bell, Marimba, Guitar, Strings, Flute, 8-bit, Ambient. Each should be audible with a different timbre.
4. Choose Steps 16, 32, and 64. Use the left/right pager to inspect the additional groups of sixteen. Boundary pager buttons should be disabled.
5. Click **Clear**: all steps become rests. Click **Preset**: the default melody returns.
6. Click **Export MIDI**, then **Import MIDI** and choose the downloaded file. Notes should return in order. You can also import standard format 0/1 MIDI. Chords flatten into successive notes; impacts replace original timing and tempo. Imports above 256 notes report truncation. Imported note events do not preserve empty steps as rests.
7. Turn Use melody off. Uploaded/shared collision sounds should resume.
8. Keyboard check: Tab to the sound tabs, switch with Left/Right or Home/End, then Tab to a note. Enter/Space should edit it while keeping focus on the same cell. On a narrow screen, scroll within the roll to reach offscreen columns.

## Watermark, timer, and PNG

1. Enter a name in **Custom watermark**. It should appear near the top of the canvas. Clear the field to remove it.
2. Toggle **Show timer** off and on. The timer drawn inside the canvas should disappear/reappear. The editor's elapsed-time indicator remains available.
3. Pause on an interesting frame and click the camera icon. Open the downloaded PNG: it should contain the canvas at 540 × 960, including your watermark and timer choice, without editor controls.

## MP4 recording and download

1. Set Video length to **15 seconds**, select a mode, and click **Record video**. A fresh run should start. Keep the tab visible. Scene editing is temporarily disabled so the recording stays consistent.
2. At completion, wait for local preparation, then click **Download video**. Open the `.mp4` in a video player. Check portrait picture, audible impacts/melody, watermark, and timer. The output should be 540 × 960, H.264 picture with AAC sound.
3. Repeat with **30 seconds** and **60 seconds**. In Bond, only the full 60-second option includes the final merge. Shorter choices intentionally capture partial runs.
4. Try **Stop recording** midway. The captured portion should be prepared for download.
5. Try hiding the tab during a disposable test. Capture should stop and retain the portion recorded. For a full run, keep it visible.
6. If preparation fails, ensure FFmpeg is installed and the app is running through its local server; use **Retry MP4 export**. This is a setup requirement, not membership. A static file server alone does not supply the conversion endpoint.

## Save, restore, help, and local-only use

1. Customize mode, sliders, seed, image order, colors, names, sounds, melody, volume, watermark, and timer. Wait for **Saved on this device**.
2. Refresh the same local address in the same browser. Those settings and assets should return. Playback does not automatically resume. `localhost` and `127.0.0.1` are separate storage addresses; use one consistently.
3. Click **Save project**. Change some settings, click **Open project**, and select the downloaded JSON. The saved assets/settings should be restored. The Open project button should also work using Tab then Enter.
4. Open Help with the question-mark button; close with its close/acknowledgement button. The home wordmark should reload the local studio while retaining the saved project.
5. After installation and with the local server running, disconnect internet access. Play modes, edit notes, upload local files, save/open projects, and record MP4. These features should still work; keep the local server running.
6. No screen should ask you to sign up, pay, activate, or buy credits. Recording locks, file limits, disabled irrelevant physics controls, and the 60-second scene duration are functional constraints, not access restrictions.

If something fails, note the mode, seed, changed settings, browser, action, and any visible error. This makes the run reproducible.
