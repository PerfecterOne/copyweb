'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import * as Babel from '@babel/standalone';

// Import all UI components from the whitelist
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Separator } from '@/shared/components/ui/separator';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';

// Import lucide-react icons
import * as LucideIcons from 'lucide-react';

// Import animation and utility libraries for the sandbox
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Import utility functions
import { cn } from '@/shared/lib/utils';

// --- Types ---

interface ComponentScope {
  [key: string]: any;
}

interface VirtualModule {
  exports: any;
}

// --- High-Fidelity UI Foundation (V7.0) ---

// Comprehensive Icon Mapper: AI often uses these names instead of PascalCase Lucide names
const iconAliases: Record<string, string> = {
  figma: 'Figma',
  google: 'Globe',
  globe: 'Globe',
  website: 'Globe',
  image: 'Image',
  img: 'Image',
  prompt: 'Terminal',
  terminal: 'Terminal',
  code: 'Code',
  send: 'Send',
  arrow: 'ArrowRight',
};

const createIcon = (name: string) => {
  return (props: any) => {
    // Try original name, then PascalCase, then alias
    const LookupComponent = (LucideIcons as any)[name] || 
                            (LucideIcons as any)[name.charAt(0).toUpperCase() + name.slice(1)] ||
                            (LucideIcons as any)[iconAliases[name.toLowerCase()]] ||
                            LucideIcons.HelpCircle;
    
    return <LookupComponent size={18} strokeWidth={2} {...props} />;
  };
};

const iconMocks = Object.fromEntries(
  ['Check', 'X', 'Menu', 'Search', 'ChevronDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 
   'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Star', 'Heart', 'Share', 'Settings', 'User',
   'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'Download', 'Upload', 'Trash', 'Edit',
   'Plus', 'Minus', 'Home', 'Globe', 'Loader2', 'ExternalLink', 'Image', 'Figma', 'Terminal',
   'MessageSquare', 'Send', 'Copy', 'Code', 'Rocket', 'Sparkles', 'Zap', 'Play', 'Pause',
   'RefreshCw', 'RotateCw', 'FileText', 'Folder', 'Terminal'
  ].map(name => [name, createIcon(name)])
);

const componentScope: ComponentScope = {
  React,
  ...React,
  ...LucideIcons,
  ...iconMocks,
  // Add lowercase versions for messy AI code
  figma: iconMocks.Figma,
  globe: iconMocks.Globe,
  image: iconMocks.Image,
  terminal: iconMocks.Terminal,
  motion, AnimatePresence,
  useTheme,
  clsx, twMerge,
  cn,
  Button,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Input, Label, Checkbox, Badge, Avatar, AvatarFallback, AvatarImage,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Separator, Switch, Textarea, Progress, Skeleton,
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  ScrollArea, RadioGroup, RadioGroupItem,
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
};

// --- Execution & Injection ---

/**
 * Normalizes paths like '@/components/hero' or './hero' into the internal file tree keys
 */
/**
 * Heuristic path resolution: handles aliases, relative paths, and missing roots like src/ or app/
 * Normalizes all paths to match available file keys regardless of leading slashes.
 */
function resolvePath(path: string, currentPath: string, availableFiles: string[]): string | null {
  const extensions = ['.tsx', '.ts', '.jsx', '.js', '.css'];
  
  // 1. Normalize available files (remove leading slashes for comparison)
  const normalizedFiles = availableFiles.map(f => f.startsWith('/') ? f.slice(1) : f);
  const fileMap = new Map<string, string>(); // normalized -> original
  availableFiles.forEach((f, i) => fileMap.set(normalizedFiles[i], f));

  // 2. Clean up target path
  let target = path.startsWith('@/') ? path.replace('@/', '') : path;
  
  // Handle relative paths
  if (target.startsWith('./') || target.startsWith('../')) {
    const currentDir = currentPath.split('/').filter(Boolean);
    if (currentDir.length > 0) currentDir.pop(); // remove filename
    
    const targetParts = target.split('/').filter(p => p !== '.');
    let resultParts = [...currentDir];
    for (const part of targetParts) {
      if (part === '..') {
        resultParts.pop();
      } else {
        resultParts.push(part);
      }
    }
    target = resultParts.join('/');
  }

  // 3. Normalize target (strip leading slash)
  target = target.startsWith('/') ? target.slice(1) : target;

  // 4. Try matching with various root prefixes
  const searchRoots = ['', 'src/', 'app/', 'shared/'];
  for (const root of searchRoots) {
    let rootTarget = target.startsWith(root) ? target : root + target;
    rootTarget = rootTarget.startsWith('/') ? rootTarget.slice(1) : rootTarget;
    
    // Try file directly
    for (const ext of extensions) {
      const withExt = rootTarget.endsWith(ext) ? rootTarget : rootTarget + ext;
      if (fileMap.has(withExt)) return fileMap.get(withExt)!;
    }
    
    // Try index files
    for (const ext of extensions) {
      const withIndex = rootTarget.endsWith('/') ? `${rootTarget}index${ext}` : `${rootTarget}/index${ext}`;
      if (fileMap.has(withIndex)) return fileMap.get(withIndex)!;
    }
  }
  
  return null;
}

/**
 * Main engine to execute virtual files with robust interop
 */
function executeFiles(files: Record<string, any>, scope: ComponentScope) {
  const moduleCache = new Map<string, VirtualModule>();
  const availableFiles = Object.keys(files);

  // 1. Setup a safe React proxy for the executed code to prevent nested html/body tags
  const SafeReact = {
    ...React,
    createElement: (type: any, props: any, ...children: any[]) => {
      // Handle nested html/body: 
      // - html: keep contents
      // - body: render as a div but preserve all props (className, style, etc.)
      if (type === 'html') {
        return React.createElement(React.Fragment, null, ...children);
      }
      if (type === 'body') {
        return React.createElement('div', { 
          ...props, 
          'data-virtual-body': 'true' 
        }, ...children);
      }
      if (type === 'head') {
        return React.createElement('div', { 'data-virtual-head': 'true', style: { display: 'none' } }, ...children);
      }
      return React.createElement(type, props, ...children);
    }
  };

  function virtualRequire(path: string, currentFile: string) {
    // A. Runtime Environment Polyfills (Essential for Next.js code to run)
    if (path === 'react') return SafeReact;
    if (path === 'lucide-react') return { ...LucideIcons, __esModule: true };
    if (path === 'framer-motion') return { motion, AnimatePresence, default: motion, __esModule: true };
    if (path === 'next-themes') return { useTheme, __esModule: true };
    if (path === 'clsx') return { default: clsx, clsx, __esModule: true };
    if (path === 'tailwind-merge') return { twMerge, __esModule: true };
    
    if (path === 'next/font/google') {
      return new Proxy({ __esModule: true }, {
        get: (_, prop) => {
          if (prop === '__esModule') return true;
          return () => ({ 
            className: `__className_${prop.toString().toLowerCase()}`, 
            variable: `--font-${prop.toString().toLowerCase()}`,
            style: { fontFamily: "'Inter', sans-serif" } 
          });
        }
      });
    }
    if (path === 'next/link') return { default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>, __esModule: true };
    if (path === 'next/image') return { default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />, __esModule: true };
    if (path === 'next/head' || path === 'next/document') return { default: ({ children }: any) => <>{children}</>, __esModule: true };
    if (path === 'next/navigation') return {
      __esModule: true,
      useRouter: () => ({ push: console.log, replace: console.log, back: () => {}, prefetch: () => {} }),
      usePathname: () => '/',
      useSearchParams: () => new URLSearchParams(),
      useParams: () => ({})
    };
    
    // B. UI Components (Whitelisted)
    if (path.includes('components/ui/')) {
      const name = path.split('/').pop()?.split('.')[0] || '';
      const pascalName = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
      const mainComp = scope[pascalName] || scope[name];
      return { ...scope, default: mainComp, __esModule: true };
    }

    // C. Virtual Local Files
    const resolved = resolvePath(path, currentFile, availableFiles);
    if (!resolved) {
      throw new Error(`Module not found: "${path}" (Imported from: ${currentFile})`);
    }

    if (moduleCache.has(resolved)) return moduleCache.get(resolved)!.exports;

    const fileContent = typeof files[resolved] === 'string' ? files[resolved] : (files[resolved]?.code || '');
    const module: VirtualModule = { exports: {} };
    moduleCache.set(resolved, module);

    // Skip Babel transformation for CSS files
    if (resolved.endsWith('.css')) {
      return module.exports;
    }

    try {
      const transpiled = Babel.transform(fileContent, {
        presets: ['react', 'typescript'],
        plugins: [['transform-modules-commonjs', { strict: false }]],
        filename: resolved,
      }).code;

      // 3. Inject SafeReact into the execution scope instead of as a separate parameter
      const executionScope = { ...scope, React: SafeReact };

      const execute = new Function('require', 'exports', 'module', ...Object.keys(executionScope), transpiled!);
      execute(
        (p: string) => virtualRequire(p, resolved), 
        module.exports, 
        module, 
        ...Object.values(executionScope)
      );

      return module.exports;
    } catch (err) {
      console.error(`[Preview] Execution Error in ${resolved}:`, err);
      throw err;
    }
  }

  // --- Entry Point Resolution ---
  const entryPath = availableFiles.find(f => f.includes('page.tsx')) || availableFiles.find(f => f.endsWith('.tsx')) || '';
  const layoutPath = availableFiles.find(f => f.includes('layout.tsx'));

  if (!entryPath) throw new Error('Could not find entry point (page.tsx).');

  const PageModule = virtualRequire(entryPath, 'root');
  const LayoutModule = layoutPath ? virtualRequire(layoutPath, 'root') : null;

  // Robust Component Extraction: Default -> Page -> Component -> First Exported Function
  const extract = (mod: any) => {
    if (!mod) return null;
    if (typeof mod === 'function') return mod;
    if (mod.default) return mod.default;
    if (mod.Page) return mod.Page;
    if (mod.App) return mod.App;
    // Fallback: search for first exported function
    const firstExport = Object.values(mod).find(v => typeof v === 'function');
    return firstExport || null;
  };

  const PageComponent = extract(PageModule);
  const LayoutComponent = extract(LayoutModule);

  if (!PageComponent && typeof PageModule !== 'function') {
    throw new Error(`The file "${entryPath}" does not export a valid React component.`);
  }

  return { PageComponent, LayoutComponent };
}

// --- Components ---

function LoadingPreview() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  );
}

function ErrorPreview({ error }: { error: string }) {
  return (
    <div className="p-8 bg-red-50 text-red-700 min-h-screen border-t-4 border-red-500">
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
        <LucideIcons.AlertTriangle className="w-5 h-5" />
        Preview Engine Error
      </h3>
      <pre className="text-sm bg-white/50 p-4 rounded overflow-auto whitespace-pre-wrap font-mono border border-red-100 italic">
        {error}
      </pre>
      <p className="mt-4 text-xs opacity-75">
        Tip: Check if all imported components are available in the scope or the generated file list.
      </p>
    </div>
  );
}

// --- Main Page ---

export default function PreviewPage() {
  const params = useParams<{ taskId: string }>();
  const searchParams = useSearchParams();
  const taskId = params.taskId;
  const version = searchParams.get('v');

  const [files, setFiles] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [Components, setComponents] = useState<{ Page: any; Layout: any } | null>(null);
  const [css, setCss] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/preview?taskId=${taskId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        
        const fetchedFiles = data.files || {};
        setFiles(fetchedFiles);

        // --- CSS Advanced Processing (V6.0: OKLCH Native Support) ---
        let extractedCss = '';
        const detectedFonts = new Set<string>();

        Object.entries(fetchedFiles).forEach(([path, content]: [string, any]) => {
          if (path.endsWith('.css')) {
            let rawCss = typeof content === 'string' ? content : (content?.code || '');
            
            // 1. Detect and Extract Fonts
            const fontMatches = rawCss.match(/--font-[a-z-]+:\s*([^;]+)/g) || [];
            fontMatches.forEach((m: string) => {
              const fontName = m.split(':')[1].trim().split(',')[0].replace(/['"]/g, '').trim();
              if (fontName && !['sans-serif', 'serif', 'mono', 'system-ui', 'oxanium fallback', 'oxanium', 'inter'].includes(fontName.toLowerCase())) {
                detectedFonts.add(fontName);
              }
              if (m.toLowerCase().includes('oxanium')) detectedFonts.add('Oxanium');
              if (m.toLowerCase().includes('merriweather')) detectedFonts.add('Merriweather');
              if (m.toLowerCase().includes('fira')) detectedFonts.add('Fira Code');
            });

            // 2. Convert @theme inline to :root (preserve oklch colors as-is)
            rawCss = rawCss.replace(/@theme\s+(inline\s*)?\{([\s\S]*?)\}/g, (_match: string, _inline: string, inner: string) => {
              return `:root {\n${inner}\n}`;
            });

            // 3. Cleanup Tailwind v4 directives
            rawCss = rawCss.replace(/@import\s+["'](tailwindcss|tw-animate-css)["'];/g, '');
            rawCss = rawCss.replace(/@custom-variant\s+[^;]+;/g, '');
            rawCss = rawCss.replace(/@utility\s+([^{]+)\{([^}]+)\}/g, '.$1 { $2 }');

            // 4. Replace @layer base with actual rule
            rawCss = rawCss.replace(/@layer\s+base\s*\{([\s\S]*?)\}/g, (_match: string, inner: string) => {
              return inner;
            });

            // 5. Replace @apply with fallback (basic support)
            rawCss = rawCss.replace(/@apply\s+([^;]+);/g, '/* @apply $1 */');

            // 6. Aggressive Selector Remapping
            const remapped = rawCss
              .replace(/(^|[\s,])body(?=[\s,{]|$)/g, '$1[data-virtual-body="true"]')
              .replace(/(^|[\s,])html(?=[\s,{]|$)/g, '$1.preview-runtime');
              
            extractedCss += remapped + '\n';
          }
        });
        
        // Add Tailwind CSS CDN for utility classes with custom theme config
        const loadTailwind = () => {
          if (!document.querySelector('script[src*="tailwindcss"]')) {
            const tw = document.createElement('script');
            tw.src = 'https://cdn.tailwindcss.com';
            
            // Configure Tailwind AFTER it loads
            tw.onload = () => {
              // Wait a tick for Tailwind to initialize
              setTimeout(() => {
                if ((window as any).tailwind) {
                  (window as any).tailwind.config = {
                    theme: {
                      extend: {
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
                }
              }, 100);
            };
            
            document.head.appendChild(tw);
          }
        };
        loadTailwind();
        
        // Add additional Radix/Interact stability CSS with theme variable support
        const stabilityCss = `
          .preview-runtime,
          [data-virtual-body="true"] { 
            --radius: 0.3rem; 
            font-feature-settings: "rlig" 1, "calt" 1;
            background-color: var(--background);
            color: var(--foreground);
          }
          /* Primary button colors */
          .preview-runtime [class*="bg-primary"] {
            background-color: var(--primary) !important;
            color: var(--primary-foreground) !important;
          }
          /* Muted text */
          .preview-runtime [class*="text-muted-foreground"] {
            color: var(--muted-foreground) !important;
          }
          /* Card styles */
          .preview-runtime [class*="bg-card"] {
            background-color: var(--card) !important;
          }
          .preview-runtime [class*="bg-muted"] {
            background-color: var(--muted) !important;
          }
          /* Border colors */
          .preview-runtime [class*="border-border"] {
            border-color: var(--border) !important;
          }
          /* Accent colors */
          .preview-runtime [class*="bg-accent"] {
            background-color: var(--accent) !important;
          }
          /* Background color */
          .preview-runtime [class*="bg-background"] {
            background-color: var(--background) !important;
          }
          /* Foreground/text color */
          .preview-runtime [class*="text-foreground"] {
            color: var(--foreground) !important;
          }
          /* Radix/V4 State Management */
          [aria-hidden="true"]:not([data-radix-collection-item]), .hidden { display: none !important; }
          [data-state="inactive"]:not([role="tab"]) { opacity: 0.5; }
          [data-state="active"][role="tab"] { background-color: var(--background); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        `;
        setCss(stabilityCss + extractedCss);

        // Load Google Fonts for detected fonts
        if (detectedFonts.size > 0) {
          const fontList = Array.from(detectedFonts).map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800`).join('&');
          const fontUrl = `https://fonts.googleapis.com/css2?${fontList}&display=swap`;
          if (!document.querySelector(`link[href*="${fontUrl}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = fontUrl;
            document.head.appendChild(link);
          }
        }

        const { PageComponent, LayoutComponent } = executeFiles(fetchedFiles, { ...componentScope, ...LucideIcons });
        setComponents({ Page: PageComponent, Layout: LayoutComponent });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [taskId, version]);

  if (isLoading) return <LoadingPreview />;
  if (error) return <ErrorPreview error={error} />;

  const PageContent = () => (
    <AnimatePresence mode="wait">
      <div key={version || 'initial'} className="h-full w-full">
        {Components?.Page && <Components.Page />}
      </div>
    </AnimatePresence>
  );

  return (
    <div className="preview-runtime overflow-x-hidden min-h-screen">
      <style key={css.length} type="text/tailwindcss" dangerouslySetInnerHTML={{ __html: css }} />
      <TooltipProvider>
        {Components?.Layout ? (
          <Components.Layout>
            <div data-virtual-body="true" className="virtual-page-root">
              <PageContent />
            </div>
          </Components.Layout>
        ) : (
          <div data-virtual-body="true" className="virtual-page-root">
            <PageContent />
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}
