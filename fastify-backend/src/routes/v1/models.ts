import { FastifyInstance } from "fastify";

export default async function modelsRoutes(fastify: FastifyInstance) {
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
}
