# Signal — streaming tool-calling prototype

An explicit Python agent loop using LangChain and OpenAI, a FastAPI SSE endpoint,
and a Next.js/TypeScript interface. Extended from the Aurelio Labs LangChain course;
course attribution is retained. Tool activity is observable execution data, not access to internal model reasoning.

## Run locally
Python 3.12 and Node.js **20.9+** (Node 22 recommended for this locked frontend).
```bash
git clone https://github.com/Mohamed934789/ai-agent-capstone.git
cd ai-agent-capstone
python -m venv .venv
# Activate .venv for your shell.
python -m pip install -r api/requirements.txt
# Copy api/.env.example to api/.env.local; set your own keys.
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```
In another terminal, `cd app`, run `npm ci`, then `npm run dev`.
The API `/health` endpoint needs no key. Set `NEXT_PUBLIC_API_URL` in `app/.env.local`
when using another API origin; configure `SIGNAL_UI_ORIGIN` on the API accordingly.

`POST /invoke` accepts JSON `{ "content": "What is 2 + 3?" }` and returns standard SSE
`data:` JSON frames: tool_start, tool_arguments, tool_result, result, error, done.
The backend bounds request/tool time and iterations; errors and exhausted loops terminate the stream.
Each request has isolated scratchpad state. The browser displays previous questions but the backend
does not retain conversation history. Disconnects cancel work. Final-answer tool arguments can stream
incrementally; the completed result event is authoritative.

## Offline verification
```bash
python -m pip install -r api/requirements-dev.txt
python -m pytest api/tests -q
cd app
npm ci
npm run build
```
Tests use a fake model and no provider calls. Live responses and search quality have not been
benchmarked by these tests. Live use sends questions to OpenAI and search text to SerpAPI and may
incur account costs. Bind locally: authentication, rate limiting and durable sessions are not implemented.

## Architecture
`browser → JSON request → per-request executor → model/tool loop → bounded SSE events`.
Arithmetic and SerpAPI search are tools; the model calls `final_answer` to complete the loop.
See `api/agent.py`, `api/main.py`, `app/src/types.ts` and `app/src/components/TextArea.tsx`.
No production reliability or accuracy claim is made. Roadmap: broader tool/parser/concurrency
evaluation, authenticated deployment and durable opt-in sessions.
