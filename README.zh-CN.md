# XiaomiUT 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status: WIP](https://img.shields.io/badge/Status-进行中-orange)

**XiaomiUT** 是一个致力于帮助用户直接从官方镜像站获取并下载小米官方固件的开源网站。**纯净无广告。**

> [!WARNING]  
> **本项目目前处于开发阶段 (WIP)。**  
> 功能可能不稳定、不完整或随时发生重大变化。请谨慎使用。

---

## ✨ 核心功能 (开发中)

* **智能搜索：** 通过设备代号 (Codename) 快速定位固件。
* **官方直连：** 提供小米官方镜像站 (bigota/hugeota) 的直接下载链接。
* **多地区覆盖：** 支持中国版、全球版、欧版 (EEA)、印度版等。
* **全版本支持：** 兼容 OTA 卡刷包与 Fastboot 线刷包。

---

## 🛠 技术栈

### 前端 (Frontend):
* **框架：** React 18 (Vite)
* **语言：** TypeScript
* **图标库：** @ant-design/icons

### 代理后端 (Proxy):
* **平台：** Cloudflare Workers
* **运行时：** Edge Runtime (JavaScript)

---

## 快速上手

### 1. 代理配置 (Proxy)

由于小米 API 服务器未配置 CORS 策略，浏览器会拦截直接请求。你必须通过代理访问，有两种方案：

#### 方案 A：使用 Cloudflare Workers (推荐)
1. 在 Cloudflare 面板创建一个新的 Worker。
2. 将项目 `proxy/workers.js` 中的逻辑复制到 Worker 编辑器中。
3. **关键步骤：** 修改 `Access-Control-Allow-Origin` 头部，将其设置为你的前端域名以确保安全：
   ```javascript
   newResponse.headers.set("Access-Control-Allow-Origin", "[https://your-domain.com](https://your-domain.com)");
   ```
4. 部署并记录该 Worker 的 URL。

#### 方案 B：自建后端代理
如果你使用自己的服务器 (Nginx, Node.js, PHP)，请确保：
* 能够转发请求至 `update.miui.com` 等官方域名。
* 强制设置 User-Agent 为：`Xiaomi-Update/3.0`。
* 正确处理 CORS 预检 (OPTIONS 请求)。

### 2. 前端部署

1. 克隆仓库：
   ```sh
   git clone [https://github.com/XiaomiUtils/XiaomiUT.git](https://github.com/XiaomiUtils/XiaomiUT.git)
   cd XiaomiUT/frontend
   ```

2. 修改 `src/config.ts`，将 API 地址指向你的代理服务器：
   ```typescript
   export const API_CONFIG = {
       OTA_BASE_URL: '[https://your-proxy.com/ota](https://your-proxy.com/ota)',
       FASTBOOT_BASE_URL: '[https://your-proxy.com/fastboot](https://your-proxy.com/fastboot)',
       TIMEOUT: 5000,
   };
   ```

3. 安装并构建：
   ```sh
   npm install
   npm run build
   ```

4. 将 `frontend/dist` 目录下的内容上传至你的 Web 托管平台。
