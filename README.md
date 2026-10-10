# 图床 Worker v9.1 —— 部署指南（含 R2 自动创建与绑定）

一个部署在 Cloudflare Workers 上、用 R2 存图的图床控制台。
**核心目标：在 Cloudflare 控制台连接 GitHub 部署时，不需要手动去 R2 页面建桶、
也不需要手动配绑定，Wrangler 会自动创建 R2 bucket 并绑定到 `env.BUCKET`。**

---

## 项目结构

```
cf-image-hosting/
├─ workers.js              入口：路由 + API + 鉴权 + 安全 + 人机验证（825 行）
├─ ui.js                   前端整页 HTML：设计系统 + 图标精灵 + 应用逻辑（2185 行）
├─ wrangler.jsonc          部署配置（R2 绑定故意不写 bucket_name）
├─ package.json
└─ docs/
   ├─ v9.1-人机验证说明.md   Turnstile 接入、失败放行策略与排障
   ├─ v9.0-改造说明.md       界面与安全重构的完整变更记录与验证结果
   ├─ 代码分析报告.md        v8.8 的问题诊断
   ├─ workers-v8.8-original.js
   └─ screenshots/          界面截图（浅色/深色/移动端/人机验证）
```

## 功能一览

上传（点击 / 拖拽 / 粘贴，3 路并发 + 失败重试 + 可取消）、图库（网格与列表双视图、
搜索、5 种排序、游标分页不限量）、批量管理（全选 / 反选 / 批量复制 / 批量删除）、
详情弹窗（缩放 / 旋转 / 方向键翻页 / 6 种链接格式）、深浅色主题、键盘快捷键、
存储用量统计、账号安全（改密后其它设备强制下线）。

安全方面：随机会话 token + 加盐 SHA-256 口令 + 登录限流 + 上传类型与体积校验 +
SVG 的 CSP 沙箱 + **Cloudflare Turnstile 人机验证（应用内配置，带失败放行保护）**。
详见 `docs/v9.1-人机验证说明.md` 与 `docs/v9.0-改造说明.md`。

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
| 登录页看不到验证框 | 没配密钥，或 Site Key 为空 | 设置页填两把密钥；或点「登录不了？运行人机验证自检」 |
| 验证框显示 Troubleshoot / 报 `110200` | `*.workers.dev` 域名未加入该 widget 的 Hostname Management | 见第七节第 3 步 |
| 报 `400020` | 把 Secret Key 填进了 Site Key 输入框 | 两把密钥填反了，对调 |
| 验证通过但登录仍失败 | Site Key 与 Secret Key 来自两个不同的 widget | 重新从同一个 widget 复制两把密钥 |
| 密钥配置错了，自己被锁在门外 | —— | 已内置失败放行，**不会发生**；实在要手动关，见第八节 |

---

## 七、人机验证（Cloudflare Turnstile）

> 密钥不再需要配成环境变量，**直接填在应用内的「系统设置 → 人机验证」卡片里**。
> 环境变量仍然兼容，且优先级低于应用内配置（应用内为空时自动回退）。

### 1. 在 Cloudflare 控制台创建 widget

**控制台 → Turnstile → Add widget**，模式选 **Managed**（推荐）。
创建后会得到两把密钥：

| 名称 | 用途 | 是否保密 |
| --- | --- | --- |
| **Site Key** | 前端渲染用，会出现在 HTML 里 | 公开值 |
| **Secret Key** | 服务端校验用，只在 Worker 内部使用 | 仅服务端 |

### 2. 填进应用

登录后台 → **系统设置 → 人机验证（Cloudflare Turnstile）**：

| 字段 | 填什么 |
| --- | --- |
| Site Key | 上面那把公开的 Site Key |
| Secret Key | 上面那把保密的 Secret Key |
| 容错模式 | **严格**（推荐）。`宽松` 仅用于调试，任何校验失败都会放行，会显著降低防护强度 |

点 **保存** 后立即生效，无需重新部署。

> **保存时会做三重校验**：两把密钥必须成对填写、必须形如 `0x...`、且不能两把填成同一个值。
> 保存成功后 `/api/settings` **永不回显 Secret Key 明文**，只返回掩码（如 `0x4AAA••••••••k_02`）。

### 3. 必须做的一步：把域名加进 Hostname Management

**`*.workers.dev` 不会自动匹配**，通配符也无效。必须回到该 widget 里显式填写：

> Turnstile → 选中刚建的 widget → **Hostname Management** → 添加
> `cf-image-hosting.<你的子域>.workers.dev`

漏了这一步，前端组件会直接报 **`110200`（域名未授权）**，登录页会显示：

> 域名未授权：控制台 → 该 widget → Hostname Management 里加入当前域名。
> 注意 `*.workers.dev` 需要显式填写，通配符无效。

### 4. 出问题时先点「自检」

设置页有 **自检** 按钮，登录页也有 **「登录不了？运行人机验证自检」** 入口
（登录页这个不需要先登录，正是为了救急）。它会返回：

| 结论 | 含义 | 下一步 |
| --- | --- | --- |
| `未配置` | 还没填密钥 | 填两把密钥 |
| `Secret Key 有效` | 密钥可用 | 若登录页仍无验证框 → 检查 Hostname Management |
| `Secret Key 无效` | 密钥复制不完整 / 与 Site Key 填反了 | 重新复制 |
| `验证服务不可达` | 连不上 `challenges.cloudflare.com` | 稍后重试；此时登录会放行并告警 |
| `已被破窗开关关闭` | 见第八节 | 删除 R2 里的 `.sys_turnstile_off` 对象 |

自检接口按 IP 限流（15 分钟内 10 次），避免被当成放大器。

### 5. 为什么密钥填错了也不会被锁在门外

这是本项目的核心设计，值得单独说明：

> **凡是「非请求方原因」导致的验证失败，一律放行 + 页面告警。**

具体做法是：当用户没带 token 时，服务端会先拿一个**探针 token**
（`XXXX.DUMMY.TOKEN.XXXX`）去问一次 Cloudflare。

- 探针回 `invalid-input-secret` / `missing-input-secret` / `bad-request`
  → 说明**密钥本身是坏的**，与访问者无关 → **放行 + 告警**
- 探针回 `internal-error` / 网络异常
  → 说明**Cloudflare 侧故障** → **放行 + 告警**
- 探针没报配置错（正常应答）
  → 说明密钥是好的，那就是**访问者没做验证** → **照常拦截**

这个判断只依赖密钥自身的有效性，**攻击者无法通过伪造请求体来触发放行**——
`cfError` 之类的客户端上报字段只写日志，绝不参与放行判断。

---

## 八、破窗开关（被锁住时的应急手段）

如果密钥配置错误、而你又不想登录进后台改（比如已经登不进去了），
**不需要动任何配置**——失败放行已经保证你能登进去。

但如果出于安全考虑想**强制关闭**人机验证，用 R2 里的一个空对象即可：

> **控制台 → R2 → 你的 bucket → 添加对象**
> 对象名填 `.sys_turnstile_off`，内容随便填 `1`。

删掉这个对象即恢复。开关与密钥配置**分开存储**，
所以改容错模式、重新保存密钥都**不会**误清这个开关。

---

## 九、v9.x 已修复的问题

### v9.1（人机验证）

1. ~~Turnstile 密钥只能配环境变量，改一次要重新部署~~ → 移到应用内设置页，保存即生效
2. ~~密钥配错就把管理员永久锁在门外~~ → 探针机制区分「密钥坏」与「没验证」，前者放行 + 告警
3. ~~客户端报的错误码看不懂（`110200` 之类）~~ → 前端内置 8 个错误码的中文解释
4. ~~不知道密钥到底有没有生效~~ → 自检端点 + 登录页免登录自检入口
5. ~~破窗开关会和密钥一起被清掉~~ → 开关独立存 R2，且留空/`"0"` 不生效，避免误触

### v9.0（界面与安全重构）

v8.8 存在以下缺陷，本次已全部修掉（详见 `docs/v9.0-改造说明.md`）：

1. ~~口令明文存 R2 + token 就是 `base64(用户名:密码)`~~ → 随机 token + 会话表 + 30 天过期 + 可吊销
2. ~~`btoa()` 遇中文用户名/密码直接抛异常~~ → 不再使用 base64 编码凭据
3. ~~上传接口不校验类型和大小~~ → MIME 白名单 + 20 MB 上限 + 文件名净化
4. ~~列表写死 `limit: 1000`，超过后旧图从界面消失~~ → 游标分页，前端自动取完
5. ~~登录无失败限流~~ → 连续 5 次失败锁定 15 分钟
6. ~~密码含 `:` 导致永远登录失败~~ → 会话 token 方案下不复存在
7. ~~前端用 Tailwind Play CDN + 不存在的 Font Awesome 图标类名~~ → 自建设计系统 + 内联 SVG 图标

## 十、已知边界

- 图片直链对所有人公开（`/file/<key>` 不需要鉴权），这是图床的预期行为。
  如需私密图片，需要额外加签名 URL 机制。
- 单个 R2 桶扁平存储，不支持文件夹分类；删除即物理删除，没有回收站。
- 图库前端一次性拉取全部对象（上限 2 万条）以便本地搜索与排序；
  超过这个量级需要改成服务端搜索。
- **密钥存在 R2 里，而 R2 的值没有静态加密**（环境变量 Secret 是加密存储的）。
  这是「部署后完全不用碰控制台」换来的代价。若你的威胁模型要求密钥加密存储，
  就改用环境变量方式配置——应用内配置留空即可自动回退。
- 人机验证只保护**登录接口**，不保护上传、列表等已鉴权接口（那些已经需要会话 token）。
- 同一个 Worker 的所有访问者共享一份密钥配置，不支持多租户隔离。

