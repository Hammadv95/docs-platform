"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

type LoginResp = { token: string };

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const authed = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    // Load token from localStorage on refresh
    const t = localStorage.getItem("admin_token") || "";
    if (t) setToken(t);
  }, []);

  function saveToken(t: string) {
    setToken(t);
    localStorage.setItem("admin_token", t);
  }

  function logout() {
    setToken("");
    localStorage.removeItem("admin_token");
    setStatus("Logged out.");
  }

  async function login() {
    setStatus("");
    if (!API_BASE) {
      setStatus("ERROR: NEXT_PUBLIC_API_BASE is missing. Check .env.local and restart npm run dev.");
      return;
    }

    try {
      const body = new URLSearchParams();
      body.set("email", email);
      body.set("password", password);

      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed (${res.status}): ${text}`);
      }

      const data = (await res.json()) as LoginResp;
      saveToken(data.token);
      setStatus("✅ Logged in.");
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Login error"}`);
    }
  }

  async function uploadPdf() {
    setStatus("");
    if (!authed) {
      setStatus("❌ Please login first.");
      return;
    }
    if (!title.trim()) {
      setStatus("❌ Title is required.");
      return;
    }
    if (!file) {
      setStatus("❌ Please choose a PDF file.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("summary", summary || "");
      if (slug.trim()) fd.append("slug", slug.trim());
      fd.append("pdf", file);

      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Upload failed (${res.status}): ${text}`);

      setStatus(`✅ Upload OK: ${text}`);

      // reset inputs
      setTitle("");
      setSummary("");
      setSlug("");
      setFile(null);
      // reset file input UI by forcing refresh
      const fileEl = document.getElementById("pdfFile") as HTMLInputElement | null;
      if (fileEl) fileEl.value = "";
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Upload error"}`);
    }
  }

  async function reindexAll() {
    setStatus("");
    if (!authed) {
      setStatus("❌ Please login first.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/reindex`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`Reindex failed (${res.status}): ${text}`);
      setStatus(`✅ Reindex OK: ${text}`);
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Reindex error"}`);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ margin: 0 }}>Admin</h1>
      <p style={{ color: "#666" }}>
        API: <code>{API_BASE || "(missing env)"}</code>
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>1) Login</h2>

        <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 4 }}
              placeholder="admin@email.com"
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ width: "100%", padding: 10, marginTop: 4 }}
              placeholder="••••••••"
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={login} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Login
            </button>
            <button onClick={logout} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Logout
            </button>
          </div>

          <div style={{ fontSize: 13, color: authed ? "green" : "#999" }}>
            {authed ? "Logged in ✅ (token saved in localStorage)" : "Not logged in"}
          </div>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>2) Upload PDF</h2>

        <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
          <label>
            Title *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 4 }}
              placeholder="e.g., Lease Agreement 2026"
            />
          </label>

          <label>
            Summary
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 4 }}
              placeholder="Short description"
            />
          </label>

          <label>
            Slug (optional)
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 4 }}
              placeholder="e.g., lease-agreement-2026"
            />
          </label>

          <label>
            PDF File *
            <input
              id="pdfFile"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ width: "100%", padding: 10, marginTop: 4 }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={uploadPdf} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Upload
            </button>
            <button onClick={reindexAll} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Reindex All
            </button>
          </div>
        </div>
      </section>

      {status && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#111",
            color: "#0f0",
            borderRadius: 10,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {status}
        </pre>
      )}

      <p style={{ marginTop: 18, color: "#666" }}>
        Tip: After uploading, go back to the home page and search for keywords from your PDF.
      </p>
    </main>
  );
}
