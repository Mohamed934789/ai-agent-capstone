import asyncio
import contextlib
import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
try:
    from .agent import CustomAgentExecutor, QueueCallbackHandler
except ImportError:
    from agent import CustomAgentExecutor, QueueCallbackHandler

class InvokeRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)

def create_app(executor_factory=CustomAgentExecutor, request_timeout=90):
    app = FastAPI(title="Signal — local tool-calling prototype")
    app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("SIGNAL_UI_ORIGIN", "http://localhost:3000")],
                       allow_methods=["POST", "GET"], allow_headers=["Content-Type"])

    @app.get("/health")
    def health(): return {"status": "ok", "conversation_state": "per-request"}

    @app.post("/invoke")
    async def invoke(request: InvokeRequest):
        async def events():
            queue = asyncio.Queue(maxsize=256)
            streamer = QueueCallbackHandler(queue)
            async def run():
                try:
                    async with asyncio.timeout(request_timeout):
                        await executor_factory().invoke(request.content, streamer)
                except Exception:
                    await streamer.emit({"type": "error", "message": "Agent unavailable or timed out; check configuration"})
                finally:
                    await streamer.emit({"type": "done"})
            task = asyncio.create_task(run())
            try:
                async for event in streamer:
                    yield "data: " + json.dumps(event, ensure_ascii=False) + "\n\n"
            finally:
                if not task.done(): task.cancel()
                with contextlib.suppress(asyncio.CancelledError): await task
        return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
    return app

app = create_app()
