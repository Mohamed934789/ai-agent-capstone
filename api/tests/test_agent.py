import asyncio
import json
import copy
import pytest
from langchain_core.messages import AIMessageChunk
from api.agent import CustomAgentExecutor, QueueCallbackHandler
from api.main import create_app
from fastapi.testclient import TestClient

class FakeModel:
    def __init__(self, names): self.names = iter(names); self.inputs = []
    def with_config(self, **kwargs): return self
    async def astream(self, inputs):
        self.inputs.append(copy.deepcopy(inputs))
        name = next(self.names)
        if name == "fail": raise RuntimeError("private-value")
        args = {"answer": inputs["input"], "tools_used": []} if name == "final_answer" else {"x": 2, "y": 3}
        yield AIMessageChunk(content="", tool_call_chunks=[{"name": name, "args": json.dumps(args), "id": "call-1", "index": 0}])

@pytest.mark.asyncio
async def test_tool_loop_and_limit_terminate():
    queue = asyncio.Queue(); model = FakeModel(["add", "final_answer"])
    result = await CustomAgentExecutor(agent=model).invoke("question", QueueCallbackHandler(queue))
    assert result["answer"] == "question"
    events = []
    while not queue.empty(): events.append(queue.get_nowait())
    assert events[-1]["type"] == "done"
    assert events[0]["result"] == 5
    queue = asyncio.Queue()
    result = await CustomAgentExecutor(max_iterations=1, agent=FakeModel(["add"])).invoke("question", QueueCallbackHandler(queue))
    assert "iteration limit" in result["answer"]
    assert any(queue.get_nowait()["type"] == "done" for _ in range(queue.qsize()))

def test_sse_error_completion_and_request_isolation():
    models = []
    def factory():
        model = FakeModel(["final_answer"]); models.append(model)
        return CustomAgentExecutor(agent=model)
    client = TestClient(create_app(factory))
    for question in ["first & private", "second"]:
        response = client.post("/invoke", json={"content": question})
        events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
        assert events[-1]["type"] == "done"
        assert next(e for e in events if e["type"] == "result")["answer"] == question
    assert models[1].inputs[0]["agent_scratchpad"] == []
    failed = TestClient(create_app(lambda: CustomAgentExecutor(agent=FakeModel(["fail"])))).post("/invoke", json={"content": "q"})
    assert '"type": "error"' in failed.text and '"type": "done"' in failed.text
    assert "private-value" not in failed.text

def test_timeout_and_input_validation():
    class Slow:
        async def invoke(self, content, streamer): await asyncio.sleep(10)
    client = TestClient(create_app(Slow, request_timeout=.02))
    response = client.post("/invoke", json={"content": "q"})
    assert '"type": "done"' in response.text
    assert client.post("/invoke", json={"content": ""}).status_code == 422
    assert client.get("/health").status_code == 200
