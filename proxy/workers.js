export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    let targetUrl = "";
    if (path.startsWith("/ota/")) {
      targetUrl = "https://update.miui.com" + path.replace("/ota/", "/");
    } else if (path.startsWith("/fastboot/")) {
      targetUrl = "https://update.miui.com" + path.replace("/fastboot/", "/");
    } else {
      return new Response("Not Found", { status: 404 });
    }

    targetUrl += url.search;

    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://miut.siakinnik.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: {
        "Host": new URL(targetUrl).host,
        "User-Agent": "Xiaomi-Update/3.0",
        "Content-Type": request.headers.get("Content-Type") || "application/x-www-form-urlencoded",
      },
      body: request.method === "POST" ? await request.arrayBuffer() : null,
      redirect: "follow"
    });

    try {
      const response = await fetch(proxyRequest);
      const newResponse = new Response(response.body, response);
      
      newResponse.headers.set("Access-Control-Allow-Origin", "https://miut.siakinnik.com");
      newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");
      
      return newResponse;
    } catch (e) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  }
}