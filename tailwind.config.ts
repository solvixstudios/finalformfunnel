import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
          light: "hsl(var(--brand-light))",
          dark: "hsl(var(--brand-dark))",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        shopify: {
          DEFAULT: "hsl(var(--shopify))",
          foreground: "hsl(var(--shopify-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        surface: "#F8F7F5",
        canvas: "#F4F3F1",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "brand-sm": "0 2px 8px -2px rgba(124, 58, 237, 0.15)",
        "brand": "0 4px 16px -4px rgba(124, 58, 237, 0.2)",
        "brand-lg": "0 8px 32px -8px rgba(124, 58, 237, 0.25)",
        "brand-xl": "0 16px 48px -12px rgba(124, 58, 237, 0.3)",
        "card": "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 20px 40px -12px rgba(0, 0, 0, 0.08)",
        "elevated": "0 12px 40px -8px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "float-gentle": "float-gentle 6s ease-in-out infinite",
        "brand-glow": "brand-glow-pulse 4s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 2.5s ease-in-out infinite",
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
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #7C3AED, #A78BFA)",
        "gradient-brand-dark": "linear-gradient(135deg, #6D28D9, #7C3AED)",
        "gradient-mesh": "radial-gradient(at 40% 20%, hsla(263, 70%, 58%, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(217, 91%, 60%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(263, 85%, 75%, 0.1) 0px, transparent 50%)",
        "gradient-dark-mesh": "radial-gradient(at 40% 20%, hsla(263, 70%, 58%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(217, 91%, 60%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 80%, hsla(263, 85%, 75%, 0.2) 0px, transparent 50%)",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
