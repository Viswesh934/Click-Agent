import { FastifyInstance } from "fastify";
import { isIndexInitialized } from "../services/llamaIndex.js";

export default async function healthRoutes(fastify: FastifyInstance) {

  fastify.get("/test-log", async (req) => {
  req.log.info("Hello from Fastify")

  console.log("Hello from console")

  return { ok: true }
})
  // Health check endpoint
  fastify.get("/health", async () => {
    return {
      status: "ok",
      llamaindex: isIndexInitialized() ? "initialized" : "not_initialized",
      hasApiKey: !!process.env.DEEPSEEK_API_KEY || !!process.env.OPENAI_API_KEY,
    };
  });

  // ClickHouse health check endpoint
  fastify.get("/health/clickhouse", async (req, reply) => {
    if (!fastify.ch) {
      reply.status(503);
      return { error: "ClickHouse client not initialized" };
    }
    const result = await fastify.ch.query({
      query: "SELECT version() AS version",
      format: "JSONEachRow",
    });

    return result.json();
  });
}
