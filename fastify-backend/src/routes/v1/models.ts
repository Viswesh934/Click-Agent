import { FastifyInstance } from "fastify";

export default async function modelsRoutes(fastify: FastifyInstance) {
  // Models list endpoint (required by LibreChat)
  fastify.get("/v1/models", async () => {
    return {
      object: "list",
      data: [
        {
          id: "deepseek-chat",
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "deepseek",
        },
        {
          id: "deepseek-coder",
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "deepseek",
        },
        {
          id: "deepseek-reasoner",
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "deepseek",
        },
        {
          id: "llamaindex-fastify",
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "llamaindex-fastify",
        },
      ],
    };
  });
}
