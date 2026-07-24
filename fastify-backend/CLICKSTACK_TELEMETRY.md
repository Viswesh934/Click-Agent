# ClickStack Telemetry & OpenTelemetry Setup Guide

This document outlines the architecture, setup process, troubleshooting steps, and Docker command for sending traces, metrics, and logs from the Fastify backend to the ClickStack OpenTelemetry Collector.

---

## 1. Running the ClickStack OTLP Collector (Docker)

To ingest OpenTelemetry traces, metrics, and logs into your ClickHouse instance, spin up the `clickstack-otel-collector` Docker container:

```bash
docker run \
  -e CLICKHOUSE_ENDPOINT="<YOUR_CLICKHOUSE_ENDPOINT>" \
  -e CLICKHOUSE_USER="<YOUR_CLICKHOUSE_USER>" \
  -e CLICKHOUSE_PASSWORD="<YOUR_CLICKHOUSE_PASSWORD>" \
  -p 4317:4317 \
  -p 4318:4318 \
  clickhouse/clickstack-otel-collector:latest
```

### Port Mapping Details:
- **`4318`**: OTLP HTTP receiver (used by `@opentelemetry/exporter-*-otlp-http`).
- **`4317`**: OTLP gRPC receiver.

---

## 2. Fastify & OpenTelemetry Architecture

### Setup & Initialization
- **`src/instrumentation.ts`**: Initializes the `@opentelemetry/sdk-node` NodeSDK with auto-instrumentation (`@opentelemetry/auto-instrumentations-node`), exporting OTLP HTTP traces (`/v1/traces`), metrics (`/v1/metrics`), and logs (`/v1/logs`).
- **`src/index.ts`**: Standard Fastify app registering modular route plugins. `import './instrumentation.js'` is placed as **Line 1** to ensure auto-instrumentation hooks attach before any other modules load.

### Custom Telemetry Attributes
Every incoming HTTP request enriches the active OpenTelemetry span with structured attributes:
- `tenant.id`: Target tenant (e.g. `acme`, `globex`, `wayne`)
- `region`: Cloud region (e.g. `ap-south-1`, `us-east-1`)
- `deployment.version`: Application deployment version (e.g. `v1.0.0`, `v1.1.0`)
- `request.id`: Unique correlation ID (`x-request-id`)
- `customer.plan`: Account tier (`free`, `pro`, `enterprise`)
- `feature.flag`: Active feature flags (`new-checkout`, `v2-search`)
- `user.id`: User ID (`usr_123`)

---

## 3. GitHub Codespaces Networking & Troubleshooting

When developing inside GitHub Codespaces:
- Forwarded public URLs (`https://<codespace>-4318.app.github.dev`) are protected by GitHub OAuth authentication proxies (`HTTP 401 Unauthorized`).
- OpenTelemetry SDK HTTP exporters running inside the Node.js container cannot bypass the GitHub 401 Auth tunnel.
- **Solution**: Configure `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` in `.env`. Local container traffic accesses the OTLP collector directly via loopback on port `4318` without authentication blocks.

---

## 4. Traffic Generator & RCA Simulation

Launch the interactive traffic generator to simulate real-world e-commerce backend traffic:

```bash
npm run traffic
```

### Features:
- Sends concurrent HTTP requests across simulated endpoints (`/login`, `/products`, `/search`, `/checkout`, `/orders`, `/inventory`, `/payment`, `/users`).
- Injects a **bad deployment (`v1.1.0`)** with a 75% failure rate on `/payment` timeouts and 50% failure rate on `/checkout` deadlocks to test Root Cause Analysis (RCA) agents in ClickStack.
