---
name: Bond Studio
description: A quiet sound-design workbench for colorful chain reactions.
colors:
  ink: "#252722"
  desk: "#f6f5f1"
  paper: "#fffefa"
  line: "#e4e3dc"
  muted: "#72766c"
  accent: "#bc4d2e"
  soft: "#efeee7"
  playback: "#2e3b2e"
  recording: "#bb5033"
  recording-active: "#9d342a"
  download: "#dfe8d5"
  download-ink: "#33432d"
  selected: "#f1f0e8"
  selected-line: "#e3e0d3"
  canvas: "#080a0e"
  simulation-paper: "#000000"
  simulation-ink: "#27393b"
  simulation-interior: "#000000"
  simulation-launcher: "#31766d"
  stage-blue: "#a9c7f5"
  stage-lilac: "#c0a5eb"
  stage-peach: "#ffbc87"
  stage-rose: "#fb8f9d"
  stage-mint: "#a9dcb7"
  stage-yellow: "#f4da7a"
  stage-aqua: "#79d3d4"
  stage-pink: "#eea6d2"
  white: "#ffffff"
typography:
  headline:
    fontFamily: "'DM Sans Variable', 'Segoe UI', sans-serif"
    fontSize: "32px"
    fontWeight: 550
    letterSpacing: "-1.05px"
  title:
    fontFamily: "'DM Sans Variable', 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 650
    letterSpacing: "-0.25px"
  body:
    fontFamily: "'DM Sans Variable', 'Segoe UI', sans-serif"
    fontSize: "14px"
  instruction:
    fontFamily: "'DM Sans Variable', 'Segoe UI', sans-serif"
    fontSize: "12px"
    lineHeight: 1.8
  label:
    fontFamily: "'DM Sans Variable', 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 550
  item:
    fontFamily: "'DM Sans Variable', 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 550
rounded:
  badge: "4px"
  select: "6px"
  icon: "7px"
  button: "8px"
  row: "9px"
  panel: "14px"
  dialog: "16px"
  circle: "50%"
spacing:
  compact: "6px"
  control: "8px"
  inline: "10px"
  settings: "16px"
  panel: "20px"
  workspace: "30px"
components:
  button-playback:
    backgroundColor: "{colors.playback}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "10px 13px"
  button-record:
    backgroundColor: "{colors.recording}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "10px 13px"
  button-record-active:
    backgroundColor: "{colors.recording-active}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
  button-download:
    backgroundColor: "{colors.download}"
    textColor: "{colors.download-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "10px 13px"
  button-subtle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "10px 13px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "20px"
  stage-selected:
    backgroundColor: "{colors.selected}"
    rounded: "{rounded.row}"
    padding: "6px"
  portrait-preview:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.panel}"
---

# Design System: Bond Studio

## Overview

**Creative North Star: "The Sound-Design Workbench"**

Warm paper surfaces and compact, plainly named controls frame a colorful moving canvas. The interface feels quiet and practical: image identities provide recognition while olive and terracotta actions establish playback and recording priority.

The shipped system uses one bundled sans-serif family, delicate borders, and softly rounded containers. Ceramic tokens and a circular black playfield belong to the simulation; editor surfaces give those materials room to read.

**Key Characteristics:**
- Warm paper and fine dividers.
- Persistent pastel identities across images and sounds.
- Olive playback and terracotta recording controls.
- A black portrait canvas with a mint circular border as the visual center.

## Colors

The palette combines warm neutrals with restrained action colors and eight recognizable pastel identities. Frontmatter values are the canonical extracted source values.

### Primary
- **Terracotta accent:** focus outlines and native control accents; the distinct recording color fills the record action and deepens while recording.
- **Olive playback:** play controls and transient status messages; pale olive supports completed downloads.

### Secondary
- **Stage blue, lilac, peach, rose, mint, yellow, aqua, and pink:** identity colors shared by stage thumbnails, audition bars, spheres, and the canvas stage legend. The source stores each color on its stage object, so identity moves with reordering.

### Neutral
- **Desk:** overall application background.
- **Paper:** panel, header, select, and dialog surfaces.
- **Ink / muted:** primary text and supporting instructions.
- **Line / soft:** fine structural dividers and hover surfaces.
- **Selected / selected line:** the current stage's quiet emphasis.
- **Canvas:** pure black field (#000000), mint circular wall (#78bdae), amber time arc (#edba7b), and teal cannon (#31766d). The CSS fallback behind the opaque canvas remains deep black-blue.

**The Identity Travels Rule.** A stage keeps its pastel identity when its position changes; the corresponding thumbnail and pitch bar stay synchronized.

## Typography

**Display and Body Font:** bundled DM Sans Variable, with Segoe UI and sans-serif fallbacks. Variable weights create hierarchy without a second editor family.

### Hierarchy
- **Headline:** page heading; compact tracking and medium weight. It steps down to (27px) on mobile.
- **Title:** panel titles; they reduce to (14px) at the intermediate desktop breakpoint and return to their default on mobile.
- **Body:** page description.
- **Instruction:** explanatory panel text with open leading.
- **Label:** action buttons and editable ball names.
- **Item:** stage names. Secondary metadata uses smaller text (9–11px); mobile raises stage descriptions and several audio notes to (11px).

The brand uses a larger wordmark (24px, 700) with a lighter suffix (450), stepping to (21px) on mobile. Time and count displays use tabular numerals. Canvas titles, counters, and captions use the bundled DM Sans Variable family.

## Layout

The desktop workspace is a three-column grid with an ordered asset panel, a portrait preview, and a stack of audio and recording controls. The page container caps at (1510px), with horizontal gutters of (4%). Side columns span (270–310px); the preview caps at (455px). Panels use the panel spacing token, settings stack with the settings spacing token, and the main grid uses the workspace spacing token.

Above (1000px), the header is (70px) tall and preview width is constrained by available viewport height: `min(100%, max(240px, calc((100dvh - 290px) * .5625)))`. The preview is sticky with a top inset of (20px). This late stylesheet rule overrides the earlier header and preview declarations.

At (1200px) and below, side columns tighten to (270px), gutters become (24px), and panel padding becomes (16px). At (1000px) and below, the workspace becomes two columns and settings move below them. At (640px) and below, the preview leads a single column, caps at (330px), and the panels follow; gutters become (18px) and panel padding becomes (19px). At (1500px) and above, the grid gap expands to (40px).

## Elevation & Depth

The editor is flat at rest. Paper, fine borders, selection fills, and the plum playfield surround establish layers without panel shadows. The modal alone uses a diffuse shadow (`0 20px 70px #0003`) and a translucent backdrop (`#181c1a77`). Rendered tokens use flat pastel fills, inset rims, off-centre highlights, and small soft shadows, separate from editor elevation.

**The Quiet Frame Rule.** Use borders and tonal separation for ordinary editor surfaces; reserve the shipped diffuse shadow for the modal.

## Shapes

Panels and portrait clipping share the panel radius; controls use the smaller button radius, while stage rows and upload wells use the row radius. Status badges have tighter corners. Stage thumbnails and the brand mark are circles. The portrait canvas holds a (9:16) aspect ratio and clips its contents; uploaded images use contain fitting inside circular identities.

## Components

### Buttons
Compact, explicit actions use the label role, a minimum height of (41px), and small inline SVGs. Playback uses olive, recording uses terracotta, and the downloadable result uses pale olive. Secondary actions use a transparent fill with a fine line border. Icon controls are transparent squares (34px) with the icon radius and a soft hover surface.

Buttons transition background, color, and shadow over (.16s); enabled hover applies `brightness(.97)`. Keyboard focus uses an accent outline (2px) offset by (4px). Disabled buttons use opacity (.35). Reduced-motion preference removes CSS transitions.

### Chips
Small contextual status labels use pale neutral or olive fills, the badge radius, and compact padding. They communicate optional or automatic behavior rather than navigation.

### Cards / Containers
Paper panels use a fine line border and the panel radius. The selected stage is a tonal row with a selected line border rather than a lifted card. A narrow divider connects adjacent stage identities in the sequence.

### Inputs / Fields
The ball-name editor is a transparent inline field with a normally transparent bottom border; hover reveals the line border. Duration selects use a paper background, fine border, select radius, and padding (6px 8px). Range controls use the terracotta accent. All share the keyboard focus treatment.

### Navigation
The header contains a home wordmark, storage status, and help action; there is no tab or sidebar navigation pattern. At mobile width, the storage status retains its icon while hiding text.

### Stage Identity and Pitch Ladder
Circular thumbnails (37px) pair stage names with sequence metadata; selected-ball thumbnails shrink to (33px). The eight audition bars reuse the same stage colors, rise from (17px) in increments of (4px), and become fully opaque on hover. Each audition target is a real button with a stage-specific accessible name.

## Do's and Don'ts

### Do:
- **Do** keep stage identity synchronized across thumbnails, audition bars, and simulation spheres.
- **Do** use olive for playback and terracotta for recording.
- **Do** keep keyboard focus visible with the shared accent outline.
- **Do** let the portrait preview lead the mobile workspace.

### Don't:
- **Don't** add ordinary panel shadows where the shipped editor uses flat paper and borders.
- **Don't** replace explicit action labels with decorative labels.
- **Don't** treat stage colors as unrelated decoration.

Not canonized: 9–10px secondary metadata remains in the editor; these are legibility limitations, not reusable minimum-size rules.

### Simulation update: cannon and image treatment
The canvas contains the rounded playfield, a teal cannon with plum base, recoil, muzzle flash and smoke on every shot, a stage strip and numeric timer. Decorative canvas wording has been removed. Uploaded circular images cover the complete ball with no square inset. Image-only logos have neither colored backplates nor circular borders and preserve transparent contours; their editor thumbnails also lose the circular container. Image-shape controls sit immediately below image upload and apply to the selected stage. Timed attraction completes the final pair at 60 seconds; shared and assigned sound pitch descends by stage.

### Audio on each image row
Every stage row has a second line with Add audio or Replace audio, the assigned filename (or Shared sound), and stage-specific preview/removal actions. The selected-image audio panel remains available. Audio assignments use stable stage identities and follow images through reordering.

### Current circular simulation
The playfield is a true circle of radius 244 at (270, 475) on the 540 by 960 pure-black canvas. Mint wall, twelve muted clock marks, and amber elapsed-time arc provide an original border treatment. The existing cannon sits over the top of the circle. No long chute, rainbow border, copied watermark, slogan, or reference logos are introduced. Ball image modes, individual sound controls, and the 60-second finale remain in place.
