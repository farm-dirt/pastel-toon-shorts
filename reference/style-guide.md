# Style guide — the pastel-toon look

Derived from analysing a 2D TV-cartoon reference (23 min episode, stills every 35 s, cut-rate
measured). We keep its *visual language*, never its characters, props or designs.

## What makes the look recognisable
| Element | Rule |
|---|---|
| Line | Characters: thick, even, warm near-black outline `#2b1d1a` (≈1 % of character height, min 2.5 px). Backgrounds: thin 2-3 px lines in a **darker shade of the same hue** — never black. |
| Fill | Flat colour, no gradients on characters. Only soft gradients allowed: the sky. |
| Contrast hierarchy | Characters = saturated + dark outline. Backgrounds = pale, low-contrast, few details. The eye must always land on the character. |
| One hue per location | Each place has a dominant pastel hue: park = lime, street = mint, shop = salmon, kitchen = sky blue, night = indigo. Changing location = changing colour → instant orientation for the viewer. |
| Shapes | Rounded, simple, slightly wonky. Big readable silhouettes. Clouds/bushes are bumpy blobs. |
| Depth | Layered flat planes (sky → far hills → buildings → ground), soft ellipse shadows under feet, gentle vignette. No perspective-heavy scenes. |
| Text in world | Rare. Only signs that matter to the story (big, short, Poppins Bold). |

## Palette (tokens in `engine/backgrounds.js` → `LOC`)
- Ink `#2b1d1a` · caption highlight `#ffd23f` · caption white `#ffffff`
- Park: sky `#e4f5ee→#f6f8dc`, line `#a9c172`, ground `#d4e88f`, bush `#b7d56d`
- Street: sky `#dcf2f2`, line `#8fc3b6`, buildings `#c9ebe0/#b3dfd2`, ground `#d5e7e4`
- Shop: wall `#f9d3c8`, line `#d99a8c`, shelf `#f4b9aa`, floor `#f3dcd0`
- Kitchen: wall `#d3e6f5`, line `#94b6d3`, cabinets `#b9d3ea`
- Night: `#4a4f86→#7a6fa8`, moon `#fff2c2`
Character colours are saturated mid-tones (mustard, teal, leaf green, tomato, violet) so they
pop on any pastel. Never dress a character in the location's own hue.

## Adding a location
Add an entry to `LOC` (sky, line, ground, ground2, far, bush, accent) + a `DRAW.<name>` function.
Keep: ground line at y = 1500 in the 1080×1920 world, ≤ 6 big shapes, lines in `L.line`, nothing
saturated. For a one-off location, put it in the project's `custom.js` as
`window.CUSTOM = { bg: { name(ctx, t, lt) {...} } }` and set `location` to a base location
whose colours match (custom bg draws on top of it).

## Frame layout (1080 × 1920)
- **Caption band**: centre y = 400 (top ~20 %). Approved by the user. Faces never inside y 330-470 while a caption shows (lint enforces).
- **YouTube UI**: top 7 % (search/camera), bottom 20 % (title, channel, description), right 13 % from 42 % down (like/comment buttons). Faces stay out; feet/ground may go there.
- Characters stand with feet at y ≈ 1560 world; at zoom 1 the ground is ~78 % down.
- Main action in the middle 45 % of the frame; the face of the speaker is the focal point.

## Captions
Poppins Bold (bundled, OFL), 92 px (auto-shrinks to fit 940 px), white with thick ink outline,
1-3 words, lowercase except names, key words in yellow via `*word*`, pop-in 0.14 s.
