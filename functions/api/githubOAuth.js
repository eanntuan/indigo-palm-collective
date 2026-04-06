const https = require("https");

const CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET;
const ALLOWED_ORIGIN = "https://indigopalm.co";

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// Step 1: redirect to GitHub OAuth
exports.authStart = (req, res) => {
  setCorsHeaders(res);
  const state = Math.random().toString(36).substring(2);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "public_repo,repo",
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

// Step 2: GitHub redirects back here with a code — exchange for token
exports.authCallback = (req, res) => {
  setCorsHeaders(res);
  const { code } = req.query;
  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  const body = JSON.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
  });

  const options = {
    hostname: "github.com",
    path: "/login/oauth/access_token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const ghReq = https.request(options, (ghRes) => {
    let data = "";
    ghRes.on("data", (chunk) => (data += chunk));
    ghRes.on("end", () => {
      try {
        const { access_token } = JSON.parse(data);
        // Send token back to the CMS via postMessage
        const html = `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
<script>
  const token = "${access_token}";
  const msg = "authorization:github:success:" + JSON.stringify({token, provider:"github"});
  window.opener.postMessage(msg, "${ALLOWED_ORIGIN}");
  window.close();
</script>
</body>
</html>`;
        res.send(html);
      } catch (e) {
        res.status(500).send("OAuth error: " + e.message);
      }
    });
  });

  ghReq.on("error", (e) => res.status(500).send("Request error: " + e.message));
  ghReq.write(body);
  ghReq.end();
};
