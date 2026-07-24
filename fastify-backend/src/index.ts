import './instrumentation.js';
import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import clickhousePlugin from "./clickClient.js";
import { initializeIndex } from "./services/llamaIndex.js";
import rootRoutes from "./routes/root.js";
import healthRoutes from "./routes/health.js";
import modelsRoutes from "./routes/v1/models.js";
import chatRoutes from "./routes/v1/chat.js";
import simulationRoutes from "./routes/simulation.js";

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Enable CORS
await fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
});

// Register plugins and routes
await fastify.register(clickhousePlugin);
await fastify.register(rootRoutes);
await fastify.register(healthRoutes);
await fastify.register(modelsRoutes);
await fastify.register(chatRoutes);
await fastify.register(simulationRoutes);

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
