---
description: 初始化新项目 (Initialization for shipany-template-two)
---

# 项目初始化标准化作业程序 (SOP)

本工作流用于快速初始化基于 `shipany-template-two` 的新项目。

## 准备阶段

> [!CAUTION]
> **重要**: 初始化之前，不要删除当前目录任何内容！如果目录非空，使用临时目录 clone 再合并。

### 0. 配置 Git 账号 (首次使用)

// turbo
```bash
git config --global user.name "Harvest000"
git config --global user.email "3163682104@qq.com"
```

> [!NOTE]
> ShipAny 模板是私有仓库，需要购买后绑定 GitHub 账号才能访问。
> **重要**: 初始化之前，不要删除当前目录任何内容！如果目录非空，使用临时目录 clone 再合并。

1. **Clone 项目仓库**
   
   **方式一** (空目录):
   // turbo
   `git clone https://github.com/shipanyai/shipany-template-two.git .`
   
   **方式二** (非空目录 - 推荐):
   ```bash
   # 1. Clone 到临时目录
   git clone https://github.com/shipanyai/shipany-template-two.git ../temp-shipany
   # 2. 复制所有文件到当前目录 (保留现有文件)
   xcopy /E /I /Y ..\temp-shipany\* .
   # 3. 复制隐藏的 .git 目录
   xcopy /E /I /Y /H ..\temp-shipany\.git .\.git
   # 4. 删除临时目录
   rmdir /S /Q ..\temp-shipany
   ```

2. **了解规则与文档**
   - 阅读全局 rules。
   - 调用 `context7` mcp 阅读文档 [https://shipany.ai/docs](https://shipany.ai/docs)。

## 初始化流程

### 1. 配置环境变量

// turbo
`cp .env.example .env.development`

> [!IMPORTANT]
> 请修改 `.env.development` 中的以下关键项：
> - `NEXT_PUBLIC_APP_URL`: **本地开发必须使用 `http://localhost:3000`**，上线时再改为正式域名
> - `NEXT_PUBLIC_APP_NAME`: 项目名称 (例如 "AI Image")
- `DATABASE_URL`: 数据库连接地址 (必须提供，例如 Supabase 提供的 URL)
- `AUTH_SECRET`: 使用 `openssl rand -base64 32` 生成

> [!CAUTION]
> **常见错误**: 如果在本地开发时设置 `APP_URL` 为线上域名 (如 `https://example.com`)，会导致 `Failed to fetch` 错误，因为 auth 模块无法访问该地址。

生成 `AUTH_SECRET`:
// turbo
`openssl rand -base64 32`

### 2. 数据库配置与迁移

// turbo
`pnpm install`

// turbo
`pnpm db:generate`

// turbo
`pnpm db:migrate`

### 3. 配置权限 (RBAC)

初始化权限列表：
// turbo
`pnpm rbac:init`

### 4. 设置超级管理员

> [!IMPORTANT]
> 执行此步骤前，请确保已提供管理员邮箱 (例如 `admin@mail.com`)。

1. 启动项目：
   // turbo
   `pnpm dev`
2. 访问 `/admin` 并跳转到 `/sign-in` 注册一个账号 (例如 `admin@mail.com`)。
3. 返回终端，为该账号分配超级管理员权限：
   // turbo
   `pnpm rbac:assign -- --email=<ADMIN_EMAIL> --role=super_admin`

## 项目定制化

根据项目需求修改以下内容：

- **基本信息**: `.env.development` 和 `.env.production` (名称、URL)。
- **应用图标**: 
  - 使用 `generate_image` 根据品牌名生成 `public/logo.png` (尺寸: 128*128)。
  - 生成 `logo.png` 后，直接将其复制并重命名为 `public/favicon.ico`。
- **站点地图**: `public/sitemap.xml`。
- **国际化/文案**:
  - 通用文案: `src/config/locale/messages/{locale}/common.json`
  - 落地页文案: `src/config/locale/messages/{locale}/landing.json`
- **主题样式**: `src/config/style/theme.css`。
- **语言支持**: `src/config/locale/index.ts`。

### Content 文件夹配置 (重要)

> [!IMPORTANT]
> `content/` 文件夹下的所有 MDX 文件都必须更新为与核心词相关的内容。

**需要更新的文件**:

| 文件路径 | 更新内容 |
|---------|---------|
| `content/pages/privacy-policy.mdx` | 隐私政策 (EN) - 更新品牌名、域名、联系邮箱 |
| `content/pages/privacy-policy.zh.mdx` | 隐私政策 (ZH) - 中文版本 |
| `content/pages/terms-of-service.mdx` | 服务条款 (EN) - 更新品牌名、域名、免责声明 |
| `content/pages/terms-of-service.zh.mdx` | 服务条款 (ZH) - 中文版本 |
| `content/posts/what-is-xxx.mdx` | 博客文章 (EN) - 重写为产品介绍文章 |
| `content/posts/what-is-xxx.zh.mdx` | 博客文章 (ZH) - 中文版本 |

**更新要点**:
- 将所有 `YourAppName` 替换为实际品牌名
- 将所有 `your-domain.com` 替换为实际域名
- 将联系邮箱更新为 `support@{domain}`
- 根据产品核心功能重写免责声明和产品描述
- 确保中英文双语一致性

## 其他关键配置 (可按需补充)

### 1. 支付与鉴权 (第三方)
> [!NOTE]
> 如果项目涉及支付或社交登录，请在 `.env.development` 中配置：
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Google OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 2. AI 功能配置
- **模型支持**: 配置对应的 API Key (如 OpenRouter, OpenAI)。
- **积分系统**: 在后台管理系统中设定初始赠送积分与 API 售价。

### 3. 分析与增长
- **Google Analytics**: `NEXT_PUBLIC_GA_ID`
- **Google Search Console**: 验证站点所有权。

## SOP 自动化与参数规范 (Agent 指引)

当您启动新项目时，请按照以下规范提供参数，以便我一键执行：

**参数输入规范**:
```text
品牌词: [Brand Name]
域名: [Domain Name]
数据库地址: [DATABASE_URL]
管理员邮箱: [Admin Email]
(可选) 主题: [default/dark/...]

【重要】SEO 关键词:
- 核心词: [如 "nano banana pro", "nano banana pro free"]
- 长尾词: [如 "image to image", "ai image to image", "nanobanana"]

【重要】网站核心内容描述:
[请用 2-3 句话描述您网站的核心功能、目标用户和独特价值]
示例: "AI Image 是一个利用最新 AI 模型（如 GPT-4o、Flux、Sora）一站式生成 image 和 video 的工具站，面向内容创作者和设计师，提供快速、高质量的 AI 生成服务。"
```

> [!CAUTION]
> **SEO 文案是核心竞争力！** 
> 不要简单替换品牌词，需要根据 **网站主题** 和 **核心内容描述** 对所有文案进行 **语义化润色和重写**。

**Agent 执行逻辑**:
1. **生成 Logo**: 使用 brand name 生成 128*128 的 `logo.png` 并同步为 `favicon.ico`。
2. **环境配置**: 
   - `.env.development`: `APP_URL` 设为 `http://localhost:3000`，配置 `APP_NAME`, `DATABASE_URL`。
   - `.env.production`: `APP_URL` 设为正式域名。
3. **初始化**: 执行 `pnpm install`, `db:migrate`, `rbac:init`。
4. **权限分配**: 在您注册账号后，自动执行 `rbac:assign`。
5. **SEO 文案深度优化** (非简单替换):
   扫描 `src/config/locale/messages/{locale}/` 下的 **所有 JSON 文件**，根据用户提供的 **网站核心内容描述** 进行深度润色：
   
   | 文件 | 优化要点 |
   |------|----------|
   | `common.json` | 网站标题、描述、关键词 - 直接影响搜索引擎排名 |
   | `landing.json` | 品牌标语、Header/Footer 文案 - 用户第一印象 |
   | `pages/index.json` | 首页 Hero 区域、功能介绍、FAQ - SEO 核心页面 |
   | `pages/pricing.json` | 产品名称、定价描述 - 转化率关键 |
   | `pages/showcases.json` | 案例描述 - 建立信任 |
   | `ai/*.json` | AI 功能描述 - 与核心业务直接相关 |
   
   **润色原则**:
   - 根据网站定位重写 title、description、keywords
   - 根据核心功能重写功能介绍、FAQ 问答
   - 根据目标用户群体调整语气和用词
   - 确保中英文双语一致性

---

## 常用验证命令

- 检查数据库连接: `psql "<DATABASE_URL>"`
- 检查登录状态接口: `/api/auth/get-session`
- 运行构建测试: `pnpm build`