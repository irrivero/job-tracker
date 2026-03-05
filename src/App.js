import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase client ---
// These values come from your .env file (never hardcode them here!)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// --- Config ---
const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#FEF3C7", dot: "#F59E0B" },
  first_interview: { label: "1st Interview", color: "#3B82F6", bg: "#DBEAFE", dot: "#3B82F6" },
  second_interview: { label: "2nd Interview", color: "#6366F1", bg: "#E0E7FF", dot: "#6366F1" },
  interview: { label: "Interview 🎯", color: "#8B5CF6", bg: "#EDE9FE", dot: "#8B5CF6" },
  offer: { label: "Offer! 🎉", color: "#10B981", bg: "#D1FAE5", dot: "#10B981" },
  failed_interview: { label: "Failed Interview", color: "#F97316", bg: "#FFF7ED", dot: "#F97316" },
  rejected: { label: "Rejected", color: "#EF4444", bg: "#FEE2E2", dot: "#EF4444" },
  ghosted: { label: "Ghosted", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
};

const STATUS_ORDER = ["pending", "first_interview", "second_interview", "interview", "offer", "failed_interview", "rejected", "ghosted"];

function daysSince(dateStr) {
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const inputStyle = {
  background: "#0F0F13",
  border: "1px solid #2A2A3A",
  color: "#E2E8F0",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  height: 34,
};

// ─────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setError(""); setMessage(""); setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then log in!");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0F0F13", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Mono', 'Fira Code', monospace", color: "#E2E8F0",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');`}</style>
      <div style={{ width: 360, background: "#141420", border: "1px solid #1E1E30", borderRadius: 14, padding: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#fff" }}>
          JOB HUNT <span style={{ color: "#6366F1" }}>TRACKER</span>
        </h1>
        <p style={{ fontSize: 10, color: "#4B5563", letterSpacing: "0.1em", marginBottom: 28 }}>
          {isLogin ? "SIGN IN TO YOUR TRACKER" : "CREATE YOUR ACCOUNT"}
        </p>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.1em", marginBottom: 4 }}>EMAIL</div>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={inputStyle}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.1em", marginBottom: 4 }}>PASSWORD</div>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && <div style={{ fontSize: 11, color: "#EF4444", marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ fontSize: 11, color: "#10B981", marginBottom: 12 }}>{message}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", background: "#6366F1", border: "none",
            color: "#fff", borderRadius: 8, padding: "10px",
            fontSize: 12, cursor: "pointer", letterSpacing: "0.05em",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>

        <button
          onClick={() => { setIsLogin(s => !s); setError(""); setMessage(""); }}
          style={{
            width: "100%", background: "transparent", border: "none",
            color: "#4B5563", fontSize: 10, cursor: "pointer",
            marginTop: 14, letterSpacing: "0.05em",
          }}
        >
          {isLogin ? "No account? Sign up →" : "Already have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN TRACKER
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newApp, setNewApp] = useState({ company: "", appliedDate: "", status: "pending", notes: "" });
  const [ghostDays, setGhostDays] = useState(30);

  // Check if user is already logged in on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load apps from Supabase when user logs in
  useEffect(() => {
    if (user) fetchApps();
  }, [user]);

  // Auto-ghost pending apps older than threshold
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!apps.length) return;
    apps.forEach(a => {
      if (a.status === "pending" && daysSince(a.applied_date) >= ghostDays) {
        updateStatus(a.id, "ghosted", `Auto-ghosted after ${ghostDays} days`);
      }
    });
  }, [ghostDays, apps.length]);

  async function fetchApps() {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("applied_date", { ascending: false });
    if (!error) setApps(data);
    setLoading(false);
  }

  async function addApp() {
    if (!newApp.company || !newApp.appliedDate) return;
    const { data, error } = await supabase
      .from("applications")
      .insert([{
        company: newApp.company,
        applied_date: newApp.appliedDate,
        status: newApp.status,
        notes: newApp.notes,
        user_id: user.id,
      }])
      .select();
    if (!error) {
      setApps(prev => [data[0], ...prev]);
      setNewApp({ company: "", appliedDate: "", status: "pending", notes: "" });
      setShowAdd(false);
    }
  }

  async function updateStatus(id, status, autoNote) {
    const app = apps.find(a => a.id === id);
    const notes = autoNote || app?.notes || "";
    const { error } = await supabase
      .from("applications")
      .update({ status, notes })
      .eq("id", id);
    if (!error) setApps(prev => prev.map(a => a.id === id ? { ...a, status, notes } : a));
  }

  async function updateNotes(id, notes) {
    const { error } = await supabase
      .from("applications")
      .update({ notes })
      .eq("id", id);
    if (!error) setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
  }

  async function deleteApp(id) {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (!error) setApps(prev => prev.filter(a => a.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setApps([]);
  }

  // Wait for auth check before rendering
  if (!authChecked) return null;
  if (!user) return <AuthScreen onAuth={setUser} />;

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);
  const total = apps.length || 1; // avoid division by zero
  const stats = {
    total: apps.length,
    pending: apps.filter(a => ["pending", "first_interview", "second_interview"].includes(a.status)).length,
    responseRate: Math.round((apps.filter(a => !["pending", "ghosted"].includes(a.status)).length / total) * 100),
    interviewRate: Math.round((apps.filter(a => ["interview", "first_interview", "second_interview", "offer", "failed_interview"].includes(a.status)).length / total) * 100),
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0F0F13",
      fontFamily: "'DM Mono', 'Fira Code', monospace",
      color: "#E2E8F0", padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1A1A24; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        select option { background: #1A1A24; color: #E2E8F0; }
        .app-row:hover { background: #1A1A28 !important; }
        .stat-card:hover { transform: translateY(-2px); }
        .del-btn { opacity: 0; transition: opacity 0.2s; }
        .app-row:hover .del-btn { opacity: 1; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "#fff" }}>
              JOB HUNT <span style={{ color: "#6366F1" }}>TRACKER</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4B5563", letterSpacing: "0.1em" }}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase()} · {user.email}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#141420", border: "1px solid #1E1E30", borderRadius: 8, padding: "6px 12px" }}>
              <span style={{ fontSize: 10, color: "#4B5563", letterSpacing: "0.08em" }}>👻 GHOST AFTER</span>
              <select
                value={ghostDays}
                onChange={e => setGhostDays(Number(e.target.value))}
                style={{ background: "transparent", border: "none", color: "#9CA3AF", fontSize: 11, fontFamily: "inherit", cursor: "pointer", outline: "none" }}
              >
                {[14, 21, 30, 45, 60].map(d => <option key={d} value={d}>{d}d</option>)}
              </select>
            </div>
            <button
              onClick={() => setShowAdd(s => !s)}
              style={{ background: showAdd ? "#6366F1" : "#1E1E2E", border: "1px solid #333", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 12, cursor: "pointer", letterSpacing: "0.05em" }}
            >
              {showAdd ? "✕ CANCEL" : "+ ADD"}
            </button>
            <button
              onClick={signOut}
              style={{ background: "transparent", border: "1px solid #1E1E30", color: "#4B5563", borderRadius: 8, padding: "8px 12px", fontSize: 11, cursor: "pointer" }}
            >
              SIGN OUT
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "TOTAL APPLIED", value: stats.total, color: "#6366F1" },
            { label: "RESPONSE RATE", value: `${stats.responseRate}%`, color: "#F59E0B" },
            { label: "INTERVIEW RATE", value: `${stats.interviewRate}%`, color: "#8B5CF6" },
            { label: "ACTIVE", value: stats.pending, color: "#10B981" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ background: "#141420", border: "1px solid #1E1E30", borderRadius: 10, padding: "14px 16px", transition: "transform 0.2s" }}>
              <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.12em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 500, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ background: "#141420", border: "1px solid #1E1E30", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.12em", marginBottom: 10 }}>STATUS BREAKDOWN</div>
          <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 4, overflow: "hidden", background: "#0F0F13" }}>
            {STATUS_ORDER.map(key => {
              const count = apps.filter(a => a.status === key).length;
              if (!count) return null;
              return <div key={key} style={{ flex: count, background: STATUS_CONFIG[key].dot, transition: "flex 0.5s ease" }} title={`${STATUS_CONFIG[key].label}: ${count}`} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 10 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = apps.filter(a => a.status === key).length;
              if (!count) return null;
              return (
                <span key={key} style={{ fontSize: 10, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                  {cfg.label} <span style={{ color: cfg.color, fontWeight: 500 }}>{count}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: "#141420", border: "1px solid #6366F1", borderRadius: 10, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 140px 180px 1fr auto", gap: 8, alignItems: "end" }}>
            {[
              { label: "COMPANY", field: "company", type: "text", placeholder: "Company name" },
              { label: "DATE APPLIED", field: "appliedDate", type: "date", placeholder: "" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                <input type={type} value={newApp[field]} onChange={e => setNewApp(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.1em", marginBottom: 4 }}>STATUS</div>
              <select value={newApp.status} onChange={e => setNewApp(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#4B5563", letterSpacing: "0.1em", marginBottom: 4 }}>NOTES</div>
              <input value={newApp.notes} onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" style={inputStyle} />
            </div>
            <button onClick={addApp} style={{ background: "#6366F1", border: "none", color: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 11, cursor: "pointer", height: 34 }}>ADD</button>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {["all", ...STATUS_ORDER].map(f => {
            const count = f === "all" ? apps.length : apps.filter(a => a.status === f).length;
            if (f !== "all" && !count) return null;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? "#1E1E35" : "transparent",
                border: filter === f ? "1px solid #6366F1" : "1px solid #1E1E30",
                color: filter === f ? "#fff" : "#4B5563",
                borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer", letterSpacing: "0.05em",
              }}>
                {f === "all" ? "ALL" : STATUS_CONFIG[f].label.toUpperCase()} <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: "#141420", border: "1px solid #1E1E30", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 200px 1fr 24px", padding: "8px 16px", fontSize: 9, color: "#374151", letterSpacing: "0.1em", borderBottom: "1px solid #1E1E30" }}>
            <span>COMPANY</span><span>APPLIED</span><span>DAYS</span><span>STATUS</span><span>NOTES</span><span></span>
          </div>

          {loading && (
            <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "#374151" }}>Loading...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "#374151" }}>
              No applications yet — add your first one!
            </div>
          )}

          {!loading && filtered.map((app, i) => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const days = daysSince(app.applied_date);
            return (
              <div key={app.id} className="app-row" style={{
                display: "grid", gridTemplateColumns: "1fr 90px 90px 200px 1fr 24px",
                padding: "10px 16px", alignItems: "center", gap: 8,
                borderBottom: i < filtered.length - 1 ? "1px solid #1A1A24" : "none",
                background: "transparent", transition: "background 0.15s",
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#E2E8F0" }}>{app.company}</span>
                <span style={{ fontSize: 11, color: "#4B5563" }}>{formatDate(app.applied_date)}</span>
                <span style={{ fontSize: 11, color: days > 30 ? "#6B7280" : days > 21 ? "#F59E0B" : "#6B7280" }}>{days}d ago</span>
                <div>
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    style={{ background: cfg.bg, color: cfg.color, border: "none", borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                  >
                    {STATUS_ORDER.map(s => <option key={s} value={s} style={{ background: "#1A1A24", color: "#E2E8F0" }}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <input
                  value={app.notes || ""}
                  onChange={e => updateNotes(app.id, e.target.value)}
                  placeholder="Add note..."
                  style={{ background: "transparent", border: "none", color: "#6B7280", fontSize: 11, fontFamily: "inherit", outline: "none", width: "100%", padding: 0 }}
                />
                <button className="del-btn" onClick={() => deleteApp(app.id)} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#1E1E30", letterSpacing: "0.1em" }}>
          DATA SYNCED TO CLOUD · ACCESSIBLE FROM ANY DEVICE
        </div>
      </div>
    </div>
  );
}