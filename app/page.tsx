// app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

const ASCII_LOGO = `
 ██████╗ ██████╗ ███╗   ██╗██╗   ██╗███████╗██████╗ ███████╗ █████╗ 
██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔════╝██╔══██╗██╔════╝██╔══██╗
██║     ██║   ██║██╔██╗ ██║██║   ██║█████╗  ██████╔╝███████╗███████║
██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══██║
╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ███████╗██║  ██║███████║██║  ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`;

const BOOT_LINES = [
  "BIOS v2026.05.02 — Conversa Systems Inc.",
  "Initializing MCP kernel...",
  "Loading IBM Bob protocol layer... [OK]",
  "Mounting /tools/analyze............. [OK]",
  "Mounting /tools/scan................. [OK]",
  "Mounting /tools/form................. [OK]",
  "Mounting /tools/scrape............... [OK]",
  "Mounting /tools/deploy............... [OK]",
  "Establishing handshake with Bob IDE.. [OK]",
  "JSON-RPC 2.0 transport ready......... [OK]",
  "",
  "██ ALL SYSTEMS OPERATIONAL ██",
  "",
  "> Conversa MCP Server v0.1.0",
  "> Type HELP for available commands",
];

const TOOLS = [
  { cmd: "analyze", args: "--data sales.csv --ask trend", desc: "AI-powered data analysis", color: "#00C853" },
  { cmd: "scan",    args: "--url img.co/ktp.jpg --type ktp", desc: "OCR document extraction", color: "#FF6B35" },
  { cmd: "form",    args: '--desc "Registration form" --lang id', desc: "Form schema generator", color: "#0288D1" },
  { cmd: "scrape",  args: "--url example.com --fmt markdown", desc: "Web content extractor", color: "#F9A825" },
  { cmd: "deploy",  args: "--file page.tsx --msg fix: UI", desc: "Commit & deploy to Vercel", color: "#D81B60" },
];

const MCP_CONFIG = `{
  "mcpServers": {
    "conversa": {
      "url": "https://conversa-bob.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_AUTH_TOKEN>"
      },
      "alwaysAllow": [
        "conversa_analyze_data",
        "conversa_scan_document",
        "conversa_build_form",
        "conversa_scrape_url",
        "conversa_deploy_code"
      ]
    }
  }
}`;

type ThemeMode = "dark" | "light" | "system";

// ── Theme palettes ────────────────────────────────────────
const THEMES = {
  dark: {
    green:  "#00FF41",
    white:  "#E8E8E8",
    muted:  "#7A8A9A",
    dim:    "#4A5568",
    border: "#1E2A38",
    bg:     "#080E14",
    bgCard: "#0C1420",
    bgCode: "#060C12",
    scanline: "rgba(0,255,65,0.03)",
    vignette: "rgba(0,0,0,0.7)",
    bootBg:  "#000",
  },
  light: {
    green:  "#007A29",
    white:  "#111827",
    muted:  "#374151",
    dim:    "#6B7280",
    border: "#D1D5DB",
    bg:     "#F3F4F6",
    bgCard: "#FFFFFF",
    bgCode: "#E9EDF2",
    scanline: "rgba(0,100,40,0.03)",
    vignette: "rgba(200,210,220,0.3)",
    bootBg:  "#000",
  },
};

function getSystemDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode: ThemeMode) {
  if (mode === "system") return getSystemDark() ? THEMES.dark : THEMES.light;
  return THEMES[mode];
}

// ── Icons ─────────────────────────────────────────────────
const Icons: Record<ThemeMode, string> = { dark: "◐", light: "○", system: "◑" };

// ── Boot sequence ─────────────────────────────────────────
function BootSequence({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < BOOT_LINES.length) { setLines(p => [...p, BOOT_LINES[i]]); i++; }
      else { clearInterval(id); setTimeout(() => { setFading(true); setTimeout(onDone, 500); }, 700); }
    }, 75);
    return () => clearInterval(id);
  }, [onDone]);

  function lineColor(line: string) {
    if (!line) return "transparent";
    if (line.includes("[OK]")) return "#00FF41";
    if (line.includes("██")) return "#FFD700";
    if (line.startsWith(">")) return "#00D4FF";
    return "#8A9BAD";
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, opacity: fading ? 0 : 1, transition: "opacity 0.5s", pointerEvents: fading ? "none" : "all" }}>
      <div style={{ fontFamily: "monospace", maxWidth: 720, padding: 32 }}>
        {/* ASCII logo sedikit lebih besar */}
        <pre style={{ color: "#00FF41", fontSize: 9, lineHeight: 1.15, marginBottom: 24, whiteSpace: "pre", overflow: "hidden" }}>{ASCII_LOGO}</pre>
        {lines.map((line, i) => (
          <div key={i} style={{ color: lineColor(line), marginBottom: 3, fontSize: 15, minHeight: 20 }}>{line || "\u00A0"}</div>
        ))}
        <span style={{ display: "inline-block", width: 10, height: 16, background: "#00FF41", verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
      </div>
    </div>
  );
}

// ── Glitch text ───────────────────────────────────────────
function GlitchText({ text, color }: { text: string; color: string }) {
  const [g, setG] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setG(true); setTimeout(() => setG(false), 140); }, 4000 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ color, display: "inline-block", textShadow: g ? `3px 0 #FF3CAC, -3px 0 #00D4FF` : `0 0 28px ${color}50`, transform: g ? "skewX(-2deg)" : "none", transition: "transform 0.05s" }}>
      {text}
    </span>
  );
}

// ── Tool card ─────────────────────────────────────────────
function TerminalCard({ tool, index, C }: { tool: typeof TOOLS[0]; index: number; C: typeof THEMES.dark }) {
  const [hovered, setHovered] = useState(false);
  const [typed, setTyped] = useState("");
  const cmd = `$ conversa ${tool.cmd} ${tool.args}`;

  useEffect(() => {
    if (!hovered) { setTyped(""); return; }
    let i = 0;
    const id = setInterval(() => { if (i < cmd.length) setTyped(cmd.slice(0, ++i)); else clearInterval(id); }, 16);
    return () => clearInterval(id);
  }, [hovered, cmd]);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ border: `1px solid ${hovered ? tool.color + "60" : C.border}`, background: hovered ? `${tool.color}0D` : C.bgCard, padding: "22px 24px", cursor: "default", transition: "all 0.25s", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, borderTop: `2px solid ${tool.color}`, borderLeft: `2px solid ${tool.color}`, opacity: hovered ? 1 : 0.3 }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderBottom: `2px solid ${tool.color}`, borderRight: `2px solid ${tool.color}`, opacity: hovered ? 1 : 0.3 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {/* Index number: naik dari 10 → 13px */}
        <span style={{ fontSize: 13, color: C.dim, letterSpacing: "0.2em" }}>{String(index + 1).padStart(2, "0")}</span>
        {/* Tool name: naik dari 13 → 16px */}
        <span style={{ fontSize: 16, fontWeight: 700, color: tool.color, textShadow: hovered ? `0 0 16px ${tool.color}` : "none", letterSpacing: "0.1em", fontFamily: "monospace" }}>.{tool.cmd}</span>
      </div>
      {/* Command preview: naik dari 10 → 13px */}
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, minHeight: 20, fontFamily: "monospace" }}>
        {hovered
          ? <span><span style={{ color: tool.color }}>$ </span>{typed}<span style={{ display: "inline-block", width: 6, height: 13, background: C.muted, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} /></span>
          : <span style={{ color: C.dim }}>hover to preview command</span>}
      </div>
      {/* Description: naik dari 11 → 14px */}
      <div style={{ fontSize: 14, color: hovered ? C.muted : C.dim, fontFamily: "monospace", transition: "color 0.2s" }}>
        <span style={{ color: C.dim }}>// </span>{tool.desc}
      </div>
    </div>
  );
}

// ── Theme toggle ──────────────────────────────────────────
function ThemeToggle({ mode, onChange, C }: { mode: ThemeMode; onChange: (m: ThemeMode) => void; C: typeof THEMES.dark }) {
  const modes: ThemeMode[] = ["dark", "light", "system"];
  return (
    <div style={{ display: "flex", border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {modes.map(m => (
        <button key={m} onClick={() => onChange(m)}
          style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, letterSpacing: "0.12em", padding: "6px 12px", background: mode === m ? `${C.green}18` : "transparent", border: "none", borderRight: m !== "system" ? `1px solid ${C.border}` : "none", color: mode === m ? C.green : C.dim, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{Icons[m]}</span>
          <span style={{ textTransform: "uppercase" }}>{m}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Home() {
  const [booted, setBooted]       = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [C, setC]                 = useState(THEMES.dark);
  const [copied, setCopied]       = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "test">("config");
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting]     = useState(false);

  const handleDone = useCallback(() => setBooted(true), []);

  useEffect(() => {
    setC(resolveTheme(themeMode));
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setC(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as ThemeMode | null;
      if (saved) setThemeMode(saved);
    }
  }, []);

  const handleTheme = (m: ThemeMode) => {
    setThemeMode(m);
    localStorage.setItem("theme", m);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(MCP_CONFIG);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true); setTestOutput("");
    await new Promise(r => setTimeout(r, 900));
    try {
      const res = await fetch("/api/mcp", {
        headers: {
          "Authorization": "Bearer " + process.env.NEXT_PUBLIC_MCP_AUTH_TOKEN
        }
      });
      const text = await res.text();
      setTestOutput(text || "Response empty");
    } catch (e) {
      setTestOutput("Error: " + String(e));
    }
    setTesting(false);
  };

  const isLight = C === THEMES.light;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanline { 0%{transform:translateY(-100vh)} 100%{transform:translateY(100vh)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes flicker { 0%,96%,100%{opacity:1} 97%{opacity:.93} 99%{opacity:.88} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.green}40}
        ::selection{background:${C.green}25;color:${C.green}}
      `}</style>

      <BootSequence onDone={handleDone} />

      {!isLight && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(transparent, ${C.scanline}, transparent)`, animation: "scanline 12s linear infinite", pointerEvents: "none", zIndex: 50 }} />
      )}

      <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse at center, transparent 50%, ${C.vignette} 100%)`, pointerEvents: "none", zIndex: 40 }} />

      <main style={{ minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "'Share Tech Mono', monospace", opacity: booted ? 1 : 0, transition: "opacity 0.6s, background 0.3s, color 0.3s", animation: booted && !isLight ? "flicker 14s infinite" : "none" }}>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>

          {/* ── Header ── */}
          <header style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeUp 0.5s ease 0.2s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 8, height: 8, background: C.green, boxShadow: `0 0 10px ${C.green}`, animation: "blink 2s step-end infinite" }} />
              {/* Brand: naik dari 10 → 13px */}
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: "0.35em", color: C.muted }}>CONVERSA_MCP</span>
              <span style={{ color: C.border }}>|</span>
              {/* Version: naik dari 10 → 13px */}
              <span style={{ fontSize: 13, color: C.dim }}>v0.1.0</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ThemeToggle mode={themeMode} onChange={handleTheme} C={C} />
              <div style={{ display: "flex", gap: 16, fontSize: 13, letterSpacing: "0.15em" }}>
                <span style={{ color: C.dim }}>IBM BOB 2026</span>
                <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: C.muted, textDecoration: "none" }}>[GITHUB]</a>
              </div>
            </div>
          </header>

          {/* ── Hero ── */}
          <section style={{ padding: "80px 0 56px", animation: "fadeUp 0.6s ease 0.4s both" }}>
            {/* System init label: naik dari 10 → 13px */}
            <div style={{ fontSize: 13, color: C.dim, letterSpacing: "0.3em", marginBottom: 20 }}>
              &gt; SYSTEM_INIT :: MCP_SERVER_ONLINE
            </div>
            {/* H1: naik clamp min 32px → 38px, max 60px → 68px */}
            <h1 style={{ fontFamily: "'Orbitron',monospace", fontSize: "clamp(32px,5vw,68px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 28 }}>
              <GlitchText text="YOUR AI AGENTS" color={C.green} />
              <br />
              <span style={{ color: C.border, fontSize: "0.5em" }}>━━━━━━━━━━━━━━━━━━━━━━━━</span>
              <br />
              <GlitchText text="INSIDE BOB IDE" color={C.white} />
            </h1>

            {/* Stats grid: naik dari 10 → 13px */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, maxWidth: 600, marginBottom: 36 }}>
              {[["PROTOCOL","JSON-RPC 2.0"],["TRANSPORT","HTTP / SSE"],["TOOLS","05 ACTIVE"],["STATUS","OPERATIONAL"]].map(([k,v]) => (
                <div key={k} style={{ padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.border}`, fontSize: 13 }}>
                  <div style={{ color: C.dim, letterSpacing: "0.15em", marginBottom: 6 }}>{k}</div>
                  <div style={{ color: v === "OPERATIONAL" ? C.green : C.muted }}>{v}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons: naik dari 10 → 13px */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="#connect" style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: "0.2em", color: isLight ? "#fff" : "#000", background: C.green, padding: "14px 32px", textDecoration: "none", fontWeight: 700, boxShadow: `0 0 24px ${C.green}50` }}>
                CONNECT_BOB →
              </a>
              <a href="#tools" style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: "0.2em", color: C.muted, border: `1px solid ${C.border}`, padding: "14px 32px", textDecoration: "none" }}>
                VIEW_TOOLS
              </a>
            </div>
          </section>

          {/* ── Divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
            {/* Divider label: naik dari 9 → 12px */}
            <span style={{ fontSize: 12, color: C.dim, letterSpacing: "0.35em" }}>◈ TOOL_REGISTRY ◈</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${C.border}, transparent)` }} />
          </div>

          {/* ── Tools ── */}
          <section id="tools" style={{ marginBottom: 72, animation: "fadeUp 0.6s ease 0.6s both" }}>
            {/* Section label: naik dari 10 → 13px */}
            <div style={{ fontSize: 13, color: C.dim, letterSpacing: "0.3em", marginBottom: 14 }}>&gt; ls ./tools/ — 5 items found</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 2 }}>
              {TOOLS.map((tool, i) => <TerminalCard key={tool.cmd} tool={tool} index={i} C={C} />)}
            </div>
          </section>

          {/* ── Architecture ── */}
          <section style={{ marginBottom: 72, animation: "fadeUp 0.6s ease 0.7s both" }}>
            {/* Section label: naik dari 10 → 13px */}
            <div style={{ fontSize: 13, color: C.dim, letterSpacing: "0.3em", marginBottom: 14 }}>&gt; cat ARCHITECTURE.txt</div>
            {/* Architecture diagram text: naik dari 12 → 15px */}
            <pre style={{ background: C.bgCode, border: `1px solid ${C.border}`, padding: "28px 32px", fontSize: 15, color: C.muted, lineHeight: 2.0, overflowX: "auto", transition: "background 0.3s" }}>{`
  ┌─────────────────────┐
  │   IBM BOB IDE       │  ← MCP Client
  └──────────┬──────────┘
             │  JSON-RPC 2.0 / HTTP
             ▼
  ┌─────────────────────┐
  │  conversa-bob       │  ← YOU ARE HERE
  │  (Vercel · Next.js) │
  └──────────┬──────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
  Gemini API     GitHub API
  (OCR · Analyze) + Vercel API
`}</pre>
          </section>

          {/* ── Connect ── */}
          <section id="connect" style={{ marginBottom: 72, animation: "fadeUp 0.6s ease 0.8s both" }}>
            {/* Section label: naik dari 10 → 13px */}
            <div style={{ fontSize: 13, color: C.dim, letterSpacing: "0.3em", marginBottom: 14 }}>&gt; cat CONNECT.md</div>
            <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
              {(["config","test"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, letterSpacing: "0.2em", padding: "9px 22px", background: activeTab === tab ? `${C.green}14` : C.bgCard, border: `1px solid ${activeTab === tab ? C.green + "50" : C.border}`, color: activeTab === tab ? C.green : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
                  [{tab.toUpperCase()}]
                </button>
              ))}
            </div>

            {activeTab === "config" && (
              <div style={{ position: "relative" }}>
                {/* Config code: naik dari 12 → 15px */}
                <pre style={{ background: C.bgCode, border: `1px solid ${C.border}`, padding: "24px 28px", fontSize: 15, color: C.muted, lineHeight: 1.9, overflowX: "auto", transition: "background 0.3s" }}>
                  <span style={{ color: C.dim }}>{"// .bob/mcp.json — paste into Bob Shell\n"}</span>
                  {MCP_CONFIG}
                </pre>
                {/* Copy button: naik dari 9 → 12px */}
                <button onClick={handleCopy}
                  style={{ position: "absolute", top: 12, right: 12, fontFamily: "'Share Tech Mono',monospace", fontSize: 12, letterSpacing: "0.15em", padding: "6px 16px", background: copied ? `${C.green}18` : "transparent", border: `1px solid ${copied ? C.green + "60" : C.border}`, color: copied ? C.green : C.muted, cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? "COPIED ✓" : "COPY"}
                </button>
              </div>
            )}

            {activeTab === "test" && (
              <div style={{ background: C.bgCode, border: `1px solid ${C.border}`, padding: "20px 24px", transition: "background 0.3s" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                  <span style={{ color: C.green, fontSize: 18 }}>$</span>
                  {/* Terminal input: naik dari 11 → 15px */}
                  <input value={testInput} onChange={e => setTestInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTest()}
                    placeholder="GET /api/mcp"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'Share Tech Mono',monospace", fontSize: 15, color: C.muted, caretColor: C.green }} />
                  {/* Run button: naik dari 10 → 13px */}
                  <button onClick={handleTest}
                    style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, letterSpacing: "0.15em", padding: "6px 16px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>
                    {testing ? "···" : "RUN"}
                  </button>
                </div>
                {/* Output: naik dari 11 → 14px */}
                {testOutput
                  ? <pre style={{ fontSize: 14, color: C.green, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>{testOutput}</pre>
                  : <div style={{ fontSize: 14, color: C.dim }}>// press RUN or Enter to ping health check</div>}
              </div>
            )}
          </section>

          {/* ── Footer ── */}
          {/* Footer: naik dari 10 → 13px */}
          <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 0", display: "flex", justifyContent: "space-between", fontSize: 13, color: C.dim, letterSpacing: "0.15em" }}>
            <span>CONVERSA_SYSTEMS © 2026</span>
            <span style={{ color: C.green + "70" }}>IBM_BOB_HACKATHON :: MCP_v0.1.0</span>
          </footer>
        </div>
      </main>
    </>
  );
}
