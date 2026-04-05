import { useState, useCallback } from "react";
import Login from "./Login";

const API = "https://0pelfoja45.execute-api.ap-south-1.amazonaws.com";

/* ─────────────────── LIGHTBOX ─────────────────── */
function Lightbox({ img, onClose }) {
  if (!img) return null;
  return (
    <div style={s.lbOverlay} onClick={onClose}>
      <div style={s.lbBox} onClick={(e) => e.stopPropagation()}>
        <button style={s.lbClose} onClick={onClose}>✕</button>
        <img src={img.image_url} alt="" style={s.lbImg} />
        <div style={s.lbMeta}>
          <p style={s.lbName}>{img.image_name || "Untitled"}</p>
          {img.labels && img.labels.length > 0 && (
            <div style={s.lbPills}>
              {img.labels.map((l, i) => (
                <span key={i} style={s.pill}>{l.name || l}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── MAIN APP ─────────────────── */
export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  // Upload queue: [{file, previewUrl, base64, labels, status}]
  const [queue, setQueue] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Vault
  const [images, setImages] = useState([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState(null);

  // Tab
  const [activeTab, setActiveTab] = useState("upload");

  /* ── helpers ── */
  const token = () => localStorage.getItem("token");

  const toBase64 = (file) =>
    new Promise((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.readAsDataURL(file);
    });

  const getConfColor = (c) => {
    const n = parseFloat(c);
    if (n >= 95) return "#4ade80";
    if (n >= 85) return "#facc15";
    return "#f87171";
  };

  /* ── file pick (multi) ── */
  const handleFiles = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const entries = await Promise.all(
      files.map(async (file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: await toBase64(file),
        labels: [],
        status: "idle",
      }))
    );
    setQueue((q) => [...q, ...entries]);
    // reset input so same files can be re-added
    e.target.value = "";
  }, []);

  const removeFromQueue = (idx) =>
    setQueue((q) => q.filter((_, i) => i !== idx));

  const clearQueue = () => setQueue([]);

  /* ── analyze all ── */
  const analyzeAll = async () => {
    if (!queue.length) return;
    setAnalyzing(true);

    const updated = [...queue];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "done") continue;
      updated[i] = { ...updated[i], status: "analyzing" };
      setQueue([...updated]);

      try {
        const res = await fetch(`${API}/process-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ image: updated[i].base64 }),
        });
        const data = await res.json();
        updated[i] = {
          ...updated[i],
          labels: data.labels || [],
          status: data.error ? "error" : "done",
        };
      } catch {
        updated[i] = { ...updated[i], status: "error" };
      }
      setQueue([...updated]);
    }
    setAnalyzing(false);
  };

  /* ── vault ── */
  const loadImages = async () => {
    setLoadingVault(true);
    try {
      const res = await fetch(`${API}/images`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load vault");
    } finally {
      setLoadingVault(false);
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(images.map((img) => img.image_id)));
  const clearSelect = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} image${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;

    setDeleting(true);
    const ids = [...selected];
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`${API}/images/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token()}` },
        })
      )
    );
    const deletedIds = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
    setImages((prev) => prev.filter((img) => !deletedIds.has(img.image_id)));
    setSelected(new Set());
    setDeleteMode(false);
    setDeleting(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) alert(`${failed} image(s) could not be deleted.`);
  };

  /* ── logout ── */
  const logout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setQueue([]);
    setImages([]);
    setSelected(new Set());
    setDeleteMode(false);
    setActiveTab("upload");
    setLightboxImg(null);
  };

  const handleLogin = () => {
    setQueue([]);
    setImages([]);
    setSelected(new Set());
    setDeleteMode(false);
    setActiveTab("upload");
    setLoggedIn(true);
  };

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  const doneCount = queue.filter((q) => q.status === "done").length;

  /* ─────────── RENDER ─────────── */
  return (
    <div style={s.page}>
      <div style={s.orb1} />
      <div style={s.orb2} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .imgCard:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.18) !important; }
      `}</style>

      {/* LIGHTBOX */}
      <Lightbox img={lightboxImg} onClose={() => setLightboxImg(null)} />

      {/* TOPBAR */}
      <div style={s.topbar}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🗄️</span>
          <span style={s.brandText}>Image Vault</span>
        </div>
        <div style={s.topRight}>
          <div style={s.tabs}>
            <button
              style={{ ...s.tabBtn, ...(activeTab === "upload" ? s.tabBtnActive : {}) }}
              onClick={() => setActiveTab("upload")}
            >
              📤 Analyze
            </button>
            <button
              style={{ ...s.tabBtn, ...(activeTab === "vault" ? s.tabBtnActive : {}) }}
              onClick={() => { setActiveTab("vault"); loadImages(); }}
            >
              📁 My Vault
            </button>
          </div>
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={s.content}>

        {/* ══════════════ UPLOAD TAB ══════════════ */}
        {activeTab === "upload" && (
          <div>
            <div style={s.uploadTopRow}>
              {/* Drop zone */}
              <label style={s.dropzone}>
                <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
                <div style={s.dropPlaceholder}>
                  <span style={{ fontSize: 44 }}>🖼️</span>
                  <p style={s.dropText}>Click to add images</p>
                  <p style={s.dropSub}>Multiple files supported</p>
                </div>
              </label>

              {/* Action panel */}
              <div style={s.actionPanel}>
                <h2 style={s.panelTitle}>Batch Analyze</h2>
                <p style={s.panelSub}>
                  {queue.length === 0
                    ? "No images selected yet"
                    : `${queue.length} image${queue.length > 1 ? "s" : ""} in queue • ${doneCount} analyzed`}
                </p>

                <div style={s.actionBtns}>
                  <button
                    style={{ ...s.primaryBtn, opacity: (!queue.length || analyzing) ? 0.5 : 1 }}
                    onClick={analyzeAll}
                    disabled={!queue.length || analyzing}
                  >
                    {analyzing ? "🔄 Analyzing..." : `🧠 Analyze All (${queue.length})`}
                  </button>
                  {queue.length > 0 && (
                    <button style={s.ghostBtn} onClick={clearQueue} disabled={analyzing}>
                      🗑 Clear Queue
                    </button>
                  )}
                </div>

                <div style={s.legendRow}>
                  <span style={s.legendItem}><span style={{ ...s.dot, background: "rgba(255,255,255,0.2)" }} />Idle</span>
                  <span style={s.legendItem}><span style={{ ...s.dot, background: "#facc15" }} />Analyzing</span>
                  <span style={s.legendItem}><span style={{ ...s.dot, background: "#4ade80" }} />Done</span>
                  <span style={s.legendItem}><span style={{ ...s.dot, background: "#f87171" }} />Error</span>
                </div>
              </div>
            </div>

            {/* Queue grid */}
            {queue.length > 0 ? (
              <div style={s.queueGrid}>
                {queue.map((item, idx) => (
                  <div key={idx} style={s.queueCard}>
                    <div style={{
                      ...s.statusBar,
                      background: item.status === "done" ? "#4ade80"
                        : item.status === "analyzing" ? "#facc15"
                        : item.status === "error" ? "#f87171"
                        : "rgba(255,255,255,0.1)",
                    }} />

                    <div style={s.queueImgWrap}>
                      <img src={item.previewUrl} alt="" style={s.queueImg} />
                      {item.status === "analyzing" && (
                        <div style={s.queueOverlay}>
                          <div style={s.miniSpinner} />
                        </div>
                      )}
                    </div>

                    <div style={s.queueMeta}>
                      <p style={s.queueName} title={item.file.name}>{item.file.name}</p>
                      <button
                        style={s.removeBtn}
                        onClick={() => removeFromQueue(idx)}
                        disabled={item.status === "analyzing"}
                      >✕</button>
                    </div>

                    {item.labels.length > 0 && (
                      <div style={s.queueLabels}>
                        {item.labels.slice(0, 4).map((l, j) => (
                          <div key={j} style={s.queueLabelRow}>
                            <span style={s.queueLabelName}>{l.name}</span>
                            <span style={{ ...s.queueLabelConf, color: getConfColor(l.confidence) }}>
                              {parseFloat(l.confidence).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                        {item.labels.length > 4 && (
                          <p style={s.moreLabels}>+{item.labels.length - 4} more labels</p>
                        )}
                      </div>
                    )}

                    {item.status === "error" && (
                      <p style={s.errorText}>⚠ Analysis failed</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={s.emptyQueue}>
                <span style={{ fontSize: 56, opacity: 0.15 }}>📂</span>
                <p style={{ color: "rgba(255,255,255,0.2)", marginTop: 12, fontSize: 14 }}>
                  Add images above to get started
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ VAULT TAB ══════════════ */}
        {activeTab === "vault" && (
          <div>
            <div style={s.vaultHeader}>
              <div>
                <h2 style={s.panelTitle}>My Vault</h2>
                <p style={s.panelSub}>
                  {images.length} image{images.length !== 1 ? "s" : ""} stored
                  {deleteMode && selected.size > 0 && ` • ${selected.size} selected`}
                </p>
              </div>
              <div style={s.vaultActions}>
                {!deleteMode ? (
                  <>
                    <button style={s.refreshBtn} onClick={loadImages} disabled={loadingVault}>
                      {loadingVault ? "🔄" : "↻ Refresh"}
                    </button>
                    {images.length > 0 && (
                      <button style={s.deleteToggleBtn} onClick={() => setDeleteMode(true)}>
                        🗑 Delete Mode
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button style={s.selectAllBtn} onClick={selected.size === images.length ? clearSelect : selectAll}>
                      {selected.size === images.length ? "Deselect All" : "Select All"}
                    </button>
                    <button
                      style={{ ...s.confirmDeleteBtn, opacity: (!selected.size || deleting) ? 0.5 : 1 }}
                      onClick={deleteSelected}
                      disabled={!selected.size || deleting}
                    >
                      {deleting ? "Deleting..." : `🗑 Delete (${selected.size})`}
                    </button>
                    <button style={s.cancelBtn} onClick={() => { setDeleteMode(false); clearSelect(); }}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {deleteMode && (
              <div style={s.deleteBanner}>
                <span>🗑</span>
                <span>Delete mode active — tap images to select/deselect them, then hit Delete.</span>
              </div>
            )}

            {loadingVault ? (
              <div style={s.loadingWrap}>
                <div style={s.spinner} />
                <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 16, fontSize: 14 }}>Loading your vault...</p>
              </div>
            ) : images.length === 0 ? (
              <div style={s.emptyVault}>
                <span style={{ fontSize: 56, opacity: 0.25 }}>📭</span>
                <p style={{ color: "rgba(255,255,255,0.3)", marginTop: 12 }}>No images yet. Upload some!</p>
              </div>
            ) : (
              <div style={s.grid}>
                {images.map((img, i) => {
                  const isSelected = selected.has(img.image_id);
                  return (
                    <div
                      key={i}
                      className="imgCard"
                      style={{
                        ...s.imgCard,
                        ...(deleteMode && isSelected ? s.imgCardSelected : {}),
                        cursor: deleteMode ? "pointer" : "zoom-in",
                      }}
                      onClick={() => deleteMode ? toggleSelect(img.image_id) : setLightboxImg(img)}
                    >
                      {deleteMode && (
                        <div style={{
                          ...s.checkOverlay,
                          background: isSelected ? "#f87171" : "rgba(0,0,0,0.5)",
                          border: isSelected ? "2px solid #f87171" : "2px solid rgba(255,255,255,0.3)",
                        }}>
                          {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                        </div>
                      )}
                      <div style={s.imgWrap}>
                        <img src={img.image_url} alt="" style={s.gridImg} />
                      </div>
                      <div style={s.imgMeta}>
                        <p style={s.imgName}>{img.image_name || "Untitled"}</p>
                        {img.labels && img.labels.length > 0 && (
                          <div style={s.labelPills}>
                            {img.labels.slice(0, 3).map((l, j) => (
                              <span key={j} style={s.pill}>{l.name || l}</span>
                            ))}
                            {img.labels.length > 3 && (
                              <span style={s.pillMore}>+{img.labels.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */
const s = {
  page: {
    minHeight: "100vh", background: "#0a0a0f",
    fontFamily: "'Segoe UI', sans-serif", color: "#fff",
    position: "relative", overflowX: "hidden",
  },
  orb1: {
    position: "fixed", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
    top: -200, left: -200, pointerEvents: "none", zIndex: 0,
  },
  orb2: {
    position: "fixed", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
    bottom: -150, right: -100, pointerEvents: "none", zIndex: 0,
  },

  /* Lightbox */
  lbOverlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "fadeIn 0.18s ease",
  },
  lbBox: {
    position: "relative",
    background: "rgba(16,16,24,0.97)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 22, padding: 24,
    maxWidth: "90vw", maxHeight: "90vh",
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "0 32px 120px rgba(0,0,0,0.9)",
    animation: "fadeIn 0.18s ease",
  },
  lbClose: {
    position: "absolute", top: 14, right: 14,
    background: "rgba(255,255,255,0.08)", border: "none",
    borderRadius: 8, color: "rgba(255,255,255,0.7)",
    fontSize: 15, cursor: "pointer",
    width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  lbImg: {
    maxWidth: "82vw", maxHeight: "70vh",
    objectFit: "contain", borderRadius: 14, display: "block",
  },
  lbMeta: { padding: "0 2px" },
  lbName: { fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 10px 0", wordBreak: "break-all" },
  lbPills: { display: "flex", flexWrap: "wrap", gap: 6 },

  /* Topbar */
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 32px",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    position: "sticky", top: 0, zIndex: 100,
    backdropFilter: "blur(14px)",
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandIcon: { fontSize: 24 },
  brandText: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" },
  topRight: { display: "flex", alignItems: "center", gap: 16 },
  tabs: {
    display: "flex", background: "rgba(255,255,255,0.05)",
    borderRadius: 10, padding: 3, gap: 3,
  },
  tabBtn: {
    padding: "8px 18px", border: "none", borderRadius: 8,
    background: "transparent", color: "rgba(255,255,255,0.45)",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  tabBtnActive: { background: "rgba(255,255,255,0.1)", color: "#fff" },
  logoutBtn: {
    padding: "8px 18px",
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 9, color: "#f87171",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },

  /* Content */
  content: {
    maxWidth: 1200, margin: "0 auto",
    padding: "36px 24px",
    position: "relative", zIndex: 5,
  },

  /* Upload tab */
  uploadTopRow: {
    display: "grid", gridTemplateColumns: "260px 1fr",
    gap: 24, marginBottom: 28,
  },
  dropzone: {
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px dashed rgba(255,255,255,0.12)",
    borderRadius: 18, cursor: "pointer",
    background: "rgba(255,255,255,0.02)",
    minHeight: 180, transition: "border-color 0.2s",
  },
  dropPlaceholder: { textAlign: "center", padding: 24 },
  dropText: { color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "10px 0 4px 0", fontWeight: 600 },
  dropSub: { color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 },
  actionPanel: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, padding: 28,
  },
  panelTitle: { fontSize: 20, fontWeight: 700, margin: "0 0 4px 0", letterSpacing: "-0.3px" },
  panelSub: { color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 22px 0" },
  actionBtns: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  primaryBtn: {
    padding: "13px", width: "100%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", borderRadius: 12,
    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
    transition: "opacity 0.2s",
  },
  ghostBtn: {
    padding: "11px", width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "rgba(255,255,255,0.55)",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  legendRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.4)" },
  dot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },

  /* Queue */
  queueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 18,
  },
  queueCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, overflow: "hidden",
  },
  statusBar: { height: 3, width: "100%", transition: "background 0.3s" },
  queueImgWrap: { position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#111" },
  queueImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  queueOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  miniSpinner: {
    width: 28, height: 28,
    border: "3px solid rgba(255,255,255,0.15)",
    borderTop: "3px solid #facc15",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  queueMeta: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px 6px 12px",
  },
  queueName: {
    fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "78%",
  },
  removeBtn: {
    background: "rgba(239,68,68,0.15)", border: "none", borderRadius: 6,
    color: "#f87171", fontSize: 11, cursor: "pointer", padding: "3px 7px", flexShrink: 0,
  },
  queueLabels: { padding: "0 12px 12px 12px", display: "flex", flexDirection: "column", gap: 5 },
  queueLabelRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "5px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 7,
  },
  queueLabelName: { fontSize: 12, fontWeight: 600 },
  queueLabelConf: { fontSize: 12, fontWeight: 700 },
  moreLabels: { fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0 0" },
  errorText: { color: "#f87171", fontSize: 12, padding: "0 12px 10px 12px", margin: 0 },
  emptyQueue: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", minHeight: 200,
  },

  /* Vault */
  vaultHeader: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 20,
  },
  vaultActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 4 },
  refreshBtn: {
    padding: "9px 18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "rgba(255,255,255,0.6)",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  deleteToggleBtn: {
    padding: "9px 18px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 10, color: "#f87171",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  selectAllBtn: {
    padding: "9px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "rgba(255,255,255,0.7)",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  confirmDeleteBtn: {
    padding: "9px 18px",
    background: "rgba(239,68,68,0.2)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 10, color: "#f87171",
    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "opacity 0.2s",
  },
  cancelBtn: {
    padding: "9px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "rgba(255,255,255,0.45)",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  deleteBanner: {
    display: "flex", gap: 10, alignItems: "center",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10, padding: "10px 16px",
    color: "#fca5a5", fontSize: 13, marginBottom: 20,
  },
  loadingWrap: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", minHeight: 300,
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  emptyVault: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", minHeight: 300, opacity: 0.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 18,
  },
  imgCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, overflow: "hidden",
    position: "relative", transition: "transform 0.18s, border-color 0.18s",
  },
  imgCardSelected: {
    borderColor: "#f87171 !important",
    background: "rgba(239,68,68,0.08)",
    outline: "2px solid #f87171",
  },
  checkOverlay: {
    position: "absolute", top: 10, right: 10,
    width: 24, height: 24, borderRadius: "50%", zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },
  imgWrap: { aspectRatio: "4/3", overflow: "hidden", background: "rgba(0,0,0,0.3)" },
  gridImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  imgMeta: { padding: "12px 14px" },
  imgName: {
    fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 8px 0",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  labelPills: { display: "flex", flexWrap: "wrap", gap: 5 },
  pill: {
    padding: "3px 9px",
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 20, color: "#a78bfa", fontSize: 11, fontWeight: 600,
  },
  pillMore: {
    padding: "3px 9px", background: "rgba(255,255,255,0.06)",
    borderRadius: 20, color: "rgba(255,255,255,0.35)", fontSize: 11,
  },
};