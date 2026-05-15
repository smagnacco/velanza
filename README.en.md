# Velanza

> _velanza, n._ — The state in which one's own thought exists without form or words until someone else speaks it and reveals it. The other's word does not create the thought; it discovers it.

A multi-agent system that pits LLM instances against each other in adversarial dialogue to generate neologisms that fill conceptual gaps in human language.

🇦🇷 _Spanish version: [README.md](./README.md)_

---

## ⚠️ Before you start

- **The API keys are yours.** Velanza does not provide access to any model. You need your own account with at least one of: Anthropic, OpenAI, Google.
- **Each installation is independent.** There is no shared server, no shared data. What you generate lives only on your machine.
- **Never commit `.env` or `.db` files.** The `.gitignore` covers them, but verify before each push.

---

## What it does

Velanza runs three stages of experiments on the capacity of multi-agent LLM systems to produce language not covered by existing human vocabulary.

```
Explorer ──proposes──▶ Critic ──evaluates──▶ Explorer ──refines──▶
    Critic ──verdict──▶ Verifier ──checks other languages──▶
        Human validation ──▶ Analysis + Export
```

### Stage 1 — Whorfian Lexicalization

**Question:** Can two AIs in adversarial dialogue generate neologisms that fill real lexical gaps in Spanish/English?

An Explorer proposes concepts in a given domain. A Critic evaluates them rigorously. A Verifier checks whether they already exist in other languages. What survives goes to human validation and produces a _genuine gap_ metric: recognized by the user + no equivalent in Spanish + no equivalent in other known languages.

### Stage 2 — Machine-only Concept Probing _(coming soon)_

**Question:** Do models have internal conceptual categories that don't map to human language?

API-only adaptation of [Hewitt et al. (2025)](https://arxiv.org/abs/2510.08506). Prompt-based probing instead of embedding training — results are suggestive, not probative.

### Stage 3 — Protocol Emergence _(coming soon)_

**Question:** Under decreasing token pressure, can two agents develop their own communication protocol beyond natural language?

---

## Quick start

**Prerequisites:** [Bun](https://bun.sh) >= 1.1 · API key from Anthropic, OpenAI, or Google

```bash
git clone https://github.com/<your-username>/velanza.git
cd velanza
bun install
cp .env.example .env
# edit .env with your API keys
bun dev
```

Open `http://localhost:5173`. The backend runs on `localhost:3000`, accessible only from your machine.

### First run

1. **New experiment** — pick 1–3 domains and 2 runs per domain to start.
2. Assign Claude Sonnet to all three roles (Explorer, Critic, Verifier) or mix providers.
3. Start — progress appears live as the agents dialogue.
4. When done, **Validate** — 4 structured questions per concept.
5. **Analyze** — genuine gap metrics, JSON/CSV export.

---

## Configuration

```env
# At least one key is required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Server
PORT=3000
HOST=127.0.0.1
DB_PATH=~/.velanza/data.db

# Default models (optional overrides)
ANTHROPIC_DEFAULT_MODEL=claude-sonnet-4-6
OPENAI_DEFAULT_MODEL=gpt-4o
GOOGLE_DEFAULT_MODEL=gemini-2.5-flash

LOG_LEVEL=info
```

The backend validates everything at startup and fails fast if something critical is missing. Logs never include values matching API key patterns.

---

## Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Frontend   | Svelte 5 + Vite + TypeScript           |
| Backend    | Bun + Hono                             |
| Database   | SQLite (`bun:sqlite`) + Drizzle ORM    |
| Validation | Zod                                    |
| i18n       | Native `es.ts` / `en.ts` files         |
| Testing    | Bun test (backend) + Vitest (frontend) |

---

## How to extend

### Add an experiential domain

Edit `apps/backend/src/experiments/stage1/domains.ts`:

```typescript
{
  id: 'my_domain',
  label: { es: 'Mi dominio', en: 'My domain' },
  seed: {
    es: 'descripción de qué tipo de experiencias buscar...',
    en: 'description of what kind of experiences to look for...'
  }
}
```

### Add an LLM provider

Implement `LLMProvider` in `apps/backend/src/providers/` and register it in `registry.ts`:

```typescript
export const myProvider: LLMProvider = {
  name: 'my-provider',
  availableModels: () => ['model-a', 'model-b'],
  complete: async (model, req) => {
    /* ... */
  },
};
```

### Customize prompts

Prompts live in `apps/backend/src/prompts/stage{N}.{es|en}.ts`. Each is written natively in its language — not translated on-the-fly. If you modify one, update both versions.

---

## Security

- API keys only in `.env`, never exposed to the frontend
- Backend listens on `127.0.0.1` by default (not `0.0.0.0`)
- CORS restricted to `localhost:5173`
- Rate limiting: max 5 concurrent LLM calls
- Logger filters API key patterns before printing
- Zod validation on every endpoint
- DB with `0600` permissions

**Out of scope:** encryption-at-rest for the DB and authentication (it's single-user local; if you expose this to a network, add auth yourself).

---

## Publishing to X

Velanza does not use the X API. Instead, it generates the post text and opens `x.com/intent/tweet` in a new tab with the text pre-filled. You review and publish manually.

The intent is to close the loop: future models train on public data. Every concept that reaches X becomes a candidate for entering the next generation's corpus.

---

## Known limitations

- **Single-rater validation.** Without multiple evaluators, inter-rater agreement (Cohen's kappa) cannot be calculated. Results are personal judgments, not consensus.
- **Imperfect existence verification.** The verifier is another LLM. It doesn't know all languages exhaustively. A concept marked "no equivalent" may have one in a lesser-known language.
- **Same-model bias.** If Explorer and Verifier are from the same model family, they share priors and verification is biased. Mix providers when you can.
- **Stage 2 does not replicate Hewitt.** Without real embedding training, we do prompt-based probing. Suggestive, not probative.
- **Stage 3 may collapse to trivial abbreviations.** That result is also valid and documentable.

---

## Related work

- Hewitt, J., et al. (2025). [Neologism Learning for Controllability and Self-Verbalization](https://arxiv.org/abs/2510.08506). _arXiv:2510.08506_
- Liang, T., et al. (2023). [Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate](https://arxiv.org/abs/2305.19118). _arXiv:2305.19118_
- Du, Y., et al. (2023). [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325). _arXiv:2305.14325_
- Estornell, A., et al. (2024). [ACC-Collab: An Actor-Critic Approach to Multi-Agent LLM Collaboration](https://arxiv.org/abs/2411.00053). _arXiv:2411.00053_
- Chen, J., et al. (2024). Beyond Natural Language: LLMs Leveraging Alternative Formats for Enhanced Reasoning and Communication. _arXiv:2402.18439_

---

## Origin

Velanza grew out of a conversation between a human (Sergio Magnacco) and Claude about [PostGPT](https://github.com/ariannamethod/postgpt), an experiment suggesting that knowledge is already implicit in text without needing training.

The conversation drifted toward a deeper question: if models can find structure in language without training, can they also find concepts for which language has no words yet? The Whorfian intuition — humans cannot think what they cannot name — suggested a concrete experiment.

The first prototype was a 600-line HTML file. The first two words it produced were _entresí_ and _velanza_. The second named the project.

VELANZA
Definition:
The state in which a thought or feeling of your own exists without clear shape or words until someone else articulates it aloud and reveals it. It is not identification or appropriation: it is the retrospective recognition of something that was already inside you, veiled. The other person’s words do not create it — they uncover it.

ENTRESÍ
Definition:
To consciously inhabit the interval between a previous self and one that cannot yet be named. It does not imply loss or crisis: it is a lucid presence at the threshold of identity. To be entresí is to know with certainty that you are no longer who you were, while still being unable to say who you are becoming.

Suggested English adaptations (for easier use):

Velanza → Could remain Velanza (it has a nice ring in English too) or be adapted as "Revelance" (if you want a more English-sounding version).
Entresí → Could remain Entresí or be rendered as "Betweenself" or "Inbetweenness" (though Entresí preserves the poetic quality better).

"Velanza and Entresí are among the first words born from an adversarial AI system that successfully created genuine neologisms in Spanish.
An Explorer agent hunts for emotional and psychological gaps — experiences that exist as implicit knowledge but lack a precise name. A Critic agent rigorously verifies that no established equivalent exists in other major languages. Only concepts that survive this adversarial process are stabilized.
These are not just poetic suggestions. They are the first words generated by AI that passed this strict filter and successfully compress complex inner experiences that previously could only be described with long paragraphs."

---

## License

MIT. See [LICENSE](./LICENSE).

Anyone can clone, modify, redistribute, and use commercially. If you publish concepts generated with Velanza, a mention of the project is a must.

---

_Full technical specification: [SPEC.md](./SPEC.md)_
