# Public reference findings

Reference: https://ballsimulator.com/en/ and its editor entry /en/ballsimulator/. Inspected on 2026-10-25 using REA controlled browser captures.

## Observed

- Public page lists Classic, Infinite Loop, Destruction, Accumulation, Collision, Web Expansion, Trail Expansion, Spiral, Fragment Expansion, Web Battle, Merge, King of the Hill and Symmetric Drop.
- Public page describes MIDI note editing/import, nine instrument choices, uploaded sounds, video export, custom watermark and auto searches.
- Editor entry displays “Exclusive member access” with Login and Unlock Access links. The private application and its physics implementation were not accessible in the unauthenticated session.

Evidence: `ev_8ae38e36b8f0cbaa4693af82cdb3a74dd5903ded27648661521306266b529706` (public features); `ev_9e849cf8649b484b6cea31b3ce2bd1374846bf6164a237736c3b1bb31ced5804` (member access boundary). Both reported complete requested accessibility snapshots and terminated their owned browsers.

## Implementation choices and limits

Bond Studio implements original, bounded interpretations of the public mode descriptions. Physics constants, controls, seed-search score, timbres, layout and branding are local design decisions. It does not claim exact private-engine parity. No third-party scripts, logos, sound library, marketing promises, paid access, or source assets are shipped. The multiplication modes cap population at 96 for responsive local rendering. MIDI import preserves note order, flattens chords and lets collisions set rhythm; it is not a full MIDI transport. Project files include the user's local media. The original Bond sequence still completes within its 60th second.
