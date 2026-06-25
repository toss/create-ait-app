const https = require("https");
const http = require("http");
const zlib = require("zlib");

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const get = (targetUrl) => {
      const client = targetUrl.startsWith("https") ? https : http;
      const req = client.get(
        targetUrl,
        { headers: { "Accept-Encoding": "gzip, deflate" } },
        (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            get(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
            return;
          }

          let stream = res;
          const encoding = res.headers["content-encoding"];
          if (encoding === "gzip") {
            stream = res.pipe(zlib.createGunzip());
          } else if (encoding === "deflate") {
            stream = res.pipe(zlib.createInflate());
          }

          let data = "";
          stream.setEncoding("utf-8");
          stream.on("data", (chunk) => (data += chunk));
          stream.on("end", () => resolve(data));
          stream.on("error", reject);
        },
      );
      req.on("error", reject);
    };
    get(url);
  });
}

module.exports = { fetchText };
