import { FastifyInstance } from "fastify";
import { VectorStoreIndex } from "llamaindex";
import { getIndex } from "../../services/llamaIndex.js";
import { sendMockResponse } from "../../utils/mockResponse.js";

export default async function chatRoutes(fastify: FastifyInstance) {
  // Chat completions endpoint
  fastify.post("/v1/chat/completions", async (request, reply) => {
    const { messages, stream, model } = request.body as any;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      reply.status(400);
      return { error: "Invalid request body: 'messages' array is required." };
    }

    // Get the last user message
    const userMessages = messages.filter((m: any) => m.role === "user");
    let queryText = "";
    const lastUserContent = userMessages[userMessages.length - 1]?.content;

    if (typeof lastUserContent === "string") {
      queryText = lastUserContent;
    } else if (Array.isArray(lastUserContent)) {
      const textPart = lastUserContent.find((p: any) => p.type === "text" || p.text);
      queryText = textPart?.text || "";
    }

    if (!queryText) {
      reply.status(400);
      return { error: "No user query found in messages history." };
    }

    return sendMockResponse(reply, "hi mf", stream, model);

    try {
      const index = getIndex();
      if (!index) {
        return sendMockResponse(reply, "LlamaIndex is not initialized.", stream, model);
      }

      const queryEngine = (index as VectorStoreIndex).asQueryEngine();

      if (stream) {
        console.log(`Streaming query: "${queryText}"`);
        const responseStream = await queryEngine.query({ query: queryText, stream: true });

        reply.raw.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        });

        const chunkId = `chatcmpl-${Date.now()}`;

        for await (const chunk of responseStream) {
          const text = chunk.response;
          const dataPayload = {
            id: chunkId,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: model || "llamaindex-fastify",
            choices: [
              {
                index: 0,
                delta: { content: text },
                finish_reason: null,
              },
            ],
          };
          reply.raw.write(`data: ${JSON.stringify(dataPayload)}\n\n`);
        }

        // Final stop choice chunk
        const finalPayload = {
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
        reply.raw.write(`data: ${JSON.stringify(finalPayload)}\n\n`);
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();
      } else {
        console.log(`Standard query: "${queryText}"`);
        const result = await queryEngine.query({ query: queryText });

        return {
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: model || "llamaindex-fastify",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: result.response,
              },
              finish_reason: "stop",
            },
          ],
        };
      }
    } catch (err: any) {
      console.error("LlamaIndex query execution failed:", err);
      const errorMsg = `Error executing LlamaIndex query: ${err.message || err}`;
      return sendMockResponse(reply, errorMsg, stream, model);
    }
  });
}
