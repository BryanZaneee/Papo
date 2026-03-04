const http = require("http");
const crypto = require("crypto");
const { execSync } = require("child_process");

const SECRET = process.env.WEBHOOK_SECRET || "change-me-to-a-real-secret";
const PORT = 9000;
const DEPLOY_SCRIPT = "/var/www/papo/deploy.sh";

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac("sha256", SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const signature = req.headers["x-hub-signature-256"];
    if (!signature || !verifySignature(body, signature)) {
      console.log("[webhook] Invalid signature");
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    try {
      const payload = JSON.parse(body);
      if (payload.ref === "refs/heads/main") {
        console.log("[webhook] Deploying main branch...");
        execSync(`bash ${DEPLOY_SCRIPT}`, { stdio: "inherit" });
        res.writeHead(200);
        res.end("Deployed");
      } else {
        res.writeHead(200);
        res.end("Ignored (not main branch)");
      }
    } catch (err) {
      console.error("[webhook] Deploy failed:", err.message);
      res.writeHead(500);
      res.end("Deploy failed");
    }
  });
});

server.listen(PORT, () => {
  console.log(`[webhook] Listening on port ${PORT}`);
});
