'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { cn } from '@/shared/lib/utils';
import { Loader2, Terminal, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface WebContainerPreviewProps {
  files: Record<string, string>;
  className?: string;
}

type BootStatus = 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error';

interface LogEntry {
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

// Singleton WebContainer instance (expensive to create)
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

/**
 * Prototype 预览组件 (WebContainers)
 * 在浏览器中运行完整的 Node.js + Next.js 环境
 * 支持 Tailwind CSS 4、oklch、@/ 路径别名等所有特性
 */
export function WebContainerPreview({ files, className }: WebContainerPreviewProps) {
  const [status, setStatus] = useState<BootStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasStartedRef = useRef(false);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev.slice(-50), { type, message, timestamp: new Date() }]);
  }, []);

  // Convert files to WebContainer format
  const convertToWebContainerFiles = useCallback((inputFiles: Record<string, string>) => {
    const result: Record<string, any> = {};
    
    Object.entries(inputFiles).forEach(([path, content]) => {
      // Remove leading slash
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const parts = cleanPath.split('/');
      
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
      
      const fileName = parts[parts.length - 1];
      current[fileName] = { file: { contents: content } };
    });
    
    return result;
  }, []);

  // Boot WebContainer and run project
  const bootAndRun = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      setStatus('booting');
      setError(null);
      addLog('info', '🚀 Starting WebContainer...');

      // Boot WebContainer (reuse existing instance)
      if (!webcontainerInstance) {
        if (!bootPromise) {
          addLog('info', '📦 Booting WebContainer runtime (first time, may take ~30s)...');
          bootPromise = WebContainer.boot();
        }
        webcontainerInstance = await bootPromise;
      }
      
      addLog('success', '✅ WebContainer ready');

      // Mount files
      addLog('info', '📁 Mounting project files...');
      const wcFiles = convertToWebContainerFiles(files);
      await webcontainerInstance.mount(wcFiles);
      addLog('success', `✅ Mounted ${Object.keys(files).length} files`);

      // Install dependencies
      setStatus('installing');
      addLog('info', '📥 Installing dependencies (npm install)...');
      
      const installProcess = await webcontainerInstance.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          // Only log important lines to avoid spam
          if (data.includes('added') || data.includes('ERR') || data.includes('WARN')) {
            addLog('info', data.trim());
          }
        }
      }));

      const installExitCode = await installProcess.exit;
      
      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }
      
      addLog('success', '✅ Dependencies installed');

      // Start dev server
      setStatus('starting');
      addLog('info', '🔧 Starting Next.js dev server...');
      
      // Register server-ready listener BEFORE starting the dev server
      webcontainerInstance.on('server-ready', (port, url) => {
        addLog('success', `✅ Server ready at port ${port}, URL: ${url}`);
        console.log('[WebContainer] Server ready:', { port, url });
        setPreviewUrl(url);
        setStatus('ready');
        setShowLogs(false);
      });
      
      const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
      
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog('info', data.trim());
          // Also check for ready message in output as fallback
          if (data.includes('Ready in') || data.includes('ready started')) {
            addLog('info', '🔍 Detected server ready in output, waiting for server-ready event...');
          }
        }
      }));

    } catch (err) {
      console.error('WebContainer error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus('error');
      addLog('error', `❌ Error: ${errorMessage}`);
    }
  }, [files, convertToWebContainerFiles, addLog]);

  // Start boot when component mounts
  useEffect(() => {
    if (Object.keys(files).length > 0) {
      bootAndRun();
    }
  }, [files, bootAndRun]);

  const handleRetry = useCallback(() => {
    hasStartedRef.current = false;
    setLogs([]);
    setPreviewUrl(null);
    setError(null);
    bootAndRun();
  }, [bootAndRun]);

  const hasFiles = Object.keys(files).length > 0;

  if (!hasFiles) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/20", className)}>
        <p className="text-muted-foreground text-sm">No Prototype files to preview</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full flex flex-col", className)}>
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b text-sm">
        <div className="flex items-center gap-2">
          {status === 'booting' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-blue-600">Booting WebContainer...</span>
            </>
          )}
          {status === 'installing' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              <span className="text-orange-600">Installing dependencies...</span>
            </>
          )}
          {status === 'starting' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              <span className="text-purple-600">Starting dev server...</span>
            </>
          )}
          {status === 'ready' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Preview ready</span>
              {previewUrl && (
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-blue-600 hover:underline"
                >
                  Open in new tab ↗
                </a>
              )}
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Error occurred</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <button
              onClick={() => window.open(previewUrl, '_blank')}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Open Preview ↗
            </button>
          )}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted"
          >
            <Terminal className="h-3 w-3" />
            {showLogs ? 'Hide' : 'Show'} Logs
          </button>
          {status === 'error' && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Log Panel */}
        {showLogs && (
          <div className="w-80 bg-gray-900 text-gray-100 p-3 overflow-y-auto font-mono text-xs border-r">
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "py-0.5",
                    log.type === 'error' && "text-red-400",
                    log.type === 'success' && "text-green-400",
                    log.type === 'info' && "text-gray-300"
                  )}
                >
                  {log.message}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Waiting to start...</div>
              )}
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 bg-white">
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="WebContainer Preview"
              allow="cross-origin-isolated"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              {status !== 'error' && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">
                    {status === 'booting' && 'Initializing WebContainer runtime...'}
                    {status === 'installing' && 'Installing npm packages...'}
                    {status === 'starting' && 'Starting Next.js development server...'}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    First boot may take ~30 seconds
                  </p>
                </>
              )}
              {status === 'error' && error && (
                <div className="text-center p-6">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium mb-2">Preview Failed</p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
