import crypto from "node:crypto";

const TARGET_URL = process.env.TARGET_URL || "http://localhost:5001";

// Routes weighted for realistic e-commerce traffic
const routes = [
  "/products",
  "/products",
  "/products",
  "/search",
  "/search",
  "/login",
  "/inventory",
  "/orders",
  "/orders",
  "/checkout",
  "/payment",
  "/users",
  "/users/slow",
  "/users/error",
];

const tenants = ["acme", "globex", "umbrella", "wayne", "stark", "cyberdyne", "aperture"];
const regions = ["ap-south-1", "us-east-1", "eu-west-1", "ap-northeast-1", "us-west-2"];
const plans = ["free", "pro", "enterprise"];
const featureFlags = ["new-checkout", "v2-search", "legacy-cart"];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getFormattedTime(): string {
  return new Date().toISOString().substring(11, 23);
}

// Global traffic generator counters
let totalRequests = 0;
let successCount = 0;
let errorCount = 0;
let badDeploymentCount = 0;

async function sendRequest() {
  const endpoint = random(routes);
  const requestId = crypto.randomUUID();
  const tenant = random(tenants);
  const region = random(regions);
  const plan = random(plans);
  const featureFlag = random(featureFlags);
  const userId = `usr_${Math.floor(Math.random() * 1000)}`;

  // 25% chance of simulating a "bad deployment" (v1.1.0 regression)
  const isBadDeployment = Math.random() < 0.25;
  const deployment = isBadDeployment ? "v1.1.0" : Math.random() < 0.5 ? "v1.0.1" : "v1.0.0";

  if (isBadDeployment) {
    badDeploymentCount++;
  }

  const startTime = Date.now();
  totalRequests++;

  try {
    const res = await fetch(`${TARGET_URL}${endpoint}`, {
      method: endpoint === "/login" || endpoint === "/checkout" || endpoint === "/payment" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        "x-tenant": tenant,
        "x-region": region,
        "x-deployment": deployment,
        "x-customer-plan": plan,
        "x-feature-flag": featureFlag,
        "x-user-id": userId,
      },
    });

    const duration = Date.now() - startTime;

    if (res.ok) {
      successCount++;
      console.log(
        `[\x1b[36m${getFormattedTime()}\x1b[0m] \x1b[32m${res.status} OK\x1b[0m | ${endpoint.padEnd(14)} | ${duration}ms | tenant:\x1b[33m${tenant.padEnd(8)}\x1b[0m | ver:\x1b[35m${deployment}\x1b[0m | reg:${region}`
      );
    } else {
      errorCount++;
      const text = await res.text();
      console.log(
        `[\x1b[36m${getFormattedTime()}\x1b[0m] \x1b[31m${res.status} ERR\x1b[0m| ${endpoint.padEnd(14)} | ${duration}ms | tenant:\x1b[33m${tenant.padEnd(8)}\x1b[0m | ver:\x1b[31m${deployment}\x1b[0m | \x1b[31m${text.slice(0, 70)}\x1b[0m`
      );
    }
  } catch (err: any) {
    errorCount++;
    const duration = Date.now() - startTime;
    console.log(
      `[\x1b[36m${getFormattedTime()}\x1b[0m] \x1b[41m\x1b[37m FETCH FAILED \x1b[0m | ${endpoint.padEnd(14)} | ${duration}ms | target: ${TARGET_URL} | error: ${err.message}`
    );
  }
}

async function trafficGenerator() {
  console.log(`\n================================================================================`);
  console.log(`🚀 ClickStack Telemetry Traffic Generator Started`);
  console.log(`   Target Server: \x1b[36m${TARGET_URL}\x1b[0m`);
  console.log(`   Monitoring Headers: x-tenant, x-region, x-deployment, x-customer-plan, x-request-id`);
  console.log(`================================================================================\n`);

  let batch = 0;

  while (true) {
    batch++;
    const concurrent = Math.floor(Math.random() * 8) + 1; // 1 to 8 concurrent requests

    await Promise.allSettled(
      Array.from({ length: concurrent }, () => sendRequest())
    );

    // Print summary banner every 20 batches
    if (batch % 20 === 0) {
      console.log(
        `\n\x1b[34m--- Traffic Summary [Batch #${batch}] --- Total: ${totalRequests} | \x1b[32mSuccess: ${successCount}\x1b[34m | \x1b[31mErrors: ${errorCount}\x1b[34m | \x1b[35mv1.1.0 Traffic: ${badDeploymentCount}\x1b[34m ---\x1b[0m\n`
      );
    }

    // Pacing: occasional traffic burst (100ms) vs normal pacing (500ms - 1800ms)
    const isBurst = Math.random() < 0.15;
    const delay = isBurst ? 100 : 500 + Math.floor(Math.random() * 1300);
    await new Promise((r) => setTimeout(r, delay));
  }
}

trafficGenerator().catch((err) => {
  console.error("Traffic Generator crashed:", err);
  process.exit(1);
});
