import { FastifyInstance, FastifyRequest } from "fastify";
import { trace } from "@opentelemetry/api";

function extractAndEnrichTelemetry(req: FastifyRequest) {
  const tenant = (req.headers["x-tenant"] as string) || "unknown";
  const region = (req.headers["x-region"] as string) || "unknown";
  const deployment = (req.headers["x-deployment"] as string) || "v1.0.0";
  const requestId = (req.headers["x-request-id"] as string) || "req-unknown";
  const plan = (req.headers["x-customer-plan"] as string) || "free";
  const featureFlag = (req.headers["x-feature-flag"] as string) || "default";
  const userId = (req.headers["x-user-id"] as string) || "user-anon";

  // Log structured request metadata for ClickHouse/ClickStack log ingestion
  req.log.info({
    tenant,
    region,
    deployment,
    requestId,
    plan,
    featureFlag,
    userId,
    path: req.url,
    method: req.method,
  });

  // Attach attributes to active OpenTelemetry trace span
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttribute("tenant.id", tenant);
    activeSpan.setAttribute("region", region);
    activeSpan.setAttribute("deployment.version", deployment);
    activeSpan.setAttribute("request.id", requestId);
    activeSpan.setAttribute("customer.plan", plan);
    activeSpan.setAttribute("feature.flag", featureFlag);
    activeSpan.setAttribute("user.id", userId);
    activeSpan.setAttribute("http.route", req.url);
  }

  return { tenant, region, deployment, requestId, plan, featureFlag, userId };
}

export default async function simulationRoutes(fastify: FastifyInstance) {
  // Hook for all simulation routes to automatically extract telemetry
  fastify.addHook("onRequest", async (req) => {
    extractAndEnrichTelemetry(req);
  });

  // 1. Login
  fastify.all("/login", async (req, reply) => {
    const { deployment } = extractAndEnrichTelemetry(req);
    // v1.1.0 slight delay on login
    if (deployment === "v1.1.0" && Math.random() < 0.15) {
      await new Promise((r) => setTimeout(r, 800));
    }
    return { status: "success", message: "User authenticated", timestamp: Date.now() };
  });

  // 2. Products List
  fastify.get("/products", async (req) => {
    return {
      products: [
        { id: "p1", name: "Wireless Headphones", price: 99.99 },
        { id: "p2", name: "Ergonomic Keyboard", price: 149.50 },
        { id: "p3", name: "4K Monitor", price: 399.00 },
        { id: "p4", name: "USB-C Hub", price: 29.99 },
      ],
    };
  });

  // 3. Product Search
  fastify.get("/search", async (req) => {
    const query = (req.query as any)?.q || "featured";
    return {
      query,
      resultsCount: 12,
      results: [
        { id: "p1", name: `Result for ${query}` },
        { id: "p2", name: `Alternative for ${query}` },
      ],
    };
  });

  // 4. Inventory Check
  fastify.get("/inventory", async () => {
    return {
      warehouse: "us-east-1a",
      inStock: true,
      availableQuantity: 42,
    };
  });

  // 5. Users List
  fastify.get("/users", async () => {
    return {
      usersCount: 3,
      users: [{ id: "u1" }, { id: "u2" }, { id: "u3" }],
    };
  });

  // 6. Slow Users Endpoint
  fastify.get("/users/slow", async (req) => {
    const { deployment } = extractAndEnrichTelemetry(req);
    const delay = deployment === "v1.1.0" ? 2500 + Math.random() * 1500 : 800 + Math.random() * 400;
    await new Promise((r) => setTimeout(r, delay));
    return { status: "ok", latencyMs: Math.round(delay) };
  });

  // 7. Error Users Endpoint
  fastify.get("/users/error", async (req, reply) => {
    reply.status(500);
    return { error: "InternalServerError", message: "Failed to fetch user profiles from database" };
  });

  // 8. Orders Endpoint
  fastify.all("/orders", async (req, reply) => {
    const { deployment } = extractAndEnrichTelemetry(req);
    // Deployment v1.1.0 causes intermittent 500 error on orders
    if (deployment === "v1.1.0" && Math.random() < 0.3) {
      reply.status(500);
      return { error: "OrderCreationError", message: "Database lock conflict during order persistence" };
    }
    return { orderId: `ord-${Date.now()}`, status: "created", total: 199.99 };
  });

  // 9. Checkout Endpoint
  fastify.all("/checkout", async (req, reply) => {
    const { deployment } = extractAndEnrichTelemetry(req);
    // v1.1.0 bad deployment causes 50% checkout failure
    if (deployment === "v1.1.0" && Math.random() < 0.5) {
      reply.status(500);
      return { error: "CheckoutFailedException", message: "Transaction deadlock in cart checkout service (v1.1.0 regression)" };
    }
    return { checkoutId: `chk-${Date.now()}`, status: "completed" };
  });

  // 10. Payment Endpoint (Primary RCA Target for v1.1.0)
  fastify.all("/payment", async (req, reply) => {
    const { deployment } = extractAndEnrichTelemetry(req);
    // Deployment v1.1.0 has high payment failure rate (75% failure)
    if (deployment === "v1.1.0" && Math.random() < 0.75) {
      reply.status(504);
      return {
        error: "PaymentGatewayTimeout",
        message: "Payment processing gateway connection timed out after 5000ms. Root Cause: Deployment v1.1.0 misconfigured connection pool size.",
        deployment,
      };
    }

    // Baseline random payment error (2%)
    if (Math.random() < 0.02) {
      reply.status(402);
      return { error: "PaymentRequired", message: "Insufficient funds" };
    }

    return { paymentId: `pay-${Date.now()}`, status: "authorized", amount: 199.99 };
  });
}
