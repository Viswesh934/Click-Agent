import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { VectorStoreIndex, SimpleDirectoryReader } from "llamaindex";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

// Enable CORS
await fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
});

let index: VectorStoreIndex | null = null;

// Initialize LlamaIndex
async function initializeIndex() {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    console.warn("WARNING: OPENAI_API_KEY environment variable is not set. LlamaIndex index creation skipped until key is provided.");
    return false;
  }

  try {
    const dataDir = path.join(__dirname, "../data");
    console.log(`Ingesting documents from directory: ${dataDir}`);
    const reader = new SimpleDirectoryReader();
    const documents = await reader.loadData({ directoryPath: dataDir });
    index = await VectorStoreIndex.fromDocuments(documents);
    console.log("LlamaIndex successfully initialized and vectorized documents.");
    return true;
  } catch (error) {
    console.error("Error initializing LlamaIndex:", error);
    return false;
  }
}

// Health check endpoint
fastify.get("/health", async () => {
  return {
    status: "ok",
    llamaindex: index ? "initialized" : "not_initialized",
    hasApiKey: !!process.env.OPENAI_API_KEY,
  };
});

// Info route
fastify.get("/", async () => {
  return {
    message: "LlamaIndex Fastify OpenAI-Compatible Backend is running.",
    endpoints: {
      health: "/health",
      models: "/v1/models",
      chat: "/v1/chat/completions",
    },
  };
});

// Models list endpoint (required by LibreChat)
fastify.get("/v1/models", async () => {
  return {
    object: "list",
    data: [
      {
        id: "llamaindex-fastify",
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "llamaindex-fastify",
      },
    ],
  };
});

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
    const queryEngine = index.asQueryEngine();

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

// Helper to send fallback/mock responses (handles both stream and non-stream formats)
function sendMockResponse(reply: any, msg: string, stream: boolean, model: string) {
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

// Start Server
const PORT = parseInt(process.env.PORT || "5001", 10);
const HOST = process.env.HOST || "0.0.0.0";

const start = async () => {
  try {
    // Try to run initial indexing if API key is in environment
    await initializeIndex();

    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Fastify server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
