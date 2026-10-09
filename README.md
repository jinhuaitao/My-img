# 图床 Worker —— 部署指南（含 R2 自动创建与绑定）

本项目是 `workers.js` 的可部署工程化封装。**核心目标：在 Cloudflare 控制台连接 GitHub 部署时，
不需要手动去 R2 页面建桶、也不需要手动配绑定，Wrangler 会自动创建 R2 bucket 并绑定到 `env.BUCKET`。**

---

## 一、原理：一行配置搞定自动创建 + 自动绑定

Cloudflare 的 **Automatic resource provisioning（资源自动供给）** 规则非常简单：

> **绑定里不写资源 ID / 名字，部署时就会自动创建并自动绑定。**

| 资源 | 触发自动供给的写法 | 手动创建时的写法（对照） |
| --- | --- | --- |
| R2 | `{ "binding": "BUCKET" }` ← **不写 `bucket_name`** | `{ "binding": "BUCKET", "bucket_name": "my-bucket" }` |
| KV | `{ "binding": "MY_KV" }` ← 不写 `id` | `{ "binding": "MY_KV", "id": "abc123" }` |
| D1 | `{ "binding": "DB" }` ← 不写 `database_id` | 需要 `database_id` |

本项目 `wrangler.jsonc` 里就是这样写的：

```jsonc
"r2_buckets": [
  { "binding": "BUCKET" }     // 故意不写 bucket_name
]
```

- `binding` 必须叫 **`BUCKET`**，因为 `workers.js` 里用的是 `env.BUCKET`。名字对不上会直接
  报 `env.BUCKET is undefined`。
- 自动创建出来的 bucket 会以 **Worker 名称作为前缀**命名（本项目 Worker 名是 `cf-image-hosting`）。
- 通过 **Dashboard 部署时，bucket 会被创建，但生成的 ID 不会写回你的 Git 仓库** —— 只能在
  控制台里看（见下方「两个坑」）。

---

## 二、部署前必做：开通 R2（最常见的失败原因）

**新账号第一次使用 R2，必须先手动开通一次**：控制台 → 左侧 **R2** → 点同意条款完成开通
（需要绑定支付方式，R2 有免费额度）。

> 没有开通就自动创建 bucket，构建会失败。这是「一键部署」最常见的翻车点。

---

## 三、方式 A：连接 GitHub 自动部署（推荐）

### 1. 把项目推上 GitHub

```bash
cd cf-image-hosting
git init && git add . && git commit -m "init image hosting worker"
git branch -M main
git remote add origin git@github.com:<你的账号>/cf-image-hosting.git
git push -u origin main
```

仓库根目录必须包含：`workers.js`、`wrangler.jsonc`、`package.json`、`.gitignore`。
（`node_modules/` 不要提交，构建时会自动 `npm install`。）

### 2. 在控制台创建 Worker 并连接仓库

**Workers & Pages → Create → Workers → Connect to Git**（或 Import a repository），然后按下面填：

| 配置项 | 填写内容 | 说明 |
| --- | --- | --- |
| Git account / repository | 选择你刚推的仓库 | |
| Git branch | `main` | 生产分支 |
| **Project name** | `cf-image-hosting` | **必须与 `wrangler.jsonc` 里的 `name` 完全一致**，否则自动创建的资源会张冠李戴 |
| **Build command** | `npm install` | 装 wrangler 依赖 |
| **Deploy command** | `npx wrangler deploy` | 默认值，保持不动即可 |

> **API token 不用自己建**：Workers Builds 默认自动生成一个 token，其权限已包含
> `Workers R2 Storage (edit)` 和 `Workers KV Storage (edit)`，**足以创建 R2 bucket**。

### 3. 首次构建发生了什么

```
push 到 main
  └─ Workers Builds 触发
       ├─ npm install                    装 wrangler
       └─ npx wrangler deploy
            ├─ 读取 wrangler.jsonc
            ├─ 发现 r2_buckets 里的 BUCKET 没有 bucket_name
            ├─ 调用 API 自动创建 R2 bucket（以 Worker 名为前缀）
            ├─ 建立绑定 env.BUCKET
            └─ 上传 Worker → 上线
```

构建成功后，去 **Worker → Settings → Bindings** 应该能看到一条
`BUCKET → R2 bucket`；去 **R2 → Overview** 能看到自动建出来的桶。

### 4. 打开页面完成初始化

访问 `https://cf-image-hosting.<你的子域>.workers.dev`，首次进入会显示「系统初始化」，
设置管理员账号密码即可开始使用。

---

## 四、方式 B：本地 wrangler 部署（适合调试）

```bash
cd cf-image-hosting
npm install
npx wrangler login          # 浏览器授权
npx wrangler deploy
```

本地 `wrangler deploy` 与 Dashboard 的一个区别：**它会把自动创建出的资源 ID 写回配置文件**
（Dashboard 不会）。

本地开发不碰线上：

```bash
npx wrangler dev            # 在 .wrangler/ 下创建本地持久化 R2，不消耗线上资源
```

---

## 五、⚠️ 必须知道的两个坑

### 坑 1：Dashboard 部署不会把资源 ID 写回仓库

通过 GitHub 部署时，bucket 被创建了，但 `wrangler.jsonc` 里仍然没有 `bucket_name`。
此时如果你**改成在本地跑 `wrangler deploy`**，Wrangler 会认为「还是没有 ID」→ **再创建一套新桶**，
于是你之前上传的图片全部「消失」（其实是在旧桶里）。

**规避办法**：确定要切到本地 CLI 之前，先去控制台把自动创建的 bucket 名字抄回来，写进配置：

```jsonc
"r2_buckets": [
  { "binding": "BUCKET", "bucket_name": "<控制台里看到的桶名>" }
]
```

### 坑 2：新账号必须先开通 R2

见上文第二节。没开通就构建，报错信息通常比较晦涩。

---

## 六、常见报错速查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 页面能打开但上传报 `env.BUCKET is undefined` | 绑定名不是 `BUCKET`，或配置没生效 | 检查 `wrangler.jsonc` 的 `binding` 与代码里 `env.BUCKET` 是否一致 |
| 构建失败，提示无法创建 bucket | 账号未开通 R2 | 控制台 → R2 → 开通 |
| 构建失败，提示权限不足 | 自定义了 API token 且缺 R2 编辑权限 | 用默认自动生成的 token，或给 token 补 `Workers R2 Storage (edit)` |
| 部署成功但访问 404 | Project name 与 `name` 不一致，部署到了别的 Worker | 让两者完全一致 |
| 列表只显示 1000 张图 | `workers.js` 里 `list({ limit: 1000 })` 写死，无分页 | 见分析报告「功能缺陷」一节 |

---

## 七、上线后建议优先修的问题

`workers.js` 当前版本存在几处安全与功能缺陷（详见 `docs/代码分析报告.md`），
按优先级：

1. **口令明文存 R2 + token 就是 base64(用户名:密码)** —— token 可被无限重放，无法吊销。
2. **`btoa()` 遇到中文用户名/密码直接抛异常** —— 注册即 500。
3. **上传接口不校验类型和大小** —— 任何人都能往桶里塞任意文件。
4. **列表接口写死 `limit: 1000`，无分页** —— 超过 1000 张后旧图从界面消失（数据还在）。
5. **登录无失败限流** —— 可被暴力破解。
