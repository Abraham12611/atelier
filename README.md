# Atelier

A real-time writing canvas where you steer an AI story with your hand instead of a prompt box.

Language models are fast enough now that text can be generated ahead of you and thrown away without cost. Atelier is built around that idea. Drag the ball forward and words appear; drag it back and they vanish. Everything past the ball is already written, so the story keeps up with your hand, and scrubbing never waits on the network.

**Live demo:** https://atelier-three-sigma.vercel.app

## Features

### Light the spark
A story starts from you. Write an idea in your own words, stir in up to three ingredients (Mystery, Wonder, Eerie, Heartbreak...), or press "Surprise me". The model writes from that premise, and the opening flows in under the ball.

### Realtime scrubbing and re-generation
The ball is a scrubber over a rolling buffer of about 300 generated words. Moving it only changes what is revealed, so it responds instantly. Drag back past a word and the text after it is discarded; rest the ball and a fresh continuation streams in. When generation is cheap and fast, you can explore alternative futures just by scrubbing.

### Focus monitor
The rail beside the text shows how strongly each line connects to what is being written right now, as a ten-step meter per line, and ranks each locked phrase by its relevance to the sentence at the ball. It makes visible what the model is paying attention to, and points your own attention at what matters.

### Attention lock
Double-click the ball and the model picks the phrases the next words depend on most. Each gets a lock. Move a lock to another word, select any text to add your own, or click a lock to let it go. Locked phrases bias the next passage, so the story keeps them in mind.

### Future vector steering
Double-click and hold the ball to open the steering wheel, a radial menu with sub-menus. The wedges are dimensions the model proposes for this story at this moment (tone, pace, tension, focus, mode, resolution...), so they are contextual rather than a fixed list. Carry a knob through the gate to choose one. Its sub-menu is the outer ring: segments for a choice, a continuous track for a scale. Distance from the ball sets how strongly the dimension applies. Several knobs combine, and each is tuned independently.

### Realization check
As the text arrives, a scorer reads each new sentence against each steering knob. When a sentence clearly delivers a knob's setting, the knob pins beside it in the margin, so you can see which sentence realized which vector.


## Run it

```bash
npm install
# put your inference API key in .env.local (git-ignored); see api/llm.js for the variable names
npm run dev
npm run build
```

`?sim=true` plays an offline simulator instead of the models.


