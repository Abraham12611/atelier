# Atelier

A dark, playful writing canvas where you steer an AI story in real time. Drag the ball forward and the story appears word by word; drag it back and it vanishes. Built on [Spaceship](https://github.com/chuanqisun/spaceship) by chuanqisun (MIT). The streaming, attention, steering and realization engine is upstream's; Atelier is a new skin, a new way to begin, and a radial steering wheel.

## What is different from Spaceship

- **Light the spark.** A story starts from you: write an idea and stir in up to three ingredients (Mystery, Wonder, Eerie...), or press "Surprise me". The model writes from that premise and the ink flows in under the ball.
- **Steering wheel.** Double-click and hold the ball to open a half-wheel radial menu. Each wedge is a dimension the model proposes for *this* story (tone, pace, tension, focus, mode...) with its own illustration and colour. Carry the knob through the gate to pick one; its sub-menu is the outer ring: segments for a choice, a filling track for a scale. Distance from the ball sets strength.
- **Attention Lock.** Double-click the ball to see which phrases the next words lean on. Each gets a golden lock; click a lock to let it go, drag a box to move it, select text to add one.
- **Focus Monitor.** The rail beside the text shows, per line, how strongly it connects to the focus, and ranks each locked keyword by relevance.
- **Art.** Logo, steering icons and mascot were generated with fal (Recraft V4.1 Pro Vector for vectors; GPT Image 2.6 Sunburst for the mascot and the ball). They live in `public/art`.

## Run it

```bash
npm install
# put your key in .env.local (git-ignored):  OPENROUTER_API_KEY=...
npm run dev      # http://localhost:5199
npm run build
```

`?sim=true` plays the offline simulator (lorem ipsum) instead of the models.

## Temporary: OpenRouter test backend

While the Cerebras integration is pending, text comes from a cheap OpenRouter model (`google/gemini-2.5-flash-lite`, override with `OPENROUTER_MODEL`) through a same-origin proxy, `api/llm.js`, so the key stays on the server (`OPENROUTER_API_KEY`). The yes/no and score questions that upstream sends to Gemini's decisions API are answered by the same model as JSON.

**To remove OpenRouter when Cerebras lands:**

1. In `src/llm/provider.ts`, re-export from `./cerebras.ts` and `./decisions.ts` instead of `./openrouter.ts`.
2. Delete `src/llm/openrouter.ts` and `api/llm.js`.
3. In `vite.config.ts`, delete the `dev-llm-proxy` plugin and the `loadEnv` line.
4. Remove `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` from the Vercel project and `.env.local`, and rotate the key.
5. Delete the "Temporary" section above.

## License

Derived from Spaceship (MIT). The upstream `LICENSE` and copyright notice are kept in this repository.
