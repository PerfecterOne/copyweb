# 首页 SEO 检查报告 & 优化方案

基于最近建立的 SEO SOP，我对首页进行了全面体检。以下是发现的问题及针对性的优化建议。

---

## 🔍 检查结果总结

| 检查项 | 状态 | 发现的问题 |
| :--- | :--- | :--- |
| **1. Title** | ✅ 优 | 包含品牌词，长度适中。 |
| **2. Description** | ⚠️ 中 | 英文版略长（约180字符），且存在语法小瑕疵（逗号后无空格）。中文版太短，需增加吸引力。 |
| **3. Heading (H1)** | ✅ 优 | 结构清晰，有且仅有一个 H1。 |
| **4. 图片 Alt** | ⚠️ 中 | 部分图片 Alt 标签过于简单（如 "Alex", "1"），不利于图片搜索优化。 |
| **5. Nofollow** | ⚠️ 中 | 外部链接（社交媒体等）未完全统一使用 nofollow。 |
| **6. Robots** | ✅ 优 | 配置正确，允许索引。 |
| **7. Canonical** | ✅ 优 | 已自动生成规范链接。 |
| **8. Schema Markup** | ❌ 缺 | 缺少 JSON-LD 结构化数据（建议增加 Product 或 WebSite 类型）。 |
| **9. Social Media** | ✅ 优 | OG 标签已基础覆盖。 |
| **10. Viewport** | ✅ 优 | 适配配置正确。 |

---

## 💡 拟定的优化方案

### A. 元标签优化 (Title/Description)
**目标**：提升点击率 (CTR) 并修正长度。

- **英文版 (`en/common.json`)**:
  - *原句*: `CopyWeb,the free, ultimate, all-in-one code generator...`
  - *建议*: `CopyWeb: The best free AI code generator to replicate any website design. Convert screenshots, Figma, or URLs to clean code with one click.` (更精练，修正空格)。
- **中文版 (`zh/common.json`)**:
  - *建议*: `CopyWeb - 领先的免费 AI 代码生成器。支持将网页截图、Figma 设计稿或网址一键转换为高质量的前端代码，加速开发效率。`

### B. 结构化数据 (Schema Markup)
**建议**：在首页注入 `WebSite` 和 `Product` 数据，让谷歌搜索结果显示搜索框或评分。

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "CopyWeb",
  "url": "https://copyweb.net",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://copyweb.net/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### C. 图片 Alt 属性优化
**目标**：提升谷歌图片搜索排名。

- **Testimonials**: 将 "Alex" 改为 "Alex Chen - Frontend Developer using CopyWeb"。
- **Features**: 将 "URL to Code" 改为 "Step 1: Convert live website URL to React/HTML code with CopyWeb AI"。

---

## 🚦 下一步行动

如果您确认上述方案，请回复 **“执行优化”**，我将为您更新以下文件：
1. `src/config/locale/messages/en/common.json` (Description)
2. `src/config/locale/messages/zh/common.json` (Description)
3. `src/config/locale/messages/en/pages/index.json` (Alt tags)
4. `src/app/layout.tsx` (注入 Schema Markup)

**您是否同意以上方案？或有任何特定关键词需要加入？**
