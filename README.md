# Atelier — a playful writing canvas

Atelier is a warm, colorful editorial reskin of [Spaceship IDE](https://github.com/chuanqisun/spaceship), retaining the original real-time text interaction engine.

## Run locally

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Use `npm run build` to build the static app, and `npm run preview` to inspect the build.

## Controls

- Drag the pink main handle to reveal words, or rewind to regenerate a different future.
- Double-click the main handle to open or close attention highlights.
- Double-click and hold to create a future-steering control using the original radial fan.
- Select text to create or move attention highlights.
- Use **sim** to experiment without API keys; **flight** uses the original Cerebras and Gemini integrations.

## What is and is not included

This is **phase 1: a visual reskin**, not the proposed ELSEWISE product. The existing text generation, attention, future steering, speculative buffering, audio and realization tracking remain unchanged.

**Hackathon eligibility:** This version does **not** integrate the OpenClaw harness or Kimi K3.1 Pro, and therefore does not meet the Cerebras × Kimi hackathon eligibility requirements on its own. Existing flight mode calls Cerebras GPT-OSS-120B and Gemini.

## Deployment

The Vite build uses relative asset URLs, suitable for a project subpath such as GitHub Pages and for typical static hosts. The deployment workflow is configured for the `main` branch; GitHub Pages must be enabled in repository settings to publish.

## Origin and license

Built on [Spaceship IDE by Chuanqi Sun](https://github.com/chuanqisun/spaceship). The underlying code is distributed under the MIT License; see the complete retained [LICENSE](LICENSE) with the original copyright notice.

The visual styling and Atelier branding are the customizations in this repository. Development of ELSEWISE is deferred to a separate phase.
