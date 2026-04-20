import homepage from "./index.html";

Bun.serve({
  routes: {
    "/": homepage,
    "/app": homepage,
    "/connect": homepage,
    "/leak": homepage,
  },
  development: {
    hmr: true,
    console: true,
  },
  port: 3000,
});

console.log("Shadow CFO running at http://localhost:3000");
