# Bond Studio
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Assumption: Vite with plain JavaScript and Canvas; no existing project or stack preference supplied.
## Product Purpose
Create a bouncing ball simulation with a circular playfield on a black background. Two matching balls merge into the next image stage.
## Capabilities and Constraints
Eight user images, user-controlled merge order, a shared uploaded sound automatically pitched per merge stage, optional separate sound per image. User confirmed recording and downloading video with sound. Physics and arena remain consistent across simulations. Local processing.
## Evidence on Hand
User-supplied 56.9-second portrait video in C:/youtube/source; contact sheet in .reference/contact.jpg.
## Open decisions
App name and editor styling are implementation choices. Export uses browser-supported video formats.

## Simulation visual identity
User requested a distinct appearance from the reference. The simulation uses an ivory background, plum rounded rectangular arena, inset teal launcher, ceramic token styling, original captions, counters, and four-point merge sparks. This is a visual redesign, not a guarantee about rights in uploaded images or sounds.

## Sixty-second finale and image modes
Every standard run fires 128 starters and conserves their mass through 127 pair merges, with the final merge at exactly 60 seconds. Late-run attraction guides matching pairs. The default recording includes a two-second finale hold. Each image has Change to circle (default circular cover crop) or Keep same (image-only, no circle; automatic edge-connected plain-background removal and transparent trimming). Complex backgrounds may remain. Each cannon shot has timed recoil, flash and smoke. Shared and assigned audio both get deeper by stage. No decorative titles, slogans or branding remain in the simulation frames.

## Current arena appearance
User requested a circle and a black background matching the reference setting. The arena now uses circular collision physics, an original mint border with clock marks and an amber progress arc, plus the existing animated cannon. This supersedes earlier ivory/rectangular appearance notes.

## Current recording and motion requirements
User requested continuous cannon shots until the final bond during the 60th second, no extra finale hold, deepest final audio, true MP4 output, larger distinct ascending sizes, reference-like expanding-ring merge motion, and a glowing rainbow arena outline without the outside timeline. Current timing is last shot at 59.6s, final merge at 59.8s under the normal 120Hz update, and default clip end at 60s. Radii: 24/32/41/52/65/80/97/116. MP4 conversion runs in the local Vite/preview server with FFmpeg and produces H.264/AAC. This supersedes prior exact-60 merge and two-second hold notes.

## Expanded studio (2026-10-25)
User requested a full local build inspired by ballsimulator.com using REA, and pre-approved routine build steps. REA observed thirteen mode descriptions and the public MIDI/instrument/export feature descriptions. The editor entry requires membership; exact private physics and settings remain unknown. See REFERENCE.md for Evidence IDs and limits. The implementation adds twelve original mode engines to the existing Bond engine, relevant scene controls, seeded replay and a sixteen-candidate activity search, nine procedural instruments, a collision-triggered piano roll and MIDI import/export, portable project JSON including local media, color controls, watermark, timer toggle and PNG snapshots. All thirteen modes stop at sixty seconds. Existing image/audio projects remain supported. MIDI note order is preserved, chords flatten, collision timing replaces source rhythm, and the import limit is 256 notes. Population caps are intentional and documented. No subscriptions, account system, copied brand assets, commercial promises, or third-party song library are part of this local creator tool.
