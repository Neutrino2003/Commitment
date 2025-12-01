"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { BackgroundLines } from "@/components/ui/background-lines";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register(formData);
      toast.success("Registration successful! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.username?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        "Registration failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const vars = {
    containerBg: "#f5f6f8",
    panelBg: "#ffffff",
    border: "#222",
    accent: "#ff5c8a",
    shadow1: "8px 8px 0 0 rgba(0,0,0,0.14)",
    shadow2: "-6px -6px 0 0 rgba(255,255,255,0.9) inset",
  } as const;

  const styles: { [k: string]: React.CSSProperties } = {
    page: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(135deg, ${vars.containerBg} 0%, #e6eefc 100%)`,
      padding: "1.25rem",
      fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
    },
    card: {
      width: "min(540px, 96%)",
      background: vars.panelBg,
      border: `6px solid ${vars.border}`,
      boxShadow: `${vars.shadow1}`,
      padding: "20px",
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
        <section style={styles.card} aria-labelledby="register-heading">
          <header style={styles.header}>
            <div>
              <h1 id="register-heading" style={styles.title}>
                CREATE
              </h1>
              <p style={styles.subtitle}>
                Join Commitment. Serious habits. Playful stakes.
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username and Email side-by-side on md+ screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={styles.label}>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="your username"
                />
              </div>

              <div>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label style={styles.label}>Confirm Password *</label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                minLength={8}
                style={styles.input}
                placeholder="••••••••"
              />
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div style={styles.footer}>
            <span>Already have an account?</span>{" "}
            <Link href="/login" style={styles.link}>
              Login
            </Link>
          </div>
        </section>
      </BackgroundLines>
    </main>
  );
}
