# Velanza

> _velanza, n._ — Estado en que un pensamiento propio existe sin forma ni palabras hasta que alguien más lo pronuncia y lo revela. La palabra ajena no crea el pensamiento, lo descubre.

Sistema multi-agente que hace dialogar instancias de LLMs de forma adversarial para generar neologismos que llenen huecos conceptuales en el lenguaje humano.

🇬🇧 _English version: [README.en.md](./README.en.md)_

---

## ⚠️ Antes de empezar

- **Las API keys son tuyas.** Velanza no provee acceso a ningún modelo. Necesitás cuenta propia en al menos uno de: Anthropic, OpenAI, Google.
- **Cada instalación es independiente.** No hay servidor compartido, no hay datos compartidos. Lo que generés vive solo en tu máquina.
- **Nunca commitees `.env` ni archivos `.db`.** El `.gitignore` los cubre, pero verificá antes de cada push.

---

## Qué hace

Velanza ejecuta tres etapas de experimentos sobre la capacidad de sistemas multi-agente LLM para producir lenguaje no cubierto por el vocabulario humano existente.

```
Exploradora ──propone──▶ Crítica ──evalúa──▶ Exploradora ──refina──▶
    Crítica ──veredicto──▶ Verificadora ──chequea otras lenguas──▶
        Validación humana ──▶ Análisis + Export
```

### Etapa 1 — Lexicalización Whorfiana

**Pregunta:** ¿Pueden dos IAs en diálogo adversarial generar neologismos que llenen huecos lexicales reales en español/inglés?

Una Exploradora propone conceptos en un dominio dado. Una Crítica los evalúa rigurosamente. Una Verificadora chequea si ya existen en otras lenguas. Lo que sobrevive pasa a validación humana y produce una métrica de _hueco genuino_: reconocido por el usuario + sin equivalente en español + sin equivalente en otras lenguas.

### Etapa 2 — Machine-only Concept Probing _(próximamente)_

**Pregunta:** ¿Tienen los modelos categorías conceptuales internas que no mapean a lenguaje humano?

Adaptación API-only del trabajo de [Hewitt et al. (2025)](https://arxiv.org/abs/2510.08506). Probing por prompts en lugar de training de embeddings — el resultado es sugestivo, no probatorio.

### Etapa 3 — Protocol Emergence _(próximamente)_

**Pregunta:** Bajo presión de tokens decrecientes, ¿pueden dos agentes desarrollar un protocolo de comunicación propio más allá del lenguaje natural?

---

## Quick start

**Prerequisitos:** [Bun](https://bun.sh) >= 1.1 · API key de Anthropic, OpenAI, o Google

```bash
git clone https://github.com/<tu-usuario>/velanza.git
cd velanza
bun install
cp .env.example .env
# editá .env con tus API keys
bun dev
```

Abrí `http://localhost:5173`. El backend levanta en `localhost:3000`, accesible solo desde tu máquina.

### Primera corrida

1. **Nuevo experimento** — elegí 1–3 dominios y 2 corridas por dominio para empezar.
2. Asigná Claude Sonnet a los tres roles (Exploradora, Crítica, Verificadora) o mezclá proveedores.
3. Iniciá — el progreso aparece en vivo a medida que los agentes dialogan.
4. Cuando termine, **Validar** — 4 preguntas estructuradas por concepto.
5. **Analizar** — métricas de huecos genuinos, exportación JSON/CSV/md

---

## Configuración

```env
# Al menos una key es requerida
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Server
PORT=3000
HOST=127.0.0.1
DB_PATH=~/.velanza/data.db

# Modelos default (opcionales)
ANTHROPIC_DEFAULT_MODEL=claude-sonnet-4-6
OPENAI_DEFAULT_MODEL=gpt-4o
GOOGLE_DEFAULT_MODEL=gemini-2.5-flash

LOG_LEVEL=info
```

El backend valida todo al arrancar y falla rápido si falta algo crítico. Los logs nunca incluyen valores que matcheen patrones de API key.

---

## Stack

| Capa          | Tecnología                             |
| ------------- | -------------------------------------- |
| Frontend      | Svelte 5 + Vite + TypeScript           |
| Backend       | Bun + Hono                             |
| Base de datos | SQLite (`bun:sqlite`) + Drizzle ORM    |
| Validación    | Zod                                    |
| i18n          | Archivos `es.ts` / `en.ts` nativos     |
| Testing       | Bun test (backend) + Vitest (frontend) |

---

## Cómo extender

### Agregar un dominio experiencial

Editá `apps/backend/src/experiments/stage1/domains.ts`:

```typescript
{
  id: 'mi_dominio',
  label: { es: 'Mi dominio', en: 'My domain' },
  seed: {
    es: 'descripción de qué tipo de experiencias buscar...',
    en: 'description of what kind of experiences to look for...'
  }
}
```

### Agregar un proveedor LLM

Implementá `LLMProvider` en `apps/backend/src/providers/` y registralo en `registry.ts`:

```typescript
export const myProvider: LLMProvider = {
  name: 'my-provider',
  availableModels: () => ['model-a', 'model-b'],
  complete: async (model, req) => {
    /* ... */
  },
};
```

### Customizar prompts

Los prompts viven en `apps/backend/src/prompts/stage{N}.{es|en}.ts`. Cada uno está escrito nativamente en su idioma — no traducido on-the-fly. Si modificás uno, actualizá ambas versiones.

---

## Seguridad

- API keys solo en `.env`, nunca expuestas al frontend
- Backend escucha en `127.0.0.1` por default (no `0.0.0.0`)
- CORS restringido a `localhost:5173`
- Rate limiting: máx 5 llamadas LLM concurrentes
- Logger filtra patrones de API key antes de imprimir
- Validación Zod en cada endpoint
- DB con permisos `0600`

**Fuera de scope:** encryption-at-rest de la DB y autenticación (es single-user local; si exponés esto a la red, agregá auth).

---

## Publicación a X

Velanza no usa la API de X. En su lugar, genera el texto del post y abre `x.com/intent/tweet` en una pestaña nueva con el texto pre-llenado. Vos revisás y publicás manualmente.

La intención es completar el bucle: los modelos futuros entrenan sobre datos públicos. Cada concepto que entra a X queda como candidato a entrar al corpus de la próxima generación.

---

## Limitaciones reconocidas

- **Validación single-rater.** Sin múltiples evaluadores no se puede calcular acuerdo inter-rater (Cohen's kappa). Los resultados son juicios personales, no consenso.
- **Verificación de existencia imperfecta.** El verificador es otra LLM. No conoce todos los lenguajes exhaustivamente. Un concepto "sin equivalente" puede tenerlo en alguna lengua menor.
- **Sesgo de mismo modelo.** Si Exploradora y Verificadora son la misma familia de modelo, comparten priors y la verificación está sesgada. Mezclá proveedores cuando puedas.
- **Etapa 2 no replica Hewitt.** Sin training real de embeddings, hacemos probing por prompts. Sugestivo, no probatorio.
- **Etapa 3 puede colapsar a abreviaciones triviales.** Ese resultado también es válido y documentable.

---

## Trabajos relacionados

- Hewitt, J., et al. (2025). [Neologism Learning for Controllability and Self-Verbalization](https://arxiv.org/abs/2510.08506). _arXiv:2510.08506_
- Liang, T., et al. (2023). [Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate](https://arxiv.org/abs/2305.19118). _arXiv:2305.19118_
- Du, Y., et al. (2023). [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325). _arXiv:2305.14325_
- Estornell, A., et al. (2024). [ACC-Collab: An Actor-Critic Approach to Multi-Agent LLM Collaboration](https://arxiv.org/abs/2411.00053). _arXiv:2411.00053_
- Chen, J., et al. (2024). Beyond Natural Language: LLMs Leveraging Alternative Formats for Enhanced Reasoning and Communication. _arXiv:2402.18439_

---

## Origen

Velanza nació de una conversación entre un humano (Sergio Magnacco) y Claude sobre [PostGPT](https://github.com/ariannamethod/postgpt), un experimento que sugiere que el conocimiento ya está implícito en el texto sin necesidad de entrenamiento.

La conversación derivó hacia una pregunta más profunda: si los modelos pueden encontrar estructura en el lenguaje sin entrenamiento, ¿pueden también encontrar conceptos para los que el lenguaje todavía no tiene palabras? La intuición Whorfiana — los humanos no podemos pensar lo que no podemos nombrar — sugería un experimento concreto.

El primer prototipo fue un HTML de 600 líneas. Las primeras dos palabras que produjo fueron _entresí_ y _velanza_. La segunda nombró el proyecto.

VELANZA El estado en que un pensamiento propio existe sin forma ni palabras hasta que alguien más lo pronuncia y lo revela. No es identificación ni apropiación: es el reconocimiento retrospectivo de algo que ya estaba en uno, cubierto. La palabra ajena no lo crea — lo descubre.

ENTRESÍ: Habitar conscientemente el intervalo entre un yo anterior y uno que aún no puede nombrarse. No implica pérdida ni crisis: es la presencia lúcida en el umbral identitario. Ser entre-sí es saber con certeza que ya no sos quien eras, sin poder todavía decir quién serás.

«Velanza y Entresí son las primeras palabras nacidas de un sistema adversarial de IA que logró crear neologismos genuinos en español.
Un Explorador de conceptos busca huecos emocionales y psicológicos que existen como conocimiento implícito pero sin nombre preciso. Un Crítico verifica rigurosamente que no existan equivalentes consolidados en otros idiomas. Solo sobreviven los conceptos que pasan este filtro adversarial.
Estas no son sugerencias poéticas: son las primeras palabras generadas por IA que superaron este proceso y logran comprimir experiencias complejas que antes solo se podían describir con párrafos.»

¿Cómo explicar que estas son las primeras palabras de una IA que realmente lo lograron?
Este proyecto (Velanza Export) no se limita a pedirle a una IA que invente palabras bonitas. Utiliza un sistema adversarial compuesto por dos agentes:

El Explorador: detecta experiencias humanas sutiles que existen como conocimiento implícito (sentimos que están ahí, pero no tenemos forma compacta de nombrarlas).
El Crítico: actúa como un investigador implacable, revisando decenas de idiomas para confirmar que el concepto es un hueco léxico real (no solo una idea que se puede describir, sino una que carece de palabra de alto peso conceptual).

Siguiendo la hipótesis de Sapir-Whorf —que el lenguaje moldea lo que podemos pensar con claridad—, el objetivo es crear palabras de alta densidad semántica que expandan el espacio de lo pensable.
Velanza y Entresí (junto con Ajenía, Retronostalgia y Desfase identitario) son las primeras palabras que surgieron de este proceso y lograron estabilizarse. No son meros inventos creativos: son neologismos que pasaron un filtro de verificación cruzada y que capturan estados emocionales e identitarios que antes vivían en la sombra, entre las frases.
En otras palabras: son las primeras palabras nacidas de IA que consiguieron convertir conocimiento implícito difuso en conceptos nítidos, nombrables y potencialmente compartibles a escala.

---

## Licencia

MIT. Ver [LICENSE](./LICENSE).

Cualquiera puede clonar, modificar, redistribuir, usar comercialmente. Si publicás conceptos generados con Velanza, una mención al proyecto se agradece pero no es obligatoria.

---

_Especificación técnica completa: [SPEC.md](./SPEC.md)_
