---
name: voice-lines
description: Add or change Kuromi's recorded voice lines (js/lines.js), regenerate the mp3s with ElevenLabs and refresh the voice manifest
disable-model-invocation: true
argument-hint: "[what to add or change, e.g. 'thêm 3 câu cho nhóm poke']"
---

# Kuromi voice lines

Request: $ARGUMENTS

Kuromi's fixed lines live in `LINES` in `js/lines.js`. Question-reading fragments live in `PHRASES` there too. Each line becomes `audio/voice/<id>.mp3`. `audio/voice/manifest.js` (`VOICE_FILES`) lists which mp3s exist; any line without a file falls back to the browser's speechSynthesis.

## Rules that are easy to break

- Ids are **positional**: `L_(group, emo, tone, texts)` names lines `<group>_1`, `<group>_2`, … in array order.
  - Add new lines at the **end** of a group. Inserting or removing in the middle shifts every later id onto the wrong mp3.
  - Changing the text of an existing line keeps its id, so its old mp3 must be regenerated with `--force <id>`.
- A new `PHRASES` entry needs a unique `id` (`p_...`). Its text must match how `normalizeSpeech` reads the question, or `segment()` won't use it.
- Lines say "bạn"/"bạn nhỏ", never the child's name (`withName` swaps it in on screen only). Emoji are display-only. Keep lines short and warm for a 5–8-year-old.
- Pick `emo` from the existing set (`neutral`, `happy`, `think`, `clap`). Reuse a `tone` string already used in `tools/voice-export.mjs` `TAGS` so it gets an ElevenLabs audio tag. Add a mapping there if you invent a new tone.
- A new group needs a caller (`mascotSay('<group>')` or `voice.line`). Otherwise it is never played.
- Never edit `audio/voice/manifest.js` by hand (a hook blocks it). Never touch `.env`.

## Steps

1. Edit `js/lines.js` (and the code that plays the new group, if any).
2. `npm run voice:export`: rewrites `audio/voice/script.csv`, `script.md` and `voice-prompt.md`. Check `git diff audio/voice/script.csv`: only the intended rows should change. Unexpected changes mean ids shifted, so go back to step 1.
3. Dry run: `npm run voice:generate -- --dry <prefixes>`. Show the user the list of files and texts that would be generated.
4. **Stop and ask the user to confirm** before spending ElevenLabs credits. Then run one of:
   - new lines: `npm run voice:generate -- <prefixes>`
   - changed text of existing lines: `npm run voice:generate -- --force <exact ids>` (use exact ids so nothing else is regenerated)

   The script rewrites the manifest itself when at least one file succeeds. If it fails with a missing key, ask the user to fill `ELEVENLABS_API_KEY` in `.env`.
5. If mp3s were added or removed manually, run `npm run voice:manifest`.
6. `npm test`, then report which files were created or regenerated and any `✗` failures from the script output.
