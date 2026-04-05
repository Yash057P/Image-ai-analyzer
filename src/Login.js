import { useState } from "react";
import { signUp, login, confirmUser } from "./auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup"

  const handleSignup = async () => {
    if (!email || !password) return alert("Email and Password required");
    if (password.length < 6) return alert("Password must be at least 6 characters");
    setLoading(true);
    try {
      await signUp(email, password);
      setIsConfirming(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code) return alert("Enter verification code");
    setLoading(true);
    try {
      await confirmUser(email, code);
      alert("Account confirmed! Now login.");
      setIsConfirming(false);
      setMode("login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Email and Password required");
    setLoading(true);
    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🗄️</div>
          <h1 style={styles.logoText}>Image Vault</h1>
          <p style={styles.logoSub}>Your intelligent image archive</p>
        </div>

        {!isConfirming ? (
          <>
            {/* Tab switcher */}
            <div style={styles.tabRow}>
              <button
                style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </div>

            <div style={styles.fields}>
              <div style={styles.fieldWrap}>
                <span style={styles.fieldIcon}>✉️</span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                />
              </div>

              <div style={styles.fieldWrap}>
                <span style={styles.fieldIcon}>🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                />
              </div>
            </div>

            <button
              style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Login →" : "Create Account →"}
            </button>

            <p style={styles.switchText}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span
                style={styles.switchLink}
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Sign Up" : "Login"}
              </span>
            </p>
          </>
        ) : (
          <>
            <div style={styles.confirmBox}>
              <div style={styles.confirmIcon}>📧</div>
              <h3 style={styles.confirmTitle}>Check your email</h3>
              <p style={styles.confirmSub}>
                We sent a verification code to <strong>{email}</strong>
              </p>
            </div>

            <div style={styles.fields}>
              <div style={styles.fieldWrap}>
                <span style={styles.fieldIcon}>#</span>
                <input
                  placeholder="Verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                />
              </div>
            </div>

            <button
              style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Confirming..." : "Confirm Account ✓"}
            </button>

            <p style={styles.switchText}>
              <span style={styles.switchLink} onClick={() => setIsConfirming(false)}>
                ← Back
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0f",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  orb1: {
    position: "fixed",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
    top: -150,
    left: -150,
    pointerEvents: "none",
  },
  orb2: {
    position: "fixed",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
    bottom: -100,
    right: -100,
    pointerEvents: "none",
  },
  orb3: {
    position: "fixed",
    width: 250,
    height: 250,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
    top: "50%",
    right: "20%",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: 24,
    padding: "40px 36px",
    width: 400,
    position: "relative",
    zIndex: 10,
    boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  logoText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: 700,
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  logoSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    margin: 0,
  },
  tabRow: {
    display: "flex",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: "9px 0",
    border: "none",
    borderRadius: 9,
    background: "transparent",
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 20,
  },
  fieldWrap: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "0 14px",
    transition: "border-color 0.2s",
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 14,
    padding: "13px 0",
    fontFamily: "inherit",
  },
  primaryBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
  },
  switchText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    marginTop: 16,
    marginBottom: 0,
  },
  switchLink: {
    color: "#a78bfa",
    cursor: "pointer",
    fontWeight: 600,
  },
  confirmBox: {
    textAlign: "center",
    marginBottom: 24,
  },
  confirmIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  confirmTitle: {
    color: "#fff",
    fontSize: 20,
    margin: "0 0 6px 0",
    fontWeight: 700,
  },
  confirmSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    margin: 0,
  },
};