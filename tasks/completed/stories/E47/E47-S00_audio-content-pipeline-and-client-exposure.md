# E47-S00 — Audio content pipeline and client exposure

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E42-S03 (District Material Painting), E43-S06 (Starter Region Topology)
- Blocks: E47-S01, E47-S02, E47-S05

## Spec references

- `POC_SPEC.md` §23.1 (Asset formats — audio: OGG/WebM)
- `POC_SPEC.md` §7.1 (Visual style — readable, restrained)
- `docs/content/00-index.md` — content definitions bridge from design docs to runtime JSON
- `tools/content-validator/src/loader.ts` — top-level content directory validation
- `packages/shared/src/content/content-kind.ts` — known content kinds
- `packages/shared/src/content-schemas/index.ts` — content schema registry
- `packages/shared/src/content/content-client-registries.ts` — client-facing content registry schema
- `apps/server/src/content/serialize-content-for-client.ts` — `/api/content` serialization boundary
- `apps/client/src/game/ui/ContentClient.ts` — client content API

## Objective

Make audio a first-class content kind before any E47 story creates `content/audio/*.json` files. Without this story, the content validator rejects `content/audio/` as an unknown top-level directory and the client has no path to load audio definitions.

## What already exists — verify, do not rebuild

- The content validator determines a file's content kind from its top-level content directory.
- Unknown top-level directories currently fail validation.
- `ContentRegistries` and `contentClientRegistriesSchema` are strict and currently expose only the existing content kinds.
- `/api/content` serializes a fixed set of registries; adding JSON files alone is not enough.
- `ContentClient` exposes typed getters for known registries only.

## Required architectural decisions

- **Canonical content kind:** Add `audio` as the content kind for `content/audio/*.json`.
- **Registry shape:** Use a small but extensible schema that supports ambience loops, positional sources, UI sounds, and action/server sounds without requiring four unrelated ad-hoc formats.
- **Client exposure:** Audio definitions must be available through the normal `/api/content` and `ContentClient` path.
- **Asset references:** Definitions should reference relative asset paths such as `assets/audio/...`. Do not embed audio bytes in content JSON.
- **Original/licensed assets only:** No OSRS/Jagex sounds or ripped assets. Placeholder generated tones are acceptable if clearly marked.
- **Validation:** Content validation must reject duplicate audio IDs, invalid categories, missing required fields, and malformed asset paths.

## Implementation checklist

- [X] Add `packages/shared/src/content-schemas/audio.ts` with schemas/types for audio definitions.
- [X] Add `audio` to `packages/shared/src/content/content-kind.ts`.
- [X] Add `content/audio` to the content directory-to-kind mapping used by the validator/loader.
- [X] Export the audio schema from `packages/shared/src/content-schemas/index.ts`.
- [X] Add `audio` to `ContentRegistries` and `contentClientRegistriesSchema`.
- [X] Update `apps/server/src/content/serialize-content-for-client.ts` so audio definitions are included in `/api/content`.
- [X] Add typed audio accessors to `apps/client/src/game/ui/ContentClient.ts`.
- [X] Create minimal valid content files under `content/audio/` for ambience, positional sources, UI sounds, and action/server sounds, or one normalized `audio.json` if the schema chooses a single registry file.
- [X] Add or document placeholder original audio asset paths under `assets/audio/`; do not add third-party/ripped game audio.
- [X] Add tests proving `content/audio/*.json` validates and appears in the serialized client content payload.

## Acceptance criteria

- [X] `bun run content:validate` accepts the new `content/audio/` files.
- [X] Invalid audio content fails validation with clear messages.
- [X] `/api/content` includes the audio registry.
- [X] `ContentClient` can return audio definitions by ID/category.
- [X] S01/S02 can add ambience and action/UI sounds without inventing another data path.
- [X] All audio content is original, generated, or explicitly licensed for use.

## Validation commands

- [X] `bun run content:validate`
- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
