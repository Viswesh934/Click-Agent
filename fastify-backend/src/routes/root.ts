import { FastifyInstance } from "fastify";

export default async function rootRoutes(fastify: FastifyInstance) {
  // Info route
  fastify.get("/", async () => {
    return {
      message: "DeepSeek LlamaIndex Fastify OpenAI-Compatible Backend is running.",
      endpoints: {
        health: "/health",
        models: "/v1/models",
        chat: "/v1/chat/completions",
      },
    };
  });
}
