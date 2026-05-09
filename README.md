# AI SRE Orchestrator

An autonomous AI-powered incident response platform designed to analyze system logs, detect root causes, and orchestrate remediation across distributed infrastructure.

## 🤖 AI Analysis Architecture

The core intelligence of this platform is centralized in the `src/api/gemini.ts` module. This architecture ensures a consolidated location for managing LLM interactions, prompts, and security guardrails.

### Incident Analysis Flow
1. **Log Ingestion**: Raw text logs are provided via the UI or API.
2. **Analysis Request**: The frontend triggers the `useAnalysis` hook, which calls the Gemini API service.
3. **Structured Synthesis**: The AI processes the telemetry data through a specialized SRE persona.
4. **Actionable Output**: The system returns a strictly structured JSON payload containing severity, root cause, and multi-step remediation playbooks.

### 🛡️ Core Guardrails
To ensure production-grade reliability and security, we have implemented dual-layer guardrails within `src/api/gemini.ts`:

*   **Instructional (The Persona Boundary)**:
    A robust `systemInstruction` forces the LLM to act exclusively as an "Expert SRE and DevOps Incident Analyst." It is explicitly instructed to ignore non-incident queries and only return data relevant to the SRE domain.
*   **Structural (Schema Integrity)**:
    We utilize a `responseSchema` (JSON schema) in the Gemini API configuration. This prevents "hallucinations" in data structure and ensures that every response strictly adheres to our `AnalysisResult` TypeScript interface, protecting the UI from unexpected data shapes.

## 🛠️ Tech Stack
- **AI Engine**: Google Gemini (via `@google/genai`)
- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (motion/react)
- **Icons**: Lucide React

## 🚀 Getting Started
1. Set your `GEMINI_API_KEY` in the environment.
2. Run `npm install`.
3. Run `npm run dev` to start the local simulation.
