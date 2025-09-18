const { createServer } = require("http");
const next = require("next");
const setupSocket = require("./src/app/lib/socket");

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Middleware CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Tangani preflight request (OPTIONS) dari browser atau klien
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    handle(req, res);
  });

  server.listen(85, () => {
    console.log("✅ Server berjalan di http://localhost:85");
  });

  setupSocket(server);
});
