# World audio cues (E47-S02)

Authoritative world/action sounds are driven by server `SoundPacket`s on tick
deltas. The client converts each packet into a `sounds.play` presentation event
and routes it through `AudioManager.play(soundId)`.

## Existing server cue IDs

| Sound ID | Emitter | Content def |
|----------|---------|-------------|
| `door_open` / `door_close` | `door-system.ts` | `content/audio/action.json` |
| `chest_open` / `chest_close` | `door-system.ts` | `content/audio/action.json` |
| `bell_ring` | `object-interaction-router.ts` | `content/audio/action.json` |

## Adding a new world cue

1. Emit `ctx.deltas.markSound({ soundId, tile?, volume? })` from the server system.
2. Add a matching `category: "action"` entry in `content/audio/action.json`.
3. Place an original/licensed asset under `assets/audio/action/` and mirror to
   `apps/client/public/audio/action/`.

Do **not** invent client-side guesses for combat hits, skilling success, or
economy actions — those must come from authoritative packets or animation updates.
