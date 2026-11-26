# Atelier build plan

Tracks the work to turn Atelier from a single-screen demo into a full writing workspace, for the #BuildHybridAI hackathon (Firebase AI Logic hybrid inference, **Web/Chrome**).

- **Deadline: Mon Nov 30, 2026, 2:00 PM PST.** Commits after this are not judged. Aim to submit Sun Nov 29 night.
- **Time left at last update (Thu Nov 26, 10:35 PM local): about 4 days.** The schedule below is sized for that.
- **Rules to keep in mind:** public repo with a detectable open-source license; Firebase AI Logic must be imported and actually called at runtime; no production keys in the repo; video 3 minutes or less, on YouTube, in English; disclose pre-existing code and summarise what was built during the period.
- **Status key:** `[ ]` to do, `[~]` in progress, `[x]` done, `[-]` cut.

## Decisions

| Topic | Decision |
|---|---|
| Backend | Firebase: Auth, Firestore, App Check, Remote Config, AI Logic, Hosting |
| Platform | Web (Chrome desktop 139+) only. Android is out of scope |
| Frontend | Vite + React + TypeScript |
| Editor | Tiptap (Write mode) + existing ball engine (Flow mode) |
| Design | Dark, Notion-style shell. Playful art stays in Flow mode, the spark screen and empty states |
| Team | Solo |

## Verified facts (from the Firebase AI Logic docs)

- SDK: `firebase/ai` v12.5+. `getAI(app, { backend: new GoogleAIBackend() })`, then `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE })`.
- Modes: `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`.
- On-device (Gemini Nano via Chrome's Prompt API): Chrome desktop 139+, single-turn text, structured output (JSON, enums), streaming. No chat.
- `model.initializeDeviceModel()` must be called after a user gesture (a click) and before the first prompt. First download can take minutes.
- The response reports whether on-device or cloud ran (use it for the UI chip).
- App Check is required for AI Logic. Debug tokens are accepted locally and in submissions.

## Stage 0: Firebase setup and spike (go / no-go) — tonight

- [x] Firebase project created (`atelier-writer-app`) and CLI pointed at it
- [x] Web app registered, config in `.env.local` (git-ignored), `.env.example` has the names
- [x] Chrome 158 present on this machine (needs 139+)
- [ ] **Blocked:** enable Google APIs (Firestore, Identity Toolkit, Firebase AI Logic, Generative Language, App Check, Remote Config). `gcloud` is logged in as a different account than the Firebase CLI, so this needs the Firebase account (see log)
- [ ] Firestore database created
- [ ] Auth providers enabled (Google, email link, anonymous)
- [ ] AI Logic enabled (Gemini Developer API), App Check enforced, debug token registered
- [ ] Nano model downloaded in this Chrome (`LanguageModel.availability()` is `available`)
- [ ] One hybrid call works and reports `on_device` or `in_cloud`
- [ ] Decision recorded here: go, or change approach

## Stage 1: foundation and shell — Fri Nov 27 (morning)

- [ ] React + Router + Tiptap added to the Vite app, existing engine kept working
- [ ] Firebase init (`src/firebase/`), App Check wired
- [ ] Auth: Google, email link, anonymous "try it"
- [ ] App shell: sidebar (project tree), top bar, Cmd+K placeholder, offline indicator
- [ ] Dark design tokens and base components (button, input, menu, dialog, toast)
- [ ] Firestore security rules (per-user access)

## Stage 2: projects and the Write editor — Fri Nov 27 (afternoon)

- [ ] Data model: `users/{uid}/projects/{id}/docs/{id}` plus `versions`, `bible`, `presets`
- [ ] Create, rename, delete (trash) projects and documents
- [ ] Tiptap editor: headings, lists, quotes, slash menu, markdown shortcuts
- [ ] Autosave with debounce, offline persistence on, save-state indicator
- [ ] Home page: continue writing, recent documents, word count

## Stage 3: hybrid AI layer and Flow mode — Sat Nov 28

- [ ] Single `ai/` module: every call goes through one router
- [ ] Routing policy (on-device vs cloud) by task and size, thresholds from Remote Config
- [ ] "On-device" / "cloud" chip per request
- [ ] On-device flows: attention picks, steering menus, realization check, focus scoring
- [ ] Cloud flow: long continuation, with on-device fallback
- [ ] JSON-output hardening for the small model (schemas, retries)
- [ ] Flow mode opens inside the editor: Spark flow, Keep and Discard, right panel (Context, Locks, Presets)
- [ ] Offline behaviour: on-device features keep working, cloud features say what they need

## Stage 4: writer features and polish — Sun Nov 29

- [ ] Inline AI commands on selection: rewrite, shorten, expand, change tone
- [ ] Story bible: characters and places, suggested from the text, used as AI context
- [ ] Cmd+K search
- [ ] Version history: timeline and restore
- [ ] Onboarding and empty states with art
- [ ] Settings: AI and privacy (on-device only toggle), export Markdown
- [ ] Remove `api/llm.js`, the proxy and any pasted keys; confirm none in git history
- [ ] Deploy to Firebase Hosting, App Check enforced
- [ ] README: features, architecture, how Firebase AI Logic is used, what was built in the period, attribution

## Stage 5: submission — Sun Nov 29 night to Mon Nov 30 morning

- [ ] Demo video (3 minutes or less) on YouTube, English, Chrome footage, offline segment
- [ ] Devpost text: how AI Logic is used, features, value proposition
- [ ] Public repo with license visible, testing link, testing instructions
- [ ] Submit before Mon Nov 30, 2:00 PM PST

## Art and brand (fal)

- [ ] Logo for the calmer shell
- [ ] Empty-state illustrations (no documents, offline)
- [ ] Favicon and share image

## Cut list (drop in this order if time slips)

1. Art beyond the logo and two empty states
2. Version history
3. Story bible suggestions (keep manual entries)
4. Cmd+K search
5. Templates, outline board, voice profiles, continuity check, public share page (already out of scope)

## Open risks

- Gemini Nano availability and quality (checked in Stage 0)
- Small-model JSON reliability (mitigated in Stage 3)
- Scope: a rewrite in 4 days. Ship thin, then deepen. Anything unchecked after Stage 4 is cut, not rushed
- Repo and keys: an earlier session pasted API keys in chat; rotate them and keep keys out of the repo

## Log

| Date | Note |
|---|---|
| Nov 22 | Plan written. Decisions confirmed |
| Nov 26 | Firebase project `atelier-writer-app` and web app created. Chrome 158 present. Local `atelier` folder had been emptied; restored from GitHub (`ecd6467`). Plan resized from 8 days to 4. Blocked on enabling Google APIs: `gcloud` is logged in as `imisidahunsi12@gmail.com`, the Firebase CLI as `abraham.dahunsi@gmail.com` |
