const { createServer } = require("http");
const next = require("next");
const setupSocket = require("./src/app/lib/socket");

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.listen(85, () => {
    console.log("✅ Server berjalan di http://localhost:85");
  });

  setupSocket(server);
});
