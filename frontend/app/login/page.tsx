"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { BackgroundLines } from "@/components/ui/background-lines";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // keep using existing authAPI if present; if it fails, fall back to a console log
      if (authAPI?.login) {
        const resp = await authAPI.login(username, password);
        toast.success("Logged in — redirecting...");
        router.push("/dashboard");
        return resp;
      } else {
        console.log("authAPI.login not available. form values:", {
          username,
          password,
          remember,
        });
        toast.success("(dev) login simulated");
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Neobrutalism style shared variables
  const vars = {
    containerBg: "#f5f6f8",
    panelBg: "#ffffff",
    accent: "#ff5c8a",
    border: "#222",
    shadow1: "8px 8px 0 0 rgba(0,0,0,0.14)",
    shadow2: "-6px -6px 0 0 rgba(255,255,255,0.9) inset",
  } as const;

  const styles: { [k: string]: React.CSSProperties } = {
    page: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(135deg, ${vars.containerBg} 0%, #e6eefc 100%)`,
      padding: "3rem",
      fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
    },
    card: {
      width: "min(560px, 90%)",
      background: vars.panelBg,
      border: `6px solid ${vars.border}`,
      boxShadow: `${vars.shadow1}`,
      padding: "28px",
      transform: "translateY(-6px)",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "18px",
    },
    title: {
      fontSize: "30px",
      fontWeight: 1000,
      letterSpacing: "-0.5px",
      color: "#111",
      margin: 0,
    },
    subtitle: {
      margin: 0,
      fontSize: "12px",
      color: "#444",
      opacity: 0.9,
    },
    form: { display: "grid", gap: "12px" },
    label: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#111",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: `4px solid ${vars.border}`,
      outline: "none",
      fontSize: "14px",
      boxShadow: "none",
      background: "#fff",
      color: "#111",
    },
    smallRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "6px",
    },
    button: {
      marginTop: "6px",
      width: "100%",
      padding: "12px 16px",
      background: vars.accent,
      color: "#fff",
      fontWeight: 800,
      border: `6px solid ${vars.border}`,
      cursor: "pointer",
      boxShadow: "10px 10px 0 0 rgba(0,0,0,0.12)",
      transition: "transform 0.06s ease, filter 0.06s ease",
    },
    link: { color: vars.border, fontWeight: 800, textDecoration: "none" },
    footer: {
      marginTop: "14px",
      textAlign: "center",
      fontSize: "13px",
      color: "#444",
    },
  };

  return (
    <main style={styles.page} className="min-h-screen lg:h-screen">
      <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 h-full">
        <h2 className="hidden md:block bg-clip-text text-transparent text-center bg-linear-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
          Commitment
        </h2>
        <section style={styles.card} aria-labelledby="login-heading">
          <header style={styles.header}>
            <div>
              <h1 id="login-heading" style={styles.title}>
                COMMIT
              </h1>
              <p style={styles.subtitle}>Serious habits. Playful stakes.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label htmlFor="username" style={styles.label}>
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
                placeholder="you@domain.com or @handle"
                aria-label="username or email"
              />
            </div>
            <div>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
                aria-label="password"
              />
            </div>

            <div style={styles.smallRow}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  aria-label="remember me"
                />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Remember me
                </span>
              </label>

              <Link href="/forgot" style={styles.link}>
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              style={styles.button}
              disabled={loading}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "translateY(1px)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = "translateY(0px)")
              }
            >
              {loading ? "Processing..." : "Sign in"}
            </button>
          </form>

          <div style={styles.footer}>
            <span>New here?</span>{" "}
            <Link href="/register" style={styles.link}>
              Create an account
            </Link>
          </div>
        </section>
      </BackgroundLines>
    </main>
  );
}
