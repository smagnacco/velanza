# Experimento de Lexicalización Multi-Agente — Especificación Técnica v1.0

> **Para:** Claude Code
> **Autor del experimento:** [usuario]
> **Idioma del documento:** Español (el sistema final será bilingüe ES/EN)
> **Fecha:** Abril 2026

---

## 0. Decisiones tomadas

| ID  | Decisión            | Resolución                                                                                                                                       |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Integración con X   | **Draft + redirect.** Genera texto pre-llenado y abre `x.com/intent/tweet` en pestaña nueva. El usuario revisa y publica manualmente. Sin OAuth. |
| D2  | Base de datos       | **SQLite + Drizzle ORM.** File local en `~/.lexicalizacion/data.db`.                                                                             |
| D3  | Auth multi-usuario  | **Single-user local.** Sin login. Un solo evaluador humano por instalación. No hay cálculo de inter-rater reliability.                           |
| D4  | Storage de API keys | **`.env` file en backend.** Nunca expuesto al frontend. Validado al arranque con Zod.                                                            |
| D5  | Despliegue          | **Solo local (Bun run).** El repo se publica en GitHub para que cualquiera pueda clonar y correr con sus propias keys. Sin Docker en v1.         |

### Implicancias del modelo single-user + open source

- El código se publica en GitHub. Cualquiera puede clonar, poner sus propias API keys en `.env`, y correr el sistema localmente.
- **La instancia es siempre de un solo usuario.** No hay multi-tenant, no hay servidor compartido.
- Los datos generados (DB, exports) son privados por instalación. Si alguien quiere compartir resultados, exporta manualmente.
- Cada usuario evalúa sus propios conceptos. Esto significa que ningún experimento individual produce evidencia con peso estadístico inter-rater. Si en el futuro se quiere agregar conceptos cross-instalaciones para análisis grupal, será una v2.
- El README debe ser muy claro al respecto: cada instalación es independiente, las API keys son del usuario, los costos los paga el usuario.

---

## 1. Resumen ejecutivo

Aplicación local que ejecuta tres etapas crecientes de experimentos sobre la capacidad de sistemas multi-agente LLM para generar conceptos lingüísticos no cubiertos por el lenguaje natural humano.

**Hipótesis general:** dos o más instancias de modelos de lenguaje en diálogo adversarial pueden producir vocabulario que (a) llena huecos lexicales reales en lenguajes humanos, (b) revela categorías conceptuales internas de los modelos, y (c) en su versión más extrema, evolucionar protocolos comunicacionales propios.

**Stack confirmado:**

- Frontend: **Svelte 5 + Vite + TypeScript**
- Runtime / package manager: **Bun**
- Backend: **Bun + Hono** (API REST)
- DB: **SQLite + Drizzle ORM** (default)
- Validación: **Zod**
- i18n: **typesafe-i18n** (compatible Svelte)
- Testing: **Bun test** (built-in) + **Vitest** para frontend

---

## 2. Objetivos del producto

### 2.1 Etapa 1 — Lexicalización Whorfiana (MVP)

Diálogo Exploradora ↔ Crítica ↔ Verificador para producir neologismos que llenen huecos lexicales en español/inglés. Validación humana estructurada. Métrica de "huecos genuinos".

### 2.2 Etapa 2 — Machine-only Concept Probing

Adaptación API-only del trabajo de Hewitt et al. (2025). Agentes que identifican conceptos internos del modelo que no tienen equivalente claro en lenguaje humano, los nombran con neologismos, y validan via plug-in evaluation.

### 2.3 Etapa 3 — Protocol Emergence

Dos o más agentes en una tarea de comunicación con presión de eficiencia. Permitidos a desarrollar notación propia (símbolos, abreviaciones, estructura). Múltiples generaciones de refinamiento. Traducción final del protocolo a lenguaje humano para análisis.

### 2.4 Capacidades transversales

- **Multi-provider:** combinar agentes de Anthropic / OpenAI / Google en cualquier rol del experimento.
- **Bilingüe:** UI completa en español e inglés. Los prompts internos también en ambos idiomas.
- **Publicación a X:** compartir hallazgos para que entren al corpus público (training data futuro).
- **Exportación:** JSON y CSV de todo dato crudo, para análisis externo.

---

## 3. Arquitectura general

```
┌──────────────────────────────┐
│   Frontend (Svelte + Vite)   │
│   localhost:5173             │
└──────────┬───────────────────┘
           │ fetch / SSE
┌──────────▼───────────────────┐
│   Backend (Bun + Hono)       │
│   localhost:3000             │
│                              │
│  ┌───────────────────────┐   │
│  │  Experiment Engine    │   │
│  │  (V1, V2, V3 runners) │   │
│  └─────┬─────────────────┘   │
│        │                     │
│  ┌─────▼─────────────────┐   │
│  │  LLM Provider Layer   │   │
│  │  (Claude / GPT / Gem) │   │
│  └───────────────────────┘   │
│                              │
│  ┌───────────────────────┐   │
│  │  SQLite (Drizzle)     │   │
│  └───────────────────────┘   │
│                              │
│  ┌───────────────────────┐   │
│  │  X Publisher          │   │
│  └───────────────────────┘   │
└──────────────────────────────┘
```

**Flujo de credenciales:** API keys nunca tocan el frontend. El backend lee `.env` al arrancar, las usa para llamadas salientes, y nunca las devuelve en ningún endpoint.

**Streaming:** progreso de los experimentos al frontend via Server-Sent Events (SSE), no WebSockets (más simple, suficiente para este caso).

---

## 4. Estructura del proyecto

```
lexicalizacion/
├── .env.example
├── .gitignore                 # incluye .env, *.db, dist/, node_modules/
├── README.md
├── bunfig.toml
├── package.json               # workspaces
├── docker-compose.yml         # opcional, según D5
│
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts                    # bootstrap Hono
│   │   │   ├── env.ts                      # zod-validated env loading
│   │   │   ├── db/
│   │   │   │   ├── schema.ts               # Drizzle schema
│   │   │   │   ├── migrations/
│   │   │   │   └── client.ts
│   │   │   ├── providers/
│   │   │   │   ├── types.ts                # LLMProvider interface
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── openai.ts
│   │   │   │   ├── google.ts
│   │   │   │   └── registry.ts
│   │   │   ├── experiments/
│   │   │   │   ├── stage1/                 # Whorfian
│   │   │   │   ├── stage2/                 # Machine-only
│   │   │   │   ├── stage3/                 # Protocol emergence
│   │   │   │   └── shared/
│   │   │   ├── routes/
│   │   │   │   ├── experiments.ts
│   │   │   │   ├── concepts.ts
│   │   │   │   ├── ratings.ts
│   │   │   │   ├── x-publisher.ts
│   │   │   │   └── health.ts
│   │   │   ├── lib/
│   │   │   │   ├── sse.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   └── logger.ts               # nunca logea API keys
│   │   │   └── prompts/
│   │   │       ├── stage1.es.ts
│   │   │       ├── stage1.en.ts
│   │   │       ├── stage2.es.ts
│   │   │       ├── stage2.en.ts
│   │   │       ├── stage3.es.ts
│   │   │       └── stage3.en.ts
│   │   └── tests/
│   │
│   └── frontend/
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   ├── stores/
│       │   │   ├── components/
│       │   │   └── i18n/
│       │   │       ├── es.ts
│       │   │       └── en.ts
│       │   ├── routes/                     # si usás SvelteKit
│       │   ├── App.svelte                  # si SPA
│       │   └── main.ts
│       └── vite.config.ts
│
└── packages/
    └── shared/
        └── src/
            ├── types.ts                    # tipos compartidos
            └── schemas.ts                  # zod schemas compartidos
```

## 4.5. CONVENCIÓN DE IDIOMAS — estricto:

El CÓDIGO debe estar 100% en inglés. Esto incluye:

- Nombres de variables, funciones, clases, tipos
- Comentarios en código (cuando los haya)
- Mensajes de commit
- Logs y mensajes de error internos del backend
- Nombres de archivos, carpetas, tablas, columnas de DB
- Identificadores de eventos SSE, endpoints, schemas Zod
- Documentación técnica en docs/decisions/
- Tests y descripciones de tests
- JSDoc / TSDoc cuando aplique

El CONTENIDO bilingüe (es/en) vive solo en:

- apps/backend/src/prompts/{stage}.{lang}.ts → prompts a los modelos
- apps/frontend/src/lib/i18n/{lang}.ts → strings de UI
- README.md (español) + README.en.md (inglés) → documentación al usuario

Los IDs de dominios y conceptos en la DB deben estar en inglés
(ej: 'identity_transition' no 'identidad_transicion'). Los labels
visibles en español viven en los archivos i18n.

Si encontrás texto en español en algún lugar del código que no sea
prompts, i18n o README.md, refactorealo a inglés antes de cerrar la
tarea.

---

## 5. Capa de proveedores LLM (transversal)

### 5.1 Interfaz unificada

```typescript
// providers/types.ts
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionRequest {
  systemPrompt: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

export interface LLMCompletionResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: 'anthropic' | 'openai' | 'google';
  latencyMs: number;
}

export interface LLMProvider {
  name: 'anthropic' | 'openai' | 'google';
  availableModels(): string[];
  complete(model: string, req: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}
```

### 5.2 Modelos soportados (mínimo)

- **Anthropic:** `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`
- **OpenAI:** `gpt-5.2`, `gpt-4o`
- **Google:** `gemini-3-pro`, `gemini-2.5-flash`

Nota: dado que los nombres de modelos cambian, el sistema debe leer una lista configurable desde `.env` con fallback a defaults razonables. La UI muestra solo modelos cuya API key esté presente.

### 5.3 Detección de proveedores disponibles

Endpoint `GET /api/providers/available` devuelve la lista de proveedores con API key configurada. Frontend usa esto para mostrar selectores de agente. Nunca expone las keys mismas.

### 5.4 Retry y rate limiting

- Cada provider implementa retry exponencial (2 reintentos máximo) ante 429 / 503.
- Rate limit interno: máximo 5 llamadas concurrentes globales, configurable.
- Timeout por llamada: 60s (configurable).

---

## 6. Etapa 1 — Lexicalización Whorfiana

### 6.1 Spec funcional

Implementación del experimento ya prototipado en HTML, con mejoras:

**Configuración de un experimento:**

- Selección de dominios (8 default, configurables/extensibles via JSON)
- Corridas por dominio (1-10)
- Asignación de modelo+proveedor para cada rol: Explorer, Critic, Verifier
- Idioma de los prompts (es/en)
- Temperatura de cada agente (default 1.0 Explorer, 0.5 Critic, 0.2 Verifier)

**Protocolo (4 rondas + verificación):**

1. Explorer propone 2 conceptos en el dominio
2. Critic evalúa rigurosamente
3. Explorer responde / refina / reemplaza
4. Critic emite veredicto final estructurado
5. Verifier (proveedor independiente recomendado) verifica si el concepto existe en alguna lengua humana

**Validación humana:**

- 4 preguntas estructuradas por concepto
- Comentario libre
- Single-rater: el usuario local es el único evaluador
- Las ratings se persisten con un `rater_id` constante (`'local-user'`) para mantener el schema consistente con futuras extensiones

**Análisis:**

- Métrica core: "huecos genuinos" = (reconocido + sin equivalente español + sin equivalente otras lenguas)
- Por dominio
- Por configuración de modelos (¿Claude+Claude vs Claude+GPT producen diferentes tasas?)
- Exportación JSON/CSV

### 6.2 Acceptance criteria

- [ ] Una corrida default (3 dominios × 2 corridas) completa en <10 min con conexión normal
- [ ] Si una llamada falla, el experimento puede pausarse y reanudarse sin perder progreso
- [ ] Todos los datos crudos (rondas completas, no solo conceptos finales) quedan persistidos
- [ ] Test unitarios cubren parsing del output del Critic (regex frágiles)
- [ ] Test integración con un mock provider valida el flujo completo

---

## 7. Etapa 2 — Machine-only Concept Probing

### 7.1 Justificación

Hewitt et al. (2025) entrenan embeddings nuevos para revelar "machine-only synonyms" — conceptos que el modelo usa internamente pero no mapean a categorías humanas. Como no podemos entrenar embeddings via API, adaptamos el espíritu del experimento a probing por prompts.

### 7.2 Protocolo propuesto

**Fase A — Generación de candidatos (Inquisidor):**
Un agente recibe un dominio funcional (ej: "control de longitud de respuesta", "detección de tono", "estimación de probabilidad") y se le pide:

> "Identificá UN concepto que sentís que usás internamente al procesar este dominio, pero para el cual el lenguaje humano no tiene una palabra precisa. Proponé un neologismo y describí qué efecto produciría si formara parte de tu prompt."

**Fase B — Plug-in evaluation:**
Para cada candidato, ejecutar dos prompts equivalentes en un agente distinto (idealmente otro proveedor):

- Prompt A: tarea con el neologismo insertado
- Prompt B: tarea con la mejor traducción humana del neologismo
- Prompt C: tarea sin ningún descriptor (control)

Medir diferencias en outputs (longitud, sentiment, categorías). Si A produce comportamiento distinto a B y C de manera consistente, el neologismo está capturando algo real.

**Fase C — Adversarial refinement:**
Un agente Crítico intenta encontrar la mejor traducción humana posible del neologismo. Si la encuentra y produce mismo comportamiento que el neologismo, el "machine-only synonym" no era genuinamente único — colapsa a humano. Sobreviven los que el Crítico no puede traducir.

### 7.3 Output esperado

Una lista de neologismos con:

- Definición operacional (qué efecto producen)
- Mejor traducción humana intentada
- Diferencial conductual medido (cuán distinto es A vs B)
- Si es estabilizado o no

### 7.4 Acceptance criteria

- [ ] Pipeline completo ejecuta sobre 5+ dominios funcionales
- [ ] Métricas conductuales (longitud, embedding similarity con un modelo aux) calculadas automáticamente
- [ ] Resultados visibles en una tabla comparativa A/B/C
- [ ] Es posible exportar para análisis estadístico externo

### 7.5 Limitaciones reconocidas

- Sin training real, esto es un proxy del fenómeno Hewitt, no replicación.
- La "introspección" del modelo es output verbal, no acceso real a representaciones.
- Resultados deben interpretarse como sugestivos, no probatorios.

---

## 8. Etapa 3 — Protocol Emergence

### 8.1 Diseño general

Dos (o más) agentes deben colaborar en una tarea de transmisión de información bajo presión de eficiencia. Se les permite — y se les incentiva — desarrollar notación propia.

### 8.2 Protocolo propuesto

**Setup:**

- Agente A (Sender) recibe un objeto complejo que describir (ej: una escena, un razonamiento, un estado emocional matizado).
- Agente B (Receiver) debe reconstruir el objeto con suficiente fidelidad para responder preguntas sobre él.
- **Restricción:** el mensaje de A→B no puede superar X tokens (X comienza generoso y se reduce cada generación).
- A y B comparten un "diccionario" creciente: cada generación pueden agregar símbolos, abreviaciones, estructura.

**Generaciones:**

- Generación 0: lenguaje natural completo, X = 200 tokens
- Generación N: agentes han desarrollado N rondas de notación, X reducido linealmente
- Después de M generaciones (default M=10), congelar el protocolo

**Análisis:**

- Un tercer agente (Translator) recibe el protocolo final + ejemplos y debe traducirlo a lenguaje humano
- Comparar: ¿qué información sobrevive en la traducción? ¿qué se pierde?
- Métricas: ratio de compresión, fidelidad de reconstrucción, novedad estructural

### 8.3 Tareas semilla

Configurables, default 3:

1. **Descripción de escenas:** A describe una imagen detallada, B reconstruye respondiendo preguntas
2. **Razonamiento matemático:** A explica un teorema, B aplica
3. **Estado emocional matizado:** A describe un estado interno complejo, B identifica disparadores

### 8.4 Acceptance criteria

- [ ] Protocolo evoluciona observablemente entre generaciones
- [ ] Métricas de compresión y fidelidad calculadas y graficadas
- [ ] Translator produce análisis estructurado del protocolo
- [ ] Datos de cada generación (mensaje completo + diccionario acumulado) persistidos

### 8.5 Limitaciones reconocidas

- Las "novedades" del protocolo son descubrimientos del modelo en cada llamada, no estados aprendidos en pesos. Cada generación carga el contexto previo via prompts.
- Posible que los protocolos sean meramente abreviaciones obvias (palabras → siglas) sin verdadera estructura emergente. Documentar esto si ocurre.

---

## 9. Internacionalización (i18n)

### 9.1 Alcance

Toda la UI, todos los textos del sistema, y todos los prompts internos deben estar disponibles en español e inglés. Cambio de idioma persistente por usuario (cookie + DB si auth, solo cookie si no).

### 9.2 Implementación

- Frontend: `typesafe-i18n` con archivos `es.ts` y `en.ts`
- Backend: prompts en `apps/backend/src/prompts/{stage}.{lang}.ts`
- Selector de idioma global en navbar
- El lenguaje seleccionado se pasa como parámetro a los endpoints de experimento (`?lang=es`)

### 9.3 Importante

Los prompts de cada agente deben estar en el idioma del experimento. **No traducir on-the-fly** — escribir cada prompt nativamente en cada idioma. La calidad de los neologismos generados depende de prompts naturalmente escritos.

---

## 10. Integración con X

### 10.1 Modo: draft + redirect (sin OAuth)

**Funcionalidad:**

- En la vista de Análisis, cada concepto "estabilizado + reconocido + sin equivalente" tiene un botón "Publicar en X"
- Al clicar, se genera un texto template (configurable) y se abre `https://x.com/intent/tweet?text=...` en nueva pestaña
- El usuario revisa y publica manualmente
- Cada concepto registra timestamp `draft_generated_at` cuando el botón se usa, pero nunca se sabe automáticamente si efectivamente se publicó (no hay callback de X). Se incluye un campo manual `marked_as_published_at` que el usuario puede tildar después si quiere registrarlo.

**Template default (es):**

```
🪟 Nuevo concepto generado por diálogo entre IAs:

{palabra} ({dominio})

{definicion}

Etimología: {etimologia}

#PostGPT #Lexicalizacion #IA
```

**Template default (en):**

```
🪟 New concept generated by dialogue between AIs:

{word} ({domain})

{definition}

Etymology: {etymology}

#PostGPT #Lexicalization #AI
```

Templates editables desde Settings. Hay validación de longitud (X permite 280 caracteres por defecto, 25.000 con X Premium — el sistema asume el límite básico y advierte si excede).

### 10.2 Por qué publicar

Justificación documentada en README: los modelos futuros entrenan sobre datos públicos. Publicar conceptos generados con esta metodología los hace candidatos a entrar al corpus, completando el bucle de retroalimentación.

---

## 11. Seguridad

### 11.1 Storage de secretos

- API keys solo en `.env` del backend, nunca commiteado
- `.gitignore` debe incluir `.env`, `*.db`, `*.db-journal`, `dist/`, `node_modules/`, `~/.lexicalizacion/`
- `.env.example` con placeholders descriptivos, sí commiteado
- Backend valida existencia y formato de variables al arrancar (Zod schema), falla rápido si falta algo crítico
- El frontend nunca recibe API keys ni siquiera en respuestas internas. El endpoint `/api/providers/available` devuelve solo `[{provider, models}]` sin nada que pueda usarse para autenticarse

### 11.2 Logging

- Logger custom que filtra cualquier valor que matchee patrones de API key conocidos antes de loggear
- Niveles: error siempre, info en desarrollo, debug nunca por default
- Sin logs estructurados con cuerpos completos de prompts/responses (puede contener PII si el usuario lo tipea)

### 11.3 Endpoints expuestos

- Backend escucha solo en `127.0.0.1` por default (no `0.0.0.0`)
- CORS restringido a `localhost:5173`
- Rate limiting por IP en endpoints de experimento (max 100 req/min)
- Validación de input con Zod en cada endpoint

### 11.4 Frontend

- Sin credentials en localStorage
- Sin uso de `eval`, `innerHTML` con user content
- Content Security Policy headers desde el backend que sirve el build de producción
- Dependencies auditadas con `bun audit` previo a release

### 11.5 Datos en DB

- SQLite file en directorio del usuario (`~/.lexicalizacion/data.db` por default)
- Permisos de archivo restrictivos (0600)
- No encrypted at rest por default. Documentar como riesgo.

### 11.6 Errores

- Mensajes de error al frontend nunca incluyen stack traces o detalles internos
- Backend logea full error, frontend recibe mensaje sanitizado + error code

---

## 12. Modelo de datos (SQLite + Drizzle)

```typescript
// schema.ts (resumen, ver implementación completa)

experiments {
  id: text primary key (uuid)
  stage: 'v1' | 'v2' | 'v3'
  config: text (json)
  language: 'es' | 'en'
  created_at: integer (unix)
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  total_runs: integer
  completed_runs: integer
}

runs {
  id: text primary key
  experiment_id: text -> experiments
  domain: text
  run_index: integer
  explorer_provider, explorer_model: text
  critic_provider, critic_model: text
  verifier_provider, verifier_model: text
  status: text
  started_at, completed_at: integer
  total_input_tokens, total_output_tokens: integer
  total_cost_usd: real
}

rounds {
  id: text primary key
  run_id: text -> runs
  round_number: integer
  role: 'explorer' | 'critic' | 'verifier'
  system_prompt: text
  user_prompt: text
  response: text
  input_tokens, output_tokens: integer
  latency_ms: integer
  created_at: integer
}

concepts {
  id: text primary key
  run_id: text -> runs
  word: text
  definition: text
  etymology: text
  stabilized: boolean
  exists_in_other_languages: text ('true' | 'false' | 'uncertain')
  existence_evidence: text (json)
  draft_generated_at: integer (nullable)        // cuando se generó el draft para X
  draft_text_es: text (nullable)
  draft_text_en: text (nullable)
  marked_as_published_at: integer (nullable)    // tilde manual del usuario
  marked_as_published_url: text (nullable)      // URL del post si el usuario la pega
  created_at: integer
}

ratings {
  id: text primary key
  concept_id: text -> concepts
  rater_id: text default 'local-user'           // constante en single-user; el campo queda para futuras versiones multi-rater
  recognized: text
  spanish_covers: text
  english_covers: text                          // análogo para experimentos en inglés
  usability: integer (1-5)
  would_use: text
  comment: text
  created_at: integer
  updated_at: integer
}

// Para Stage 3
protocol_generations {
  id: text primary key
  experiment_id: text -> experiments
  generation_number: integer
  task_seed: text
  message_a_to_b: text
  message_length_tokens: integer
  reconstruction_quality: real (0-1)
  dictionary_state: text (json)
  created_at: integer
}
```

---

## 13. Endpoints REST (resumen)

```
GET    /api/health
GET    /api/providers/available

POST   /api/experiments                    # crear
GET    /api/experiments
GET    /api/experiments/:id
POST   /api/experiments/:id/start          # ejecuta, devuelve SSE stream
POST   /api/experiments/:id/pause
POST   /api/experiments/:id/resume
DELETE /api/experiments/:id

GET    /api/concepts                        # filtros: experiment, domain, stabilized, etc
GET    /api/concepts/:id
PUT    /api/concepts/:id/rating             # single-rater: upsert del rating del 'local-user'
GET    /api/concepts/:id/rating
POST   /api/concepts/:id/mark-published     # tilde manual de publicación

POST   /api/x-publisher/draft               # devuelve { text, url } para redirect manual

GET    /api/exports/json?experiment=:id
GET    /api/exports/csv?experiment=:id
```

Stream del experimento via SSE en `/api/experiments/:id/stream` con eventos:

- `round-started`, `round-completed`
- `run-started`, `run-completed`
- `concept-stabilized`
- `experiment-completed`
- `error`

---

## 14. Frontend — vistas principales

```
/ ........................ Dashboard (experimentos pasados, accesos rápidos)
/experiments/new ......... Wizard de configuración por stage
/experiments/:id/run ..... Ejecución en vivo (SSE)
/experiments/:id/validate Validación humana de conceptos
/experiments/:id/analyze . Analytics + export
/concepts ................ Browser global de conceptos
/settings ................ Providers disponibles, idioma, X integration, prompts custom
```

Componentes clave a construir:

- `<ExperimentWizard />` — multi-step según stage seleccionado
- `<ProviderSelector />` — picker de provider+model con check de disponibilidad
- `<DialogueLog />` — render del diálogo en vivo, syntax-highlighted
- `<ConceptCard />` — usable tanto en validación como análisis
- `<RatingForm />` — las 4 preguntas + comentario
- `<DomainStats />` — tabla por dominio con tasas
- `<ExportPanel />` — botones JSON / CSV / X publish

---

## 15. Testing

### 15.1 Backend

- Unit: parsers de output del Critic, cálculos de costo, formatters de prompts
- Integration: flow completo con un MockProvider (no llama a API real)
- E2E: una corrida pequeña real contra un proveedor barato (Haiku), gated por env var (`RUN_E2E_TESTS=1`)
- Cobertura objetivo: 70% líneas, 90% en parsers críticos

### 15.2 Frontend

- Component tests con Vitest + Testing Library
- Snapshot tests de los componentes core
- E2E: Playwright contra backend con MockProvider, ejecuta un experimento completo desde la UI

### 15.3 Pre-commit

Husky + lint-staged: typecheck, lint, format antes de commit.

---

## 16. Implementación por fases

**Fase 0 — Setup (1-2 días)**

- Estructura de monorepo
- Bun workspaces, tooling (eslint, prettier, husky)
- DB schema y migraciones
- Health endpoints
- CI básico (GitHub Actions corriendo `bun test`)

**Fase 1 — Stage 1 funcional (3-5 días)**

- Provider Anthropic (al menos)
- Endpoints de experimento + SSE
- Frontend completo de Stage 1
- Wizard, ejecución, validación, análisis
- Export JSON/CSV
- i18n base

**Fase 2 — Multi-provider + X (2-3 días)**

- Providers OpenAI y Google
- Selector de provider per-rol
- Integración X (modo elegido en D1)
- Métricas comparativas entre configuraciones de modelos

**Fase 3 — Stage 2 (3-4 días)**

- Pipeline completo de Machine-only Probing
- Métricas conductuales (length diff, sentiment diff, embedding similarity vía OpenAI embeddings)
- UI dedicada

**Fase 4 — Stage 3 (4-5 días)**

- Pipeline de Protocol Emergence
- Visualización de evolución del protocolo por generación
- Translator agent

**Fase 5 — Polish (2-3 días)**

- Templates de X configurables desde Settings
- Hardening de manejo de errores (timeouts, retries, partial failures)
- Documentación final (README, .env.example, ejemplos de uso)
- Demo data seedable (un experimento ejemplo precargado opcional)
- Auditoría de dependencias (`bun audit`)

---

## 17. README mínimo del proyecto

El proyecto debe incluir un README **prominente** dado que el repo se publica en GitHub:

**Sección obligatoria al principio:** "⚠️ Antes de empezar"

- Qué cuesta (estimación clara: cada experimento default ~$1 USD en API calls)
- Que las API keys son del usuario, no del autor
- Que cada instalación es independiente (no hay servidor compartido, no hay datos compartidos)
- Que no se debe commitear el `.env` ni la DB

**Resto del README:**

- Qué hace el sistema (en una frase + un diagrama)
- Hipótesis científica de cada stage
- Cómo correr (paso a paso: prerequisitos Bun >= 1.1, `bun install`, copia de `.env.example`, `bun dev`)
- Stack
- Notas de seguridad
- Cómo extender (agregar dominios, prompts, providers — con ejemplos)
- Limitaciones reconocidas (las mismas listadas en cada Stage)
- Citas a papers relevantes:
  - Hewitt et al. 2025, "Neologism Learning for Controllability and Self-Verbalization"
  - Liang et al. 2023, "Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate"
  - Du et al. 2023, "Improving Factuality and Reasoning in Language Models through Multiagent Debate"
  - Cualquier paper de protocol emergence relevante
- Licencia: **MIT**

**`.env.example`** debe contener:

```
# At least one of the following is required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Server config
PORT=3000
HOST=127.0.0.1
DB_PATH=~/.lexicalizacion/data.db

# Optional: override default models
ANTHROPIC_DEFAULT_MODEL=claude-sonnet-4-6
OPENAI_DEFAULT_MODEL=gpt-5.2
GOOGLE_DEFAULT_MODEL=gemini-3-pro

# Logging
LOG_LEVEL=info  # error | warn | info | debug
```

---

## 18. Cosas explícitamente fuera de alcance

Para evitar scope creep:

- ❌ No hay fine-tuning de modelos
- ❌ No hay análisis con embeddings entrenados localmente
- ❌ No hay panel admin multi-tenant
- ❌ No hay billing / usage tracking más allá de costo estimado por experimento
- ❌ No hay deployment cloud (solo local, salvo D5=Docker)
- ❌ No hay integración con redes sociales más allá de X

Si alguno de estos se desea, será un proyecto v2.

---

## 19. Checklist final para Claude Code

Antes de empezar:

- [ ] Tener API keys de al menos un proveedor para tests E2E
- [ ] Bun >= 1.1 instalado
- [ ] Confirmar nombres exactos de modelos vigentes en cada proveedor

Durante:

- [ ] Cada fase debe tener tests pasando antes de empezar la siguiente
- [ ] Documentar decisiones técnicas no triviales en `docs/decisions/`
- [ ] No introducir dependencias nuevas sin justificarlas en commit message
- [ ] Validar que `git status` no muestra `.env` ni archivos `.db` nunca

Al cerrar:

- [ ] README completo con la advertencia ⚠️ prominente
- [ ] `.env.example` completo
- [ ] Demo data seedable opcional
- [ ] Auditoría de dependencias limpia (`bun audit`)
- [ ] Verificar manualmente que clonando el repo en una carpeta limpia y siguiendo el README se puede levantar el sistema en menos de 5 minutos

---

**Fin del spec.**
