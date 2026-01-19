'use client';

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackCodeEditor,
  SandpackFileExplorer
} from "@codesandbox/sandpack-react";
import { SHADCN_REGISTRY } from './lib/shadcn-registry';
import { cn } from '@/shared/lib/utils';

// 自定义浅色主题 - 匹配预览区域的暖黄色调
const warmLightTheme = {
  colors: {
    surface1: "#FCF7EC", // 暖黄色背景（匹配预览区域的 --background）
    surface2: "#F5EED9", // 略深的暖黄色
    surface3: "#EEE5CC", // 边框等
    clickable: "#6B5E3E", // 可点击元素
    base: "#3D3527",     // 主文字色
    disabled: "#A89F8A", // 禁用色
    hover: "#F0E8D5",    // hover 色
    accent: "#D97706",   // 主色调（橙色）
    error: "#DC2626",
    errorSurface: "#FEE2E2",
  },
  syntax: {
    plain: "#3D3527",
    comment: { color: "#8B7D60", fontStyle: "italic" as const },
    keyword: "#9333EA",
    tag: "#D97706",
    punctuation: "#6B5E3E",
    definition: "#0284C7",
    property: "#D97706",
    static: "#059669",
    string: "#059669",
  },
  font: {
    body: "'Oxanium', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'Fira Code', 'Fira Mono', Menlo, Monaco, monospace",
    size: "13px",
    lineHeight: "20px",
  },
};


interface PrototypePreviewProps {
  files: Record<string, string>;
  className?: string;
  showEditor?: boolean;
}

/**
 * Prototype 预览组件 (Sandpack 源码注入方案)
 * 使用 react-ts 模板实现高性能、高保真预览。
 * 通过虚拟文件系统注入本项目的真实组件源码。
 * 支持 Tailwind CSS 4。
 */
export function PrototypePreview({ files, className, showEditor = false }: PrototypePreviewProps) {
  console.log("SHIPANY: PrototypePreview files prop:", files);
  // 1. 准备基础文件 (移除前导斜杠以确保覆盖模板默认文件)
  const baseFiles: Record<string, string> = {
    "public/index.html": "PLACEHOLDER_INDEX_HTML",

    "src/index.tsx": "PLACEHOLDER_INDEX_TSX",


    "src/next/navigation.tsx": `
import { useMemo } from 'react';
export const useRouter = () => useMemo(() => ({
  push: (url) => console.log('vRouter.push:', url),
  replace: (url) => console.log('vRouter.replace:', url),
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
}), []);
export const usePathname = () => "/";
export const useSearchParams = () => new URLSearchParams();
`,
    "src/next/router.tsx": `
import { useMemo } from 'react';
export const useRouter = () => useMemo(() => ({
  push: (url) => console.log('vRouter.push:', url),
  replace: (url) => console.log('vRouter.replace:', url),
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: "/",
  query: {},
  asPath: "/",
}), []);
export default { useRouter };
`,
    "src/next/link.tsx": `
import React from "react";
export default function Link({ children, href, ...props }: any) {
  return <a href={href} {...props} onClick={(e) => e.preventDefault()}>{children}</a>;
}
`,
    "src/next/font/google.tsx": `
export const Inter = () => ({ className: 'font-sans', variable: '--font-sans' });
export const Oxanium = () => ({ className: 'font-sans', variable: '--font-sans' });
export const Merriweather = () => ({ className: 'font-serif', variable: '--font-serif' });
export const Fira_Code = () => ({ className: 'font-mono', variable: '--font-mono' });
`,
    // 关键：在 node_modules 中创建 next 模块的虚拟文件
    "/node_modules/next/navigation.js": `
export const useRouter = () => ({
  push: (url) => console.log('vRouter.push:', url),
  replace: (url) => console.log('vRouter.replace:', url),
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
});
export const usePathname = () => "/";
export const useSearchParams = () => new URLSearchParams();
`,
    "/node_modules/next/link.js": `
import React from "react";
export default function Link({ children, href, ...props }) {
  return React.createElement('a', { href, ...props, onClick: (e) => e.preventDefault() }, children);
}
`,
    "/node_modules/next/font/google.js": `
export const Inter = () => ({ className: 'font-sans', variable: '--font-sans' });
export const Oxanium = () => ({ className: 'font-sans', variable: '--font-sans' });
export const Merriweather = () => ({ className: 'font-serif', variable: '--font-serif' });
export const Fira_Code = () => ({ className: 'font-mono', variable: '--font-mono' });
`,
    "tsconfig.json": `

{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
`
  };

  // 2. 注入 SHADCN 组件源码
  const registryFiles: Record<string, string> = {};
  const uiComponents = ['button', 'tabs', 'card', 'input', 'label'];
  const utilsCode = SHADCN_REGISTRY['utils.ts'];
  
  registryFiles["src/shared/lib/utils.ts"] = utilsCode;
  registryFiles["src/lib/utils.ts"] = utilsCode;
  uiComponents.forEach(name => {
    const key = `${name}.tsx` as keyof typeof SHADCN_REGISTRY;
    const code = SHADCN_REGISTRY[key];
    registryFiles[`src/shared/components/ui/${name}.tsx`] = code;
    registryFiles[`src/components/ui/${name}.tsx`] = code;
  });

  // 3. 处理用户文件 (含 Next.js 导入预处理)
  const userFiles: Record<string, string> = {};
  let appFileContent = "";
  let globalsCssContent = "";

  // 预处理函数：将 Next.js 导入替换为我们的 mock 路径
  const preprocessNextImports = (code: string): string => {
    return code
      .replace(/from\s+["']next\/navigation["']/g, 'from "@/next/navigation"')
      .replace(/from\s+["']next\/router["']/g, 'from "@/next/router"')
      .replace(/from\s+["']next\/link["']/g, 'from "@/next/link"')
      .replace(/from\s+["']next\/font\/google["']/g, 'from "@/next/font/google"')
      .replace(/from\s+["']next\/image["']/g, 'from "@/next/image"');
  };

  Object.entries(files).forEach(([path, content]) => {
    let cleanPath = path.replace(/^(\.\/|\/)/, '');
    if (cleanPath.startsWith('src/')) cleanPath = cleanPath.slice(4);
    
    // 捕获 globals.css 内容而非过滤
    if (cleanPath.endsWith('globals.css')) {
      globalsCssContent = content;
      return;
    }

    // 对 TypeScript/JavaScript 文件进行预处理
    const processedContent = (cleanPath.endsWith('.tsx') || cleanPath.endsWith('.ts') || cleanPath.endsWith('.jsx') || cleanPath.endsWith('.js'))
      ? preprocessNextImports(content)
      : content;

    // 优先识别 page.tsx 作为主入口
    const isMainEntry = cleanPath.endsWith('page.tsx') || cleanPath.endsWith('App.tsx');
    if (isMainEntry && !cleanPath.includes('components/ui/')) {
      appFileContent = processedContent;
    } else {
      userFiles[`src/${cleanPath}`] = processedContent;
    }
  });

  // 注入 globals.css 到虚拟文件系统
  if (globalsCssContent) {
    userFiles["src/globals.css"] = globalsCssContent;
  }



  // 强制覆盖模板默认的 src/App.tsx
  userFiles["src/App.tsx"] = appFileContent || `
export default function App() {
  return (
    <div className="p-10 border-4 border-dashed border-red-500 rounded-lg">
      <h1 className="text-2xl font-bold text-red-600">SHIPANY: NO ENTRY FOUND</h1>
      <p className="mt-4">Please check the console logs for file list.</p>
    </div>
  );
}
`;

  // 从 globals.css 提取 CSS 变量（:root 和 @theme 块）
  const extractCssVariables = (css: string): string => {
    if (!css) return '';
    
    // 辅助函数：提取匹配大括号的完整块
    const extractBlock = (text: string, startPattern: RegExp): string[] => {
      const results: string[] = [];
      let match;
      const regex = new RegExp(startPattern.source, 'g');
      
      while ((match = regex.exec(text)) !== null) {
        const startIdx = match.index;
        let braceCount = 0;
        let endIdx = startIdx;
        let inBlock = false;
        
        for (let i = startIdx; i < text.length; i++) {
          if (text[i] === '{') {
            braceCount++;
            inBlock = true;
          } else if (text[i] === '}') {
            braceCount--;
            if (inBlock && braceCount === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
        
        if (endIdx > startIdx) {
          results.push(text.slice(startIdx, endIdx));
        }
      }
      return results;
    };

    const matches: string[] = [];
    
    // 提取 :root 块
    matches.push(...extractBlock(css, /:root\s*\{/));
    // 提取 @theme 块
    matches.push(...extractBlock(css, /@theme[^{]*\{/));
    // 提取 .dark 块
    matches.push(...extractBlock(css, /\.dark\s*\{/));
    
    const result = matches.join('\n');
    console.log("SHIPANY: Extracted CSS variables:", result);
    console.log("SHIPANY: Original globals.css:", css.slice(0, 500));
    return result;
  };

  const userCssVariables = extractCssVariables(globalsCssContent);
  
  // 分离 :root/.dark 块和 @theme 块
  const extractRootAndDark = (css: string): string => {
    const matches: string[] = [];
    const rootMatch = css.match(/:root\s*\{[\s\S]*?\}/g);
    if (rootMatch) matches.push(...rootMatch);
    const darkMatch = css.match(/\.dark\s*\{[\s\S]*?\}/g);
    if (darkMatch) matches.push(...darkMatch);
    return matches.join('\n');
  };
  
  const extractThemeBlock = (css: string): string => {
    const match = css.match(/@theme[\s\S]*?\{[\s\S]*?\}/g);
    return match ? match.join('\n') : '';
  };

  const rootAndDarkCss = extractRootAndDark(userCssVariables);
  const themeCss = extractThemeBlock(userCssVariables);

  // 动态生成 index.html（简化版，Tailwind 由 index.tsx 动态注入）
  const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHIPANY PROTOTYPE</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;


  // 动态生成 index.tsx (使用 Tailwind CSS 3.x 配置)
  const indexTsxContent = `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// 0. 加载 Google Fonts
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&family=Merriweather:wght@400;700&display=swap';
document.head.appendChild(fontLink);

// 1. 动态注入 CSS 变量（普通 CSS，让浏览器直接解析 oklch）
const cssVariables = \`
${rootAndDarkCss}

/* 
 * Tailwind 4 透明度类兼容层 - 使用更精确的选择器
 * 只匹配以 "bg-" 开头且不跟着 "hover:" 的类
 * 注意：这些选择器匹配 class 属性以特定值开头或包含空格后跟特定值的情况
 */
[class^="bg-muted/50"], [class*=" bg-muted/50"] { background-color: color-mix(in oklch, var(--muted) 50%, transparent); }
[class^="bg-muted/80"], [class*=" bg-muted/80"] { background-color: color-mix(in oklch, var(--muted) 80%, transparent); }
[class^="bg-card/50"], [class*=" bg-card/50"] { background-color: color-mix(in oklch, var(--card) 50%, transparent); }
[class^="bg-card/30"], [class*=" bg-card/30"] { background-color: color-mix(in oklch, var(--card) 30%, transparent); }
[class^="bg-background/50"], [class*=" bg-background/50"] { background-color: color-mix(in oklch, var(--background) 50%, transparent); }
[class^="bg-background/80"], [class*=" bg-background/80"] { background-color: color-mix(in oklch, var(--background) 80%, transparent); }
[class^="border-border/50"], [class*=" border-border/50"] { border-color: color-mix(in oklch, var(--border) 50%, transparent); }
[class^="border-border/30"], [class*=" border-border/30"] { border-color: color-mix(in oklch, var(--border) 30%, transparent); }

/* CSS Reset for buttons and interactive elements */
button, [type="button"], [type="submit"], [type="reset"] {
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}


html, body, #root { 
  margin: 0; 
  padding: 0; 
  min-height: 100vh;
  overflow-x: hidden; 
  background-color: var(--background); 
  color: var(--foreground); 
  font-family: 'Oxanium', ui-sans-serif, system-ui, sans-serif;
}
\`;


const styleElement = document.createElement('style');
styleElement.textContent = cssVariables;
document.head.appendChild(styleElement);


// 2. 动态注入 Tailwind CSS 3.x CDN
const tailwindScript = document.createElement('script');
tailwindScript.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(tailwindScript);

// 3. 配置 Tailwind 3.x 使用 CSS 变量
tailwindScript.onload = () => {
  // @ts-ignore
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ["'Oxanium'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
          mono: ["'Fira Code'", 'ui-monospace', 'monospace'],
          serif: ["'Merriweather'", 'ui-serif', 'Georgia', 'serif'],
        },
        colors: {
          background: 'var(--background)',
          foreground: 'var(--foreground)',
          card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
          popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
          primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
          secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
          muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
          accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
          destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
          border: 'var(--border)',
          input: 'var(--input)',
          ring: 'var(--ring)',
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
      },
    },
  };


  

  // 渲染 React 应用
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
};

// 备用：如果 Tailwind 加载失败
setTimeout(() => {
  const rootEl = document.getElementById("root");
  if (rootEl && !rootEl.hasChildNodes()) {
    const root = createRoot(rootEl);
    root.render(<App />);
  }
}, 1000);
`;



  // 替换 baseFiles 中的占位符
  baseFiles["public/index.html"] = indexHtmlContent;
  baseFiles["/index.html"] = indexHtmlContent; // 尝试根路径
  baseFiles["src/index.tsx"] = indexTsxContent;
  
  console.log("SHIPANY: Generated index.html:", indexHtmlContent.slice(0, 800));

  const allFiles = { ...baseFiles, ...registryFiles, ...userFiles };


  return (
    <div className={cn("h-full w-full", className)}>
      <SandpackProvider
        theme={warmLightTheme}
        files={allFiles}
        customSetup={{
          entry: "/src/index.tsx",
          dependencies: {
            "lucide-react": "latest",
            "framer-motion": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest",
            "class-variance-authority": "latest",
            "@radix-ui/react-slot": "latest",
            "@radix-ui/react-tabs": "latest",
            "@radix-ui/react-label": "latest",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
        }}
        // @ts-ignore - Sandpack 类型定义不完整，但 alias 在运行时有效
        alias={{
          "@": "/src",
          "next/navigation": "src/next/navigation.tsx",
          "next/router": "src/next/router.tsx",
          "next/link": "src/next/link.tsx",
          "next/font/google": "src/next/font/google.tsx",
        }}


        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          classes: {
            "sp-wrapper": "!h-full !min-h-full !flex !flex-col",
            "sp-layout": "!flex-1 !border-0 !rounded-none !overflow-hidden !h-full",
            "sp-stack": "!h-full !flex-1",
            "sp-preview": "!h-full !flex-1",
            "sp-preview-container": "!h-full !flex-1",
            "sp-preview-iframe": "!h-full !w-full",
            "sp-preview-actions": "!hidden",
            "sp-cube-wrapper": "!hidden",  // 隐藏加载图标
            "sp-loading": "!hidden",       // 隐藏加载文字
            "sp-overlay": "!hidden",       // 隐藏覆盖层
            "sp-progress-bar": "!hidden",  // 隐藏进度条
          },
        }}
      >

        <SandpackLayout className="!h-full !flex-1">
          {showEditor && <SandpackFileExplorer />}
          {showEditor && <SandpackCodeEditor closableTabs showTabs />}
          <SandpackPreview 
            className="!h-full !flex-1 !w-full" 
            showOpenInCodeSandbox={false} 
            showRefreshButton={false}
          />
        </SandpackLayout>

      </SandpackProvider>
    </div>
  );
}
