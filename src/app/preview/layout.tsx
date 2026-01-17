import Script from 'next/script';

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="preview-container min-h-screen">
      {/* Tailwind CSS via CDN for preview */}
      <Script 
        src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp" 
        strategy="beforeInteractive" 
      />
      
      {/* Enhanced Shadcn/UI Configuration for Tailwind CDN */}
      <Script id="tailwind-config" strategy="beforeInteractive">
        {`
          tailwind.config = {
            darkMode: ["class"],
            theme: {
              container: {
                center: true,
                padding: "2rem",
                screens: { "2xl": "1400px" },
              },
              extend: {
                colors: {
                  // V6.1 Optimized Variable Mapping: Support both raw Hex/RGB and HSL components
                  border: "var(--v3-border, var(--border))",
                  input: "var(--v3-input, var(--input))",
                  ring: "var(--v3-ring, var(--ring))",
                  background: "var(--v3-background, var(--background))",
                  foreground: "var(--v3-foreground, var(--foreground))",
                  primary: {
                    DEFAULT: "var(--v3-primary, var(--primary))",
                    foreground: "var(--v3-primary-foreground, var(--primary-foreground))",
                  },
                  secondary: {
                    DEFAULT: "var(--v3-secondary, var(--secondary))",
                    foreground: "var(--v3-secondary-foreground, var(--secondary-foreground))",
                  },
                  destructive: {
                    DEFAULT: "var(--v3-destructive, var(--destructive))",
                    foreground: "var(--v3-destructive-foreground, var(--destructive-foreground))",
                  },
                  muted: {
                    DEFAULT: "var(--v3-muted, var(--muted))",
                    foreground: "var(--v3-muted-foreground, var(--muted-foreground))",
                  },
                  accent: {
                    DEFAULT: "var(--v3-accent, var(--accent))",
                    foreground: "var(--v3-accent-foreground, var(--accent-foreground))",
                  },
                  popover: {
                    DEFAULT: "var(--v3-popover, var(--popover))",
                    foreground: "var(--v3-popover-foreground, var(--popover-foreground))",
                  },
                  card: {
                    DEFAULT: "var(--v3-card, var(--card))",
                    foreground: "var(--v3-card-foreground, var(--card-foreground))",
                  },
                  // Support for common v4 naming 
                  'color-background': "var(--background)",
                  'color-foreground': "var(--foreground)",
                  'color-primary': "var(--primary)",
                  'color-border': "var(--border)",
                  'color-secondary': "var(--secondary)",
                  'color-muted': "var(--muted)",
                  'color-accent': "var(--accent)",
                  'color-card': "var(--card)",
                  'color-popover': "var(--popover)",
                },
                fontFamily: {
                  sans: ["var(--font-sans)", "Inter", "sans-serif"],
                  mono: ["var(--font-mono)", "monospace"],
                },
                borderRadius: {
                  lg: "var(--radius, 0.5rem)",
                  md: "calc(var(--radius, 0.5rem) - 2px)",
                  sm: "calc(var(--radius, 0.5rem) - 4px)",
                },
                keyframes: {
                  "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                  },
                  "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                  },
                  "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
                  "fade-out": { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
                },
                animation: {
                  "accordion-down": "accordion-down 0.2s ease-out",
                  "accordion-up": "accordion-up 0.2s ease-out",
                  "fade-in": "fade-in 0.2s ease-out",
                  "fade-out": "fade-out 0.2s ease-out",
                },
              }
            }
          }
        `}
      </Script>

      {/* Global CSS for variables, fonts, and Radix support */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          /* Defaults in raw HSL numbers for compatibility with V3-style themes */
          --v3-background: 0 0% 100%;
          --v3-foreground: 222.2 84% 4.9%;
          --background: #ffffff;
          --foreground: #020817;
          --v3-border: 214.3 31.8% 91.4%;
          --border: #e2e8f0;
          --radius: 0.5rem;
        }

        .dark {
          --v3-background: 222.2 84% 4.9%;
          --background: #020817;
        }

        * {
          border-color: var(--border);
        }

        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: var(--font-sans), 'Inter', system-ui, sans-serif;
        }

        /* V7.1 High-Fidelity Design Patch - UI Texture & States */
        :root {
          --v3-primary: 22.1 91.6% 40%; /* Professional Orange for the Prompt Button */
          --border: #f1efeb;
          --v3-border: 45 20% 95%;
          --background: #fbf9f4; /* Match the warm off-white in the reference */
        }

        [data-virtual-body="true"] {
          background-color: var(--background);
          background-image: radial-gradient(at 0% 0%, rgba(255,255,255,0.8) 0%, transparent 50%), 
                            radial-gradient(at 100% 100%, rgba(251,249,244,0.3) 0%, transparent 50%);
          min-height: 100vh;
          font-family: var(--font-sans), 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* High Fidelity Tabs (Figma Style) */
        [role="tablist"] {
          background: #f3f0e8;
          border-radius: 9999px;
          padding: 4px;
          display: inline-flex;
          gap: 2px;
          border: 1px solid rgba(0,0,0,0.03);
        }

        [role="tab"] {
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #706b5f;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 16px;
        }

        [role="tab"][data-state="active"] {
          background: white;
          color: #1a1a1a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.02);
          transform: translateY(-0.5px);
        }

        /* Input & Card Fidelity */
        input, textarea, [data-v3-card] {
          border-radius: 24px !important;
          border-color: #e8e4db !important;
          background: white !important;
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.03);
        }

        /* Orange Action Button (V7.1 Highlight) */
        .premium-action-button {
          background: linear-gradient(135deg, #c26111 0%, #a8510d 100%);
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(181, 89, 13, 0.3);
          transition: transform 0.2s;
        }
        .premium-action-button:hover { transform: scale(1.05); }

        /* Animation & Display */
        [data-state="inactive"] { display: none; }
        [role="tabpanel"][data-state="inactive"] { display: none; }
        [role="tabpanel"][data-state="active"] { display: block; animation: fade-in 0.3s ease-out; }
      `}} />

      {/* Font pre-loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {children}
    </div>
  );
}
