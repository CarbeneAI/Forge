#!/usr/bin/env bun
/**
 * StatsServer.ts - Tiny HTTP server serving SemanticMemory usage stats.
 * Runs on port 8084. Configure your reverse proxy to expose it externally.
 */

import { computeUsageStats, readUsageStats } from "../src/usage-tracker.js";

const PORT = 8084;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers for homepage access
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), { headers });
    }

    if (url.pathname === "/stats") {
      // Recompute fresh stats on each request
      const stats = computeUsageStats();
      return new Response(JSON.stringify(stats), { headers });
    }

    if (url.pathname === "/stats/cached") {
      // Return cached stats (faster, no recomputation)
      const stats = readUsageStats() ?? computeUsageStats();
      return new Response(JSON.stringify(stats), { headers });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers,
    });
  },
});

console.log(`[StatsServer] SemanticMemory stats API running on port ${PORT}`);
console.log(`[StatsServer] Endpoints: /health, /stats, /stats/cached`);
