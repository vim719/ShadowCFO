// ============================================================================
// Shadow CFO - Backend Server Entry Point (Bun.serve)
// ============================================================================
// This file starts a Bun server that handles Plaid API routes.
// It runs separately from the Next.js frontend (Vercel deployment).
// 
// ARCHITECTURE NOTE (Important!):
// - Frontend: Deployed on Vercel (Next.js)
// - Backend: This Bun server (needs separate deployment: Railway, Fly.io, etc.)
// - Why separate? Vercel serverless functions don't support persistent Bun.serve()
// 
// ROUTES DEFINED HERE:
// 1. POST /api/plaid/link-token  → Generate Plaid Link token
// 2. POST /api/plaid/exchange    → Exchange public token for access token
// 3. POST /api/plaid/transactions → Fetch and store transactions
// ============================================================================

// Import route handlers
import { createLinkToken } from "./routes/plaid/link-token";
import { exchangePublicToken } from "./routes/plaid/exchange";
import { fetchAndStoreTransactions } from "./routes/plaid/transactions";

// ============================================================================
// SANITY TEST: Check environment variables at startup
// ============================================================================
// These console.logs help verify that environment variables are loaded correctly.
// If any show "UNDEFINED", the server won't work properly with Plaid/Supabase.
console.log("🧪 Sanity test (startup):");
console.log("PLAID_CLIENT_ID:", process.env.PLAID_CLIENT_ID ? "✅ OK" : "❌ UNDEFINED!");
console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ OK" : "❌ UNDEFINED!");
console.log("SUPABASE_SERVICE_ROLE:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ OK" : "❌ UNDEFINED!");

// ============================================================================
// Bun.serve - HTTP Server
// ============================================================================
// Bun.serve creates a high-performance HTTP server using Bun's native APIs.
// It's similar to Express but much faster (Bun is written in Zig).
// 
// Why Bun.serve and not Next.js API routes?
// - User requested this pattern (Codex provided the initial code)
// - Bun is faster for heavy API workloads
// - But: Needs separate deployment from Vercel (see architecture note above)
Bun.serve({
  // Define API routes
  routes: {
    // Route 1: Generate Plaid Link Token
    // Frontend calls this to get a token for initializing Plaid Link widget
    "/api/plaid/link-token": {
      POST: async () => {
        try {
          const data = await createLinkToken();
          return Response.json(data); // Send link_token to frontend
        } catch (error) {
          console.error("Link token creation failed:", error);
          return Response.json({ error: "Failed to create link token" }, { status: 500 });
        }
      },
    },

    // Route 2: Exchange Public Token
    // Frontend sends public_token from Plaid Link, we exchange for access_token
    "/api/plaid/exchange": {
      POST: async (req) => {
        try {
          const { public_token } = await req.json();
          
          // Validate input
          if (!public_token) {
            return Response.json({ error: "Missing public_token" }, { status: 400 });
          }

          const data = await exchangePublicToken(public_token);
          return Response.json(data); // Send access_token to frontend
        } catch (error) {
          console.error("Token exchange failed:", error);
          return Response.json({ error: "Failed to exchange token" }, { status: 500 });
        }
      },
    },

    // Route 3: Fetch and Store Transactions
    // Fetches transactions from Plaid and stores them in Supabase
    "/api/plaid/transactions": {
      POST: async (req) => {
        try {
          const { access_token } = await req.json();
          
          // Validate input
          if (!access_token) {
            return Response.json({ error: "Missing access_token" }, { status: 400 });
          }

          const count = await fetchAndStoreTransactions(access_token);
          
          return Response.json({
            success: true,
            inserted: count, // Number of transactions stored
          });
        } catch (error) {
          console.error("Transaction fetch failed:", error);
          return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
        }
      },
    },
  },

  // Error handler for uncaught errors
  error(error: Error) {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

// Log that server is ready
console.log("🚀 Shadow CFO Backend (Bun) is running...");
console.log("   Endpoints:");
console.log("   - POST /api/plaid/link-token");
console.log("   - POST /api/plaid/exchange");
console.log("   - POST /api/plaid/transactions");
