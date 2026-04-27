# XiaomiUT 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status: WIP](https://img.shields.io/badge/Status-Work%20In%20Progress-orange)

**XiaomiUT** is a website made to help users find and download official Xiaomi firmware directly from official mirrors. Adfree

> [!WARNING]  
> **This project is currently a Work In Progress (WIP).** > Features may be unstable, incomplete, or subject to major changes. Use with caution.

---

## ✨ Key Features (Planned & In Progress)

* **Smart Search:** Quickly find firmware by device codename 
* **Downloads:** Direct links to official Xiaomi mirrors (bigota/hugeota).
* **Region Support:** China, Global, EEA, India, and more
* **Versatile:** Support for OTA and Fastboot

## Tech Stack

## 🛠 Tech Stack

### Frontend:

* **Framework:** [React 18](https://reactjs.org/) (Vite)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Icons:** [@ant-design/icons](https://ant-design.github.io/icons/)

### Proxy:

* **Platform:** [Cloudflare Workers](https://workers.cloudflare.com/)
* **Runtime:** Edge Runtime (JavaScript)

## Getting Started

### 1. Proxy Configuration

Xiaomi API servers have no CORS policies and browser block direct requests. You have two options:

#### Option A: Use Cloudflare Workers (Fastest)

1. Create a new Worker in your Cloudflare dashboard.
2. Copy the logic from `proxy/workers.js` to your worker.
3. **Important:** Update the `Access-Control-Allow-Origin` header to match your site's domain to ensure proper CORS security:

   ```javascript
   newResponse.headers.set("Access-Control-Allow-Origin", "[https://your-domain.com](https://your-domain.com)");
   ```
4. Deploy and copy the Worker URL.

#### Option B: Use your own Proxy

If you prefer using your own backend (Nginx, Node.js, PHP), ensure it:

* Forwards requests to `update.miui.com` and etc
* Sets User-Agent: `Xiaomi-Update/3.0`
* Handles CORS preflight (OPTIONS requests)

### 2. Frontend Setup

1. Clone the repository:

```sh
git clone [https://github.com/your-username/XiaomiUT.git](https://github.com/your-username/XiaomiUT.git)
cd XiaomiUT/frontend
```

2. Open `src/config.ts` and point the URLs to your proxy:

```typescript
export const API_CONFIG = {
    OTA_BASE_URL: '[https://your-proxy.com/ota](https://your-proxy.com/ota)',
    FASTBOOT_BASE_URL: '[https://your-proxy.com/fastboot](https://your-proxy.com/fastboot)',
    TIMEOUT: 5000,
};
```

3. Install and build:

    ```sh
    npm install
    npm run build
   ```

4. Deploy your `frontend/dist` to your hosting
