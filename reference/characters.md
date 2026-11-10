# Characters — original cast and consistency rules

All characters are original and drawn by code (`engine/characters.js`), so they are identical
in every frame. Never draw a character by hand in a scene; always use `drawCharacter`.

## Design DNA (applies to every character, new ones too)
- Head ≈ 30-43 % of height; big ears; eyes = large white ovals touching each other with small dot pupils.
- Thin limbs (2.4-3.4 % of height), small round mitten hands, oval shoes.
- One strong silhouette feature each (hair tuft, bun, flat-top, cap) so they read at phone size.
- Thick ink outline, flat fills, soft blush on cheeks.
- **Side view (`view:'side'`) shows ONE eye and one brow** (user rule: two eyes in profile looks wrong). The nose sticks out of the profile; ear moves to the back of the head.
- Height differences are part of the comedy (tall lanky lead vs tiny granny vs boxy shopkeeper vs small kid).

## Cast (`CAST` ids)
| id | Name | Role / personality | Silhouette & colours |
|---|---|---|---|
| `toby` | Toby Tuft | Lead. Over-confident, easily excited, plans go wrong. | Tall, lightbulb head, orange spiky tuft, round nose, mustard sweater with white collar, teal trousers. rel height 1.0 |
| `nan` | Nan Marigold | Sharp, unimpressed granny; secretly the smartest. | Tiny (0.62), round head, lilac-grey bun, round brown glasses, green cardigan with buttons, red tights. |
| `bramble` | Mr. Bramble | Shopkeeper / authority figure, smug, deadpan. | Big boxy (0.96), flat-top, bulb nose, moustache, white shirt + blue apron. |
| `pip` | Pip | Kid sidekick, fast, curious, asks the obvious question. | Small (0.55), huge round head, red cap, freckles, violet tee with yellow stripe. |
Use `h: 820` (world px) as the standard size; scale with camera zoom, not with `h`, so heights stay consistent.

## Expressions (`face`)
neutral · happy · grin · shock · angry · worried · smug · talk · sleepy.
`talk` is set automatically while an actor `speaks`; mouth opening follows the voice envelope.

## Pose controls
`armL`/`armR` = `[shoulder, elbow]` radians (0 = hanging down, + = outward/forward).
Presets that read well:
| Pose | armL / armR |
|---|---|
| relaxed | `[0.2,0.1]` |
| hands on hips | `[0.9,-1.9]` |
| shrug | `[0.5,1.7]` |
| arms up (shock/cheer) | `[2.3,0.3]` |
| point forward (side view, near arm) | armR `[1.4,0.3]` |
| hold item up | armR `[2.6,0.2]` |
| run swing (side) | armL `[-0.8,0.5]`, armR `[1.0,0.6]` |
Other: `view` front/side, `facing` 1/-1, `lean` rad, `headTilt` rad, `look [x,y]` −1..1,
`squash` (1.1 stretch / 0.9 squash), `hop` px, `walk` (auto when moving with `walk:true`).

## Adding a new character
Copy a CAST entry, change proportions + colours + one silhouette feature; reuse existing
hair/nose/top types or add a new branch in `drawHead`/torso following the same outline rules.
Render `engine/modelsheet.html` (via `node engine/shot.js`) and show the user before using it.
Save the model sheet PNG into the project's `characters/` folder.
