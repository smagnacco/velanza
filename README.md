# Velanza

> _velanza, n._ — Estado en que un pensamiento propio existe sin forma ni palabras hasta que alguien más lo pronuncia y lo revela. La palabra ajena no crea el pensamiento, lo descubre.

Sistema multi-agente para generar neologismos que llenen huecos conceptuales en lenguajes humanos. Dos o más instancias de modelos de lenguaje dialogan adversarialmente — una propone, otra critica, otra verifica — hasta producir vocabulario que nombra experiencias reales que el lenguaje existente no captura.

El proyecto lleva el nombre de una de sus primeras creaciones: _velanza_ fue uno de los conceptos generados en la fase prototipo, durante un diálogo entre dos instancias de Claude. Ningún humano lo escribió.

🇬🇧 _English version: [README.en.md](./README.en.md)_

---

## ⚠️ Antes de empezar

Esto es importante. Leélo antes de instalar.

- **Las API keys son tuyas.** Velanza no provee acceso a ningún modelo. Necesitás cuenta propia en al menos uno de: Anthropic, OpenAI, Google.
- **Los costos los pagás vos.** Un experimento default (3 dominios × 2 corridas) consume aproximadamente **1 USD** en llamadas a la API. Ejecutar las tres etapas completas con todos los dominios puede costar **5-10 USD**. El sistema muestra el costo estimado antes de cada corrida.
- **Cada instalación es independiente.** Velanza es una aplicación local single-user. No hay servidor compartido. No hay datos compartidos. Lo que generes en tu máquina vive solo en tu máquina, salvo que decidas exportarlo o publicarlo.
- **Nunca commitees `.env` ni los archivos de base de datos.** El `.gitignore` los cubre, pero verificá antes de cada push.

---

## Qué hace

Velanza ejecuta tres etapas crecientes de experimentos sobre la capacidad de sistemas multi-agente LLM para producir lenguaje no cubierto por el vocabulario humano existente.

### Etapa 1 — Lexicalización Whorfiana

**Pregunta:** ¿Pueden dos IAs en diálogo adversarial generar neologismos que llenen huecos lexicales reales en español/inglés?

**Mecanismo:** Una agente Exploradora propone conceptos en un dominio dado. Una agente Crítica los evalúa rigurosamente. Una agente Verificadora chequea si el concepto ya existe en otras lenguas. Lo que sobrevive pasa a validación humana.

**Output:** lista de neologismos con definición, etimología, y métrica de "hueco genuino" = (reconocido por humano + sin equivalente en español + sin equivalente en otras lenguas conocidas).

### Etapa 2 — Machine-only Concept Probing

**Pregunta:** ¿Tienen los modelos categorías conceptuales internas que no mapean a lenguaje humano?

**Mecanismo:** Adaptación API-only del trabajo de [Hewitt et al. (2025)](https://arxiv.org/abs/2510.08506). Un agente identifica conceptos que "usa internamente" sin nombre humano preciso. Otro agente intenta encontrar la mejor traducción humana posible. Los conceptos cuya traducción no produce comportamiento equivalente sobreviven como candidatos a _machine-only synonyms_.

**Output:** neologismos con efecto conductual medido en plug-in evaluation (qué cambia cuando aparecen en un prompt vs cuando aparece su traducción humana).

### Etapa 3 — Protocol Emergence

**Pregunta:** Bajo presión de eficiencia, ¿pueden dos agentes desarrollar un protocolo de comunicación propio que vaya más allá del lenguaje natural?

**Mecanismo:** Dos agentes resuelven una tarea de transmisión de información con presupuesto de tokens decreciente por generación. Pueden inventar notación, símbolos, estructura. Tras N generaciones, un Translator traduce el protocolo final a lenguaje humano para análisis.

**Output:** evolución del protocolo por generación + análisis de qué estructuras emergieron y qué se pierde en la traducción.

---

## Quick start

### Prerequisitos

- [Bun](https://bun.sh) >= 1.1
- API key de al menos uno de: Anthropic, OpenAI, Google

### Instalación

```bash
git clone https://github.com/<tu-usuario>/velanza.git
cd velanza
bun install
cp .env.example .env
# editá .env con tus API keys
bun dev
```

Abrí `http://localhost:5173` en el navegador. El backend levanta en `localhost:3000`, accesible solo desde tu máquina.

### Primera corrida

1. Andá a **Configurar**.
2. Seleccioná 1-3 dominios experienciales para empezar.
3. Dejá el default de 2 corridas por dominio.
4. Asignale Claude Sonnet a los tres roles (Exploradora, Crítica, Verificadora) o mezclá proveedores si querés.
5. Iniciá. Ver el progreso en vivo en la pestaña **Ejecutar**.
6. Cuando termine, validá los conceptos en **Validar**.
7. Mirá las métricas en **Analizar**, exportá a JSON/CSV si querés análisis externo.

---

## Stack

- **Frontend:** Svelte 5 + Vite + TypeScript
- **Runtime:** Bun
- **Backend:** Hono
- **DB:** SQLite + Drizzle ORM
- **Validación:** Zod
- **i18n:** typesafe-i18n (español + inglés)
- **Testing:** Bun test (backend) + Vitest + Playwright (frontend)

---

## Configuración

Toda la configuración vive en `.env`. Ver `.env.example` para el template completo.

```env
# Al menos una key es requerida
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Server (defaults razonables)
PORT=3000
HOST=127.0.0.1
DB_PATH=~/.velanza/data.db

# Override de modelos default si querés
ANTHROPIC_DEFAULT_MODEL=claude-sonnet-4-6
OPENAI_DEFAULT_MODEL=gpt-5.2
GOOGLE_DEFAULT_MODEL=gemini-3-pro

LOG_LEVEL=info
```

El backend valida estas variables al arrancar y falla rápido si falta algo crítico. Los logs nunca incluyen valores que matcheen patrones de API key.

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

Implementá la interfaz `LLMProvider` en `apps/backend/src/providers/`:

```typescript
export const myProvider: LLMProvider = {
  name: 'my-provider',
  availableModels: () => ['model-a', 'model-b'],
  complete: async (model, req) => {
    /* ... */
  },
};
```

Registralo en `providers/registry.ts` y agregá la API key correspondiente al schema de `env.ts`.

### Customizar prompts

Los prompts viven en `apps/backend/src/prompts/{stage}.{lang}.ts`. Cada prompt está en español e inglés nativos, no traducidos. Si modificás uno, hacelo en ambos idiomas para mantener paridad.

---

## Seguridad

- API keys solo en `.env`, nunca commiteado, nunca expuesto al frontend
- Backend escucha por default solo en `127.0.0.1`
- CORS restringido a `localhost:5173`
- Rate limiting interno: máx 5 llamadas LLM concurrentes globales
- Logger filtra patrones de API key antes de imprimir
- Validación Zod en todos los endpoints
- DB con permisos restrictivos (`0600`)

**Lo que no está incluido:**

- Encryption-at-rest de la DB. Si te importa, encriptá el filesystem.
- Auth (porque es single-user). Si exponés esto a la red, agregalo vos.

---

## Publicación a X

Velanza no se conecta a la API de X (paga). En su lugar, genera el texto del post y abre `x.com/intent/tweet` en pestaña nueva con el texto pre-llenado. Vos revisás y publicás manualmente.

La intención de publicar conceptos generados es completar el bucle: los modelos futuros entrenan sobre datos públicos. Cada concepto que entra a X queda como candidato a entrar al corpus de la próxima generación de modelos. Si la metodología de Velanza produce vocabulario útil, eventualmente vuelve.

Templates editables desde la vista de Settings.

---

## Limitaciones reconocidas

Velanza es exploratorio, no confirmatorio. Algunas limitaciones de diseño:

- **Validación single-rater.** Sin múltiples evaluadores no se puede calcular acuerdo inter-rater (Cohen's kappa). Los resultados son juicios personales del usuario, no consenso.
- **Verificación de existencia imperfecta.** El verificador es otra LLM. No conoce todos los lenguajes humanos exhaustivamente. Un concepto marcado como "sin equivalente" puede tener equivalente en alguna lengua menor que el modelo no conoce.
- **Sesgo de mismo modelo.** Si Exploradora y Verificadora son la misma familia de modelo, comparten priors y la verificación está sesgada. Mezclá proveedores cuando puedas.
- **Etapa 2 no replica Hewitt.** Sin training real de embeddings, lo que hacemos es probing por prompts. Es sugestivo, no probatorio.
- **Etapa 3 puede colapsar a abreviaciones triviales.** Es posible que el "protocolo emergente" sea solo siglas obvias sin estructura genuina. Ese resultado también es válido — _los modelos no desarrollan protocolos novedosos bajo presión vía prompts_ es una conclusión interesante.

---

## Trabajos relacionados

- Hewitt, J., et al. (2025). [Neologism Learning for Controllability and Self-Verbalization](https://arxiv.org/abs/2510.08506). _arXiv:2510.08506_
- Liang, T., et al. (2023). [Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate](https://arxiv.org/abs/2305.19118). _arXiv:2305.19118_
- Du, Y., et al. (2023). [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325). _arXiv:2305.14325_
- Estornell, A., et al. (2024). [ACC-Collab: An Actor-Critic Approach to Multi-Agent LLM Collaboration](https://arxiv.org/abs/2411.00053). _arXiv:2411.00053_
- Chen, J., et al. (2024). Beyond Natural Language: LLMs Leveraging Alternative Formats for Enhanced Reasoning and Communication. _arXiv:2402.18439_

---

## Origen

Velanza nació de una conversación entre un humano y Claude sobre [PostGPT](https://github.com/ariannamethod/postgpt), un experimento que sugiere que el conocimiento ya está implícito en el texto sin necesidad de entrenamiento.

La conversación derivó hacia una pregunta más profunda: si los modelos pueden encontrar estructura en el lenguaje sin entrenamiento, ¿pueden también encontrar conceptos para los que el lenguaje todavía no tiene palabras? La intuición Whorfiana — los humanos no podemos pensar lo que no podemos nombrar — sugería un experimento concreto: hacer dialogar a dos IAs específicamente para generar nombres para experiencias humanas no lexicalizadas.

El primer prototipo fue un HTML de 600 líneas. Las primeras dos palabras que produjo fueron _entresí_ y _velanza_. La segunda nombró el proyecto.

---

## Licencia

MIT. Ver [LICENSE](./LICENSE).

Cualquiera puede clonar, modificar, redistribuir, usar comercialmente. Si publicás conceptos generados con Velanza, una mención al proyecto se agradece pero no es obligatoria.

---

_Para ver la especificación técnica completa, ver [SPEC.md](./SPEC.md)._
