// Redeployed: 2026-04-04
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Shadow CFO</h1>
      <p>AI-powered financial decision support</p>
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <h2>API Endpoints</h2>
        <ul>
          <li><code>POST /api/fixes/approve</code> - Approve a fix action</li>
          <li><code>GET /api/fixes?userId=xxx</code> - Get pending fix queue</li>
          <li><code>POST /api/fixes</code> - Add to fix queue</li>
        </ul>
      </div>
    </main>
  );
}
