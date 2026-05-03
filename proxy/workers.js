const ALLOWED_ORIGINS = [
  "https://miut.siakinnik.com"
];

// 路由映射：键为路径前缀，值为目标服务器的 base URL
const ROUTE_MAP = {
  "/ota/":      "https://update.miui.com",
  "/fastboot/": "https://sgp-api.buy.mi.com/bbs/api/global/phone",
};

export default {
  async fetch(request) {
    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    // 查找匹配的路由
    const prefix = Object.keys(ROUTE_MAP).find(p => path.startsWith(p));
    if (!prefix) {
      return new Response("Not Found", { status: 404 });
    }

    // 截取前缀并构建目标 URL
    // 示例：/fastboot/getlinepackagelist → /getlinepackagelist
    const subPath    = path.slice(prefix.length - 1); // 保留开头的 /
    const targetUrl  = ROUTE_MAP[prefix] + subPath + url.search;

    const headers = new Headers(request.headers);
    headers.set("User-Agent", "Xiaomi-Update/3.0");
    headers.delete("host");

    const proxyRequest = new Request(targetUrl, {
      method:   request.method,
      headers,
      body:     request.method === "POST" ? await request.arrayBuffer() : null,
      redirect: "follow",
    });

    try {
      const response    = await fetch(proxyRequest);
      const newResponse = new Response(response.body, response);
      Object.entries(corsHeaders(request)).forEach(([k, v]) =>
        newResponse.headers.set(k, v)
      );
      return newResponse;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(request) } }
      );
    }
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      "Access-Control-Allow-Origin":  origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age":       "86400",
    };
  }
  return {};
}