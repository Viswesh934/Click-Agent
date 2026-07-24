import { FastifyReply } from "fastify";

export function sendMockResponse(reply: FastifyReply, msg: string, stream: boolean, model: string) {
  const chunkId = `chatcmpl-${Date.now()}`;
  if (stream) {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const chunkPayload = {
      id: chunkId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: model || "llamaindex-fastify",
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: msg },
          finish_reason: null,
        },
      ],
    };
    reply.raw.write(`data: ${JSON.stringify(chunkPayload)}\n\n`);

    const stopPayload = {
      id: chunkId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: model || "llamaindex-fastify",
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: "stop",
        },
      ],
    };
    reply.raw.write(`data: ${JSON.stringify(stopPayload)}\n\n`);
    reply.raw.write("data: [DONE]\n\n");
    reply.raw.end();
    return;
  } else {
    return {
      id: chunkId,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "llamaindex-fastify",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: msg,
          },
          finish_reason: "stop",
        },
      ],
    };
  }
}
