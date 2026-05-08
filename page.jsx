import { useState, useEffect, useRef, useCallback } from "react";

const CYAN = "#00D4FF";
const CYAN_DIM = "#007A99";
const CYAN_GHOST = "rgba(0,212,255,0.09)";
const CYAN_GLOW = "rgba(0,212,255,0.25)";
const BG_VOID = "#050810";
const BG_BASE = "#080C16";
const BG_SURFACE = "#0D1520";
const BG_RAISED = "#111B2C";
const BORDER_DIM = "#1A2840";
const BORDER_MED = "#1E3050";
const GREEN = "#00FF88";
const AMBER = "#FF8C00";
const RED = "#FF3333";
const GOLD = "#FFCC44";
const TEAL = "#00CCAA";
const TEXT_PRIMARY = "#E2E8F0";
const TEXT_SECONDARY = "#8BA3C0";
const TEXT_MUTED = "#4A6080";

const PROJECTS = [
  { id: "04.01", code: "CDAS", name: "SEARCH COLLECTIVES PLATFORM", desc: "Nation-scale search grid. 10K+ missing persons. 40 sources.", stack: ["Python","FastAPI","PostgreSQL","React","AWS ECS"], color: AMBER, status: "ACTIVE",
    detail: "Architected nation-scale missing persons search platform centralizing 10,000+ records from 40+ sources. Engineered hybrid Levenshtein fuzzy-matching optimized for Spanish naming patterns. Built ingestion pipeline processing 120 records/min via parallelization. Integrated AWS Rekognition photo-matching delivering <120ms query responses." },
  { id: "04.02", code: "FAULTMAP", name: "LLM DIAGNOSTIC LIBRARY", desc: "LLM failure-slice detection. Semantic entropy. PyPI-live.", stack: ["Python","HuggingFace","PyTorch","HDBSCAN","asyncio"], color: CYAN, status: "DEPLOYED",
    detail: "Open-source LLM failure-slice detection pipeline. Embeds prompts via HuggingFace, clusters with HDBSCAN, runs per-cluster hypothesis tests to surface statistically elevated failure slices. Autonomous scoring via semantic entropy and multi-sample self-consistency. Published to PyPI via GitHub Actions CI/CD." },
  { id: "04.03", code: "CRASH-ML", name: "TRAFFIC CRASH RECIDIVISM", desc: "8M crash records. 4NF schema. Hotspot recidivism model.", stack: ["Python","PostgreSQL","XGBoost","LightGBM","GeoPandas"], color: RED, status: "COMPLETE",
    detail: "ML pipeline for 8M+ records with normalized 4NF PostgreSQL schema. Engineered 40+ predictive features including DBSCAN/K-means geospatial hotspot scores. Evaluated ensemble stack under 3% class imbalance with SMOTE and temporal cross-validation. Achieved 0.75 ROC-AUC." },
  { id: "04.04", code: "PIPELINE", name: "AUTONOMOUS DATA ACQUISITION", desc: "Akamai bypass engine. 24/7 autonomous. GCP-deployed.", stack: ["Python","Docker","GCP","SQLite","Telegram API"], color: GREEN, status: "RUNNING",
    detail: "Containerized data acquisition pipeline deployed to GCP VPS. Bypasses Akamai Bot Manager via JA3/JA4 TLS fingerprint spoofing. Multi-tier fallback strategy: REST APIs → Residential Proxies → Undocumented endpoints. Event-driven alerts via Telegram Bot API." },
  { id: "04.05", code: "OPTIONS", name: "OPTIONS FLOW MONITOR", desc: "Live options flow. Kafka ingest. LightGBM vol forecast.", stack: ["PySpark","Kafka","LightGBM","FastAPI","MongoDB","React"], color: GOLD, status: "OPERATIONAL",
    detail: "Event-driven streaming ingestion via Redpanda/Kafka capturing high-frequency options microstructure. Spark Structured Streaming executing tumbling-window aggregations. LightGBM forecasting microservice predicting short-horizon volatility with <50ms inference latency." },
  { id: "04.06", code: "WORDLE", name: "ENTROPY-OPTIMAL SOLVER", desc: "Entropy-optimal solver. 99% solve rate. 1st place finish.", stack: ["Python","NumPy","Multiprocessing","Information Theory"], color: CYAN, status: "1ST PLACE",
    detail: "Shannon entropy maximization over full 27^N combinatorial space. 640x acceleration via NumPy vectorization and multiprocessing. Precomputed optimal decision trees for turns 1-3 via serialized lookup tables. Cluster-busting heuristics for high-collision states." },
  { id: "04.07", code: "INSULINK", name: "DIABETES CARE PLATFORM", desc: "Diabetes care bridge. 70+ users. Doctor-patient uplink.", stack: ["C#","SQL","ASP.NET Core","HTML"], color: TEAL, status: "MVP LIVE",
    detail: "Full-stack diabetes-care web application bridging public healthcare overdemand with under-utilized private doctors. 70+ active users. Features: user authentication, appointment scheduling, secure medical history portal." },
  { id: "04.08", code: "GENETIC", name: "CO₂ TREND ESTIMATOR", desc: "GA-fitted CO₂ curve. R² > 0.95. Adaptive mutation.", stack: ["C#",".NET 6","Genetic Algorithms"], color: TEXT_SECONDARY, status: "CONVERGED",
    detail: "Randomized search heuristic for atmospheric CO₂ curve fitting. Tournament selection, arithmetic crossover, adaptive Gaussian mutation. Modular GA framework with deterministic seeding. Achieved R² > 0.95 fit to historical data." },
  { id: "04.09", code: "PHARMACY", name: "NETWORK OPTIMIZATION", desc: "P-median optimizer. 200 sites scored. +12% coverage gain.", stack: ["Python","R","INEGI/DENUE"], color: GREEN, status: "OPTIMIZED",
    detail: "Pharmacy placement formulated as p-median facility location problem. Weighted greedy heuristic balancing healthcare access and commercial viability across 200 sites. Multi-criteria analysis of 7+ variables from INEGI/DENUE datasets." },
];

const SKILLS = {
  "ML / AI": ["PyTorch","HuggingFace","Scikit-learn","LightGBM","XGBoost","HDBSCAN","NumPy","SciPy"],
  "DATA ENGINEERING": ["PostgreSQL","MongoDB","Cassandra","Neo4j","Apache Spark","Apache Kafka","Polars","Pandas","Parquet"],
  "INFRASTRUCTURE": ["Docker","AWS (ECS/Fargate/Rekognition)","GCP","FastAPI","GitHub Actions","Linux/WSL","Git"],
  "LANGUAGES": ["Python","Java","C++","C#","SQL","R","Bash/Shell","MATLAB","TypeScript"],
  "ALGORITHMS": ["Shannon Entropy","DBSCAN","K-Means","Genetic Algorithms","Dynamic Programming","Graph Theory"],
};

const EXPERIENCE = [
  { period: "2025.Q3 — CURRENT", org: "ITAM · CDAS", role: "Software Engineer Intern", mission: "Project for Search Collectives", desc: "Nation-scale missing persons platform. 10K+ records. 40+ sources. Python/FastAPI/PostgreSQL/React on AWS ECS.", status: "ACTIVE" },
  { period: "2024.Q3 — CURRENT", org: "ITAM · CODING RUSH", role: "Organizer & Course Developer", mission: "Competitive Programming Lab", desc: "Olympiad-level competition for 400+ students. 30+ problems. Co-founded weekly algorithm lab for 50+ university students.", status: "ACTIVE" },
];

const AWARDS = [
  { year: "2025", label: "Academic Excellence Award", detail: "Highest GPA in Computer Engineering — ITAM" },
  { year: "2023", label: "Math Olympiad — National Silver", detail: "Mexican Math Olympiad" },
  { year: "2023", label: "Chemistry Olympiad — National Silver", detail: "Mexican Chemistry Olympiad" },
  { year: "2022", label: "Math Olympiad — National Bronze", detail: "Mexican Math Olympiad" },
  { year: "2021", label: "Gauss Mathematics — 2nd National", detail: "Gauss Mathematics Contests" },
];

/* ── Reusable HUD Components ─────────────────────────────── */

function HUDCorners({ color = CYAN, size = 14, stroke = 1.5 }) {
  const s = { position: "absolute", width: size, height: size, pointerEvents: "none" };
  const line = (d) => (
    <svg viewBox={`0 0 ${size} ${size}`} fill="none" style={{ width: "100%", height: "100%" }}>
      <path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
  return (
    <>
      <div style={{ ...s, top: -1, left: -1 }}>{line(`M0 ${size} L0 0 L${size} 0`)}</div>
      <div style={{ ...s, top: -1, right: -1 }}>{line(`M0 0 L${size} 0 L${size} ${size}`)}</div>
      <div style={{ ...s, bottom: -1, left: -1 }}>{line(`M0 0 L0 ${size} L${size} ${size}`)}</div>
      <div style={{ ...s, bottom: -1, right: -1 }}>{line(`M${size} 0 L${size} ${size} L0 ${size}`)}</div>
    </>
  );
}

function HUDPanel({ label, status, statusColor = GREEN, children, style = {}, accentColor = CYAN }) {
  return (
    <div style={{
      position: "relative",
      border: `1px solid ${BORDER_MED}`,
      borderTop: `1px solid ${accentColor}44`,
      background: BG_SURFACE,
      padding: 0,
      ...style,
    }}>
      <HUDCorners color={accentColor} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 16px 8px",
        borderBottom: `1px solid ${BORDER_DIM}`,
        background: `${accentColor}06`,
      }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.12em", color: accentColor, textTransform: "uppercase" }}>
          {label}
        </span>
        {status && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "0.1em", color: statusColor }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}`, animation: "pulse 2s ease-in-out infinite" }} />
            {status}
          </span>
        )}
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

function DossierRow({ label, value, dots = true }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
      <span style={{ color: TEXT_MUTED, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 10, flexShrink: 0 }}>{label}</span>
      {dots && <span style={{ flex: 1, margin: "0 8px", borderBottom: `1px dotted ${BORDER_DIM}`, minWidth: 20 }} />}
      <span style={{ color: TEXT_PRIMARY, textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function SectionLabel({ number, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: CYAN_DIM, letterSpacing: "0.1em" }}>
        [{number}]
      </span>
      <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, ${CYAN}, transparent)` }} />
      <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(18px,3vw,28px)", fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: "0.04em", margin: 0 }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: BORDER_DIM }} />
    </div>
  );
}

function GlowButton({ children, href, small = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: small ? "5px 12px" : "8px 20px",
        fontFamily: "'JetBrains Mono',monospace", fontSize: small ? 10 : 11,
        letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
        color: hovered ? BG_VOID : CYAN,
        background: hovered ? CYAN : "transparent",
        border: `1px solid ${hovered ? CYAN : CYAN_DIM}`,
        boxShadow: hovered ? `0 0 16px ${CYAN_GLOW}, 0 0 40px ${CYAN_GHOST}` : "none",
        transition: "all 0.25s ease",
        cursor: "pointer",
      }}
    >{children}</a>
  );
}

/* ── Scroll Reveal Hook ──────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, direction = "up", style = {} }) {
  const [ref, visible] = useReveal(0.1);
  const transforms = { up: "translateY(30px)", down: "translateY(-30px)", left: "translateX(30px)", right: "translateX(-30px)", none: "none" };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : transforms[direction],
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

/* ── Custom Cursor ───────────────────────────────────────── */
function CustomCursor() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  useEffect(() => {
    let mx = 0, my = 0, ox = 0, oy = 0;
    const move = (e) => { mx = e.clientX; my = e.clientY; };
    const tick = () => {
      ox += (mx - ox) * 0.15;
      oy += (my - oy) * 0.15;
      if (outerRef.current) { outerRef.current.style.left = ox + "px"; outerRef.current.style.top = oy + "px"; }
      if (innerRef.current) { innerRef.current.style.left = mx + "px"; innerRef.current.style.top = my + "px"; }
      requestAnimationFrame(tick);
    };
    const overIn = (e) => { if (e.target.closest("a,button,[data-hover]")) setHovering(true); };
    const overOut = (e) => { if (e.target.closest("a,button,[data-hover]")) setHovering(false); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", overIn);
    window.addEventListener("mouseout", overOut);
    requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", overIn); window.removeEventListener("mouseout", overOut); };
  }, []);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(pointer:coarse)").matches;
  if (isMobile) return null;
  return (
    <>
      <div ref={outerRef} style={{
        position: "fixed", pointerEvents: "none", zIndex: 9999,
        width: hovering ? 36 : 22, height: hovering ? 36 : 22,
        border: `1.5px solid ${CYAN}`, borderRadius: "50%",
        transform: "translate(-50%,-50%)",
        opacity: hovering ? 0.9 : 0.35,
        boxShadow: hovering ? `0 0 12px ${CYAN_GLOW}` : "none",
        transition: "width 0.2s, height 0.2s, opacity 0.2s, box-shadow 0.2s",
      }} />
      <div ref={innerRef} style={{
        position: "fixed", pointerEvents: "none", zIndex: 9999,
        width: hovering ? 6 : 4, height: hovering ? 6 : 4,
        background: CYAN, borderRadius: "50%",
        transform: "translate(-50%,-50%)",
        boxShadow: `0 0 6px ${CYAN}`,
        transition: "width 0.15s, height 0.15s",
      }} />
    </>
  );
}

/* ── Scan-Line Background ────────────────────────────────── */
function ScanLines() {
  return <div style={{
    position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
    background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)`,
  }} />;
}

function GridBackground() {
  return <div style={{
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: `
      linear-gradient(${BORDER_DIM}22 1px, transparent 1px),
      linear-gradient(90deg, ${BORDER_DIM}22 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
  }} />;
}

/* ── Typewriter Text ─────────────────────────────────────── */
function Typewriter({ text, speed = 30, delay = 0, style = {} }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [ref, visible] = useReveal(0.2);
  useEffect(() => {
    if (visible && !started) {
      const timeout = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(timeout);
    }
  }, [visible, started, delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);
  return (
    <span ref={ref} style={{ fontFamily: "'JetBrains Mono',monospace", ...style }}>
      {displayed}<span style={{ color: CYAN, animation: "blink 1.1s step-end infinite" }}>█</span>
    </span>
  );
}

/* ── Top Nav Bar ─────────────────────────────────────────── */
function NavBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const links = [
    { label: "ABOUT", href: "#about" },
    { label: "SKILLS", href: "#skills" },
    { label: "PROJECTS", href: "#projects" },
    { label: "MISSIONS", href: "#experience" },
    { label: "CONTACT", href: "#contact" },
  ];
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 24px",
      background: `${BG_VOID}dd`, backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BORDER_DIM}`,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.12em",
    }}>
      <span style={{ color: CYAN, fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700 }}>GN—2026</span>
      <div style={{ display: "flex", gap: 24 }}>
        {links.map(l => (
          <a key={l.label} href={l.href} data-hover style={{ color: TEXT_MUTED, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = CYAN} onMouseLeave={e => e.target.style.color = TEXT_MUTED}>
            {l.label}
          </a>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: TEXT_MUTED }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: GREEN, boxShadow: `0 0 6px ${GREEN}`, animation: "pulse 2s ease-in-out infinite" }} />
        <span>SYS_ONLINE</span>
        <span style={{ color: CYAN }}>{time}</span>
      </div>
    </nav>
  );
}

/* ── HERO ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "120px 48px 80px", position: "relative", zIndex: 2,
    }}>
      <div style={{ maxWidth: 900 }}>
        <Reveal delay={0.1}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: CYAN_DIM, letterSpacing: "0.15em", marginBottom: 16 }}>
            OPERATOR DOSSIER // CLEARANCE GRANTED
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <h1 style={{
            fontFamily: "'Orbitron',sans-serif", fontWeight: 900,
            fontSize: "clamp(40px,8vw,88px)", lineHeight: 1.05, margin: 0,
            color: TEXT_PRIMARY, letterSpacing: "0.04em",
          }}>
            GABRIEL<br />NAVARRO
          </h1>
        </Reveal>
        <Reveal delay={0.5}>
          <div style={{ width: "min(100%,500px)", height: 1, background: `linear-gradient(90deg, ${CYAN}, ${CYAN_DIM}, transparent)`, margin: "24px 0" }} />
        </Reveal>
        <Reveal delay={0.6}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(13px,2vw,18px)", fontWeight: 600, color: CYAN, letterSpacing: "0.06em", marginBottom: 16 }}>
            DATA SCIENCE · COMPUTER ENGINEERING
          </div>
        </Reveal>
        <Reveal delay={0.8}>
          <Typewriter
            text="Building systems at the intersection of intelligence and infrastructure."
            speed={25} delay={1200}
            style={{ fontSize: 14, color: TEXT_SECONDARY, display: "block", maxWidth: 520, lineHeight: 1.6 }}
          />
        </Reveal>
        <Reveal delay={1.0}>
          <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
            <GlowButton href="https://github.com/gabonavarroo">ACCESS GITHUB →</GlowButton>
            <GlowButton href="https://linkedin.com/in/gabrielnavarroceron">LINKEDIN ↗</GlowButton>
          </div>
        </Reveal>
      </div>
      <Reveal delay={1.2} style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED, letterSpacing: "0.12em", animation: "float 2.5s ease-in-out infinite" }}>
          ▼ SCROLL TO INITIALIZE ▼
        </div>
      </Reveal>
    </section>
  );
}

/* ── ABOUT ────────────────────────────────────────────────── */
function About() {
  return (
    <section id="about" style={{ padding: "80px 48px", position: "relative", zIndex: 2 }}>
      <Reveal><SectionLabel number="01" title="PERSONNEL FILE" /></Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32, maxWidth: 1000 }}>
        <Reveal delay={0.1}>
          <HUDPanel label="IDENTIFICATION" status="VERIFIED" accentColor={CYAN}>
            <div style={{ textAlign: "center", padding: "20px 0 12px" }}>
              <div style={{
                width: 140, height: 140, margin: "0 auto 16px",
                border: `2px solid ${CYAN_DIM}`, borderRadius: 4,
                background: `linear-gradient(135deg, ${BG_RAISED}, ${BG_SURFACE})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
              }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 36, color: CYAN_DIM }}>GN</span>
                <div style={{
                  position: "absolute", inset: 0,
                  background: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, ${CYAN}08 3px, ${CYAN}08 4px)`,
                  animation: "scanDown 4s linear infinite",
                }} />
              </div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: TEXT_PRIMARY, letterSpacing: "0.05em" }}>GABRIEL NAVARRO CERÓN</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>HANDLE: GN-2026</div>
            </div>
          </HUDPanel>
        </Reveal>
        <Reveal delay={0.2}>
          <HUDPanel label="DOSSIER // CLASSIFIED" status="ACTIVE">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <DossierRow label="OPERATIVES" value="Data Science · Computer Engineering" />
              <DossierRow label="BASE" value="ITAM — Mexico City, MX" />
              <DossierRow label="GPA" value="97.3 / 100" />
              <DossierRow label="CLEARANCE" value="Academic Excellence Award (2025)" />
              <DossierRow label="SCHOLARSHIP" value="ITAM Merit — 75%" />
              <DossierRow label="LANGUAGES" value="Spanish (Native) · English (C2/CPE) · French" />
              <DossierRow label="STATUS" value="UNDERGRADUATE · EXP. GRADUATION 2028" />
              <div style={{ height: 1, background: BORDER_DIM, margin: "8px 0" }} />
              <DossierRow label="PRIOR CLEARANCE" value="UNAM-SI Full Scholarship (100%)" />
              <DossierRow label="OLYMPIAD — MATH" value="National Silver (2023) · Bronze (2022)" />
              <DossierRow label="OLYMPIAD — CHEM" value="National Silver (2023)" />
              <DossierRow label="GAUSS MATH" value="2nd Place National (2021)" />
              <div style={{ height: 1, background: BORDER_DIM, margin: "8px 0" }} />
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6, margin: 0 }}>
                Dual-degree operator specializing in machine learning infrastructure, distributed data systems, and algorithmic optimization. Track record in nation-scale deployments, open-source tooling, and competitive algorithm design. Clearance level: highest departmental GPA.
              </p>
            </div>
          </HUDPanel>
        </Reveal>
      </div>
    </section>
  );
}

/* ── SKILLS ───────────────────────────────────────────────── */
function Skills() {
  const [active, setActive] = useState("ML / AI");
  const colors = { "ML / AI": CYAN, "DATA ENGINEERING": "#2288FF", "INFRASTRUCTURE": GREEN, "LANGUAGES": GOLD, "ALGORITHMS": TEAL };
  return (
    <section id="skills" style={{ padding: "80px 48px", position: "relative", zIndex: 2 }}>
      <Reveal><SectionLabel number="02" title="SKILL MATRIX" /></Reveal>
      <Reveal delay={0.1}>
        <HUDPanel label="CAPABILITY SCAN" status="LOADED" style={{ maxWidth: 1000 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {Object.keys(SKILLS).map(cat => (
              <button key={cat} data-hover onClick={() => setActive(cat)}
                style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.1em",
                  padding: "6px 14px", cursor: "pointer",
                  background: active === cat ? `${colors[cat]}18` : "transparent",
                  border: `1px solid ${active === cat ? colors[cat] : BORDER_DIM}`,
                  color: active === cat ? colors[cat] : TEXT_MUTED,
                  transition: "all 0.2s",
                }}
              >{cat}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SKILLS[active].map((s, i) => (
              <Reveal key={s} delay={i * 0.04} direction="left">
                <span style={{
                  display: "inline-block", padding: "6px 14px",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: colors[active],
                  border: `1px solid ${colors[active]}33`,
                  background: `${colors[active]}0A`,
                  letterSpacing: "0.03em",
                }}>{s}</span>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: 16, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED }}>
            MODULES LOADED: {SKILLS[active].length} / {Object.values(SKILLS).flat().length} TOTAL
          </div>
        </HUDPanel>
      </Reveal>
    </section>
  );
}

/* ── PROJECTS ─────────────────────────────────────────────── */
function ProjectCard({ project, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Reveal delay={index * 0.08}>
      <div data-hover onClick={() => setExpanded(!expanded)}
        style={{
          border: `1px solid ${expanded ? project.color + "66" : BORDER_MED}`,
          background: expanded ? `${project.color}08` : BG_SURFACE,
          padding: 0, cursor: "pointer", transition: "all 0.3s ease",
          position: "relative",
        }}>
        <HUDCorners color={expanded ? project.color : BORDER_MED} />
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER_DIM}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED, letterSpacing: "0.1em" }}>PROJECT_{project.id}</span>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "0.1em",
            color: project.color, display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: project.color, boxShadow: `0 0 4px ${project.color}` }} />
            {project.status}
          </span>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: "0.03em", marginBottom: 6 }}>
            {project.code}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: TEXT_SECONDARY, marginBottom: 4 }}>
            {project.name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: TEXT_MUTED, marginBottom: 10 }}>
            {project.desc}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {project.stack.map(t => (
              <span key={t} style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, padding: "2px 8px",
                border: `1px solid ${BORDER_DIM}`, color: TEXT_MUTED, letterSpacing: "0.05em",
              }}>{t}</span>
            ))}
          </div>
          {expanded && (
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER_DIM}`,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.7,
              animation: "fadeIn 0.3s ease",
            }}>
              {project.detail}
            </div>
          )}
        </div>
        <div style={{ padding: "0 16px 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED }}>
          {expanded ? "▲ COLLAPSE" : "▼ EXPAND MISSION BRIEF"}
        </div>
      </div>
    </Reveal>
  );
}

function Projects() {
  return (
    <section id="projects" style={{ padding: "80px 48px", position: "relative", zIndex: 2 }}>
      <Reveal><SectionLabel number="03" title="MISSION ARCHIVE" /></Reveal>
      <Reveal delay={0.05}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: TEXT_MUTED, marginBottom: 24, letterSpacing: "0.05em" }}>
          TOTAL OPERATIONS: {PROJECTS.length} | ACTIVE: {PROJECTS.filter(p => p.status === "ACTIVE" || p.status === "RUNNING").length} | CLICK TO EXPAND BRIEF
        </div>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, maxWidth: 1100 }}>
        {PROJECTS.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
      </div>
    </section>
  );
}

/* ── EXPERIENCE ───────────────────────────────────────────── */
function Experience() {
  return (
    <section id="experience" style={{ padding: "80px 48px", position: "relative", zIndex: 2 }}>
      <Reveal><SectionLabel number="04" title="MISSION LOG" /></Reveal>
      <div style={{ maxWidth: 800, position: "relative", paddingLeft: 32 }}>
        <div style={{
          position: "absolute", left: 8, top: 0, bottom: 0, width: 2,
          background: `linear-gradient(180deg, ${CYAN}, ${CYAN_DIM}, transparent)`,
        }}>
          <div style={{
            width: 4, height: 40, background: CYAN, boxShadow: `0 0 10px ${CYAN_GLOW}`,
            borderRadius: 2, position: "absolute", left: -1,
            animation: "dataFlow 3s linear infinite",
          }} />
        </div>
        {EXPERIENCE.map((exp, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <div style={{ marginBottom: 32, position: "relative" }}>
              <div style={{
                position: "absolute", left: -28, top: 12, width: 10, height: 10,
                border: `2px solid ${CYAN}`, borderRadius: "50%", background: BG_BASE,
                boxShadow: `0 0 8px ${CYAN_GLOW}`,
              }} />
              <HUDPanel label={`MISSION // ${exp.period}`} status={exp.status} accentColor={CYAN}>
                <DossierRow label="ORG" value={exp.org} />
                <DossierRow label="ROLE" value={exp.role} />
                <DossierRow label="OBJECTIVE" value={exp.mission} />
                <div style={{ height: 1, background: BORDER_DIM, margin: "10px 0" }} />
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6, margin: 0 }}>
                  {exp.desc}
                </p>
              </HUDPanel>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.3}>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CYAN_DIM, letterSpacing: "0.12em", marginBottom: 16 }}>
              COMMENDATIONS / AWARDS LOG
            </div>
            {AWARDS.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "baseline", gap: 12, padding: "6px 0",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                borderBottom: `1px solid ${BORDER_DIM}22`,
              }}>
                <span style={{ color: CYAN_DIM, fontSize: 10, flexShrink: 0 }}>[{a.year}]</span>
                <span style={{ color: TEXT_PRIMARY }}>{a.label}</span>
                <span style={{ flex: 1, borderBottom: `1px dotted ${BORDER_DIM}`, minWidth: 10 }} />
                <span style={{ color: TEXT_MUTED, fontSize: 10 }}>{a.detail}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── CONTACT ──────────────────────────────────────────────── */
function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" style={{ padding: "80px 48px 120px", position: "relative", zIndex: 2 }}>
      <Reveal><SectionLabel number="05" title="ESTABLISH CONTACT" /></Reveal>
      <Reveal delay={0.1}>
        <HUDPanel label="TRANSMISSION TERMINAL" status={sent ? "SENT" : "AWAITING INPUT"} statusColor={sent ? GREEN : AMBER} style={{ maxWidth: 700 }} accentColor={CYAN}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED, letterSpacing: "0.08em", marginBottom: 16 }}>
            SATELLITE: ONLINE &nbsp;|&nbsp; ENCRYPTION: AES-256 &nbsp;|&nbsp; LATENCY: 12ms
          </div>
          {!sent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[{ label: "SENDER", placeholder: "your.name@domain.com" }, { label: "SUBJECT", placeholder: "Mission briefing..." }].map(f => (
                <div key={f.label}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CYAN_DIM, letterSpacing: "0.1em", marginBottom: 4 }}>&gt; {f.label}</div>
                  <input style={{
                    width: "100%", padding: "8px 12px", boxSizing: "border-box",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                    background: BG_VOID, border: `1px solid ${BORDER_MED}`, color: TEXT_PRIMARY, outline: "none",
                  }}
                    onFocus={e => e.target.style.borderColor = CYAN}
                    onBlur={e => e.target.style.borderColor = BORDER_MED}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CYAN_DIM, letterSpacing: "0.1em", marginBottom: 4 }}>&gt; MESSAGE</div>
                <textarea rows={4} style={{
                  width: "100%", padding: "8px 12px", boxSizing: "border-box",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                  background: BG_VOID, border: `1px solid ${BORDER_MED}`, color: TEXT_PRIMARY,
                  outline: "none", resize: "vertical",
                }}
                  onFocus={e => e.target.style.borderColor = CYAN}
                  onBlur={e => e.target.style.borderColor = BORDER_MED}
                  placeholder="Transmit your message..."
                />
              </div>
              <button data-hover onClick={() => setSent(true)} style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.1em",
                padding: "10px 24px", cursor: "pointer",
                background: "transparent", border: `1px solid ${CYAN}`, color: CYAN,
                transition: "all 0.25s",
              }}
                onMouseEnter={e => { e.target.style.background = CYAN; e.target.style.color = BG_VOID; e.target.style.boxShadow = `0 0 20px ${CYAN_GLOW}`; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = CYAN; e.target.style.boxShadow = "none"; }}
              >[ INITIATE TRANSMISSION ]</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: GREEN, marginBottom: 8, letterSpacing: "0.06em" }}>
                TRANSMISSION SENT
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: TEXT_SECONDARY }}>
                RESPONSE ETA: {"<"}24H &nbsp;|&nbsp; CHANNEL SECURE
              </div>
            </div>
          )}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${BORDER_DIM}`, display: "flex", gap: 12 }}>
            <GlowButton href="https://github.com/gabonavarroo" small>GH</GlowButton>
            <GlowButton href="https://linkedin.com/in/gabrielnavarroceron" small>LI</GlowButton>
            <GlowButton href="mailto:gabriel.navarrocr@gmail.com" small>EMAIL</GlowButton>
          </div>
        </HUDPanel>
      </Reveal>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────── */
function Footer() {
  return (
    <div style={{
      padding: "24px 48px", borderTop: `1px solid ${BORDER_DIM}`,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: TEXT_MUTED,
      display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2,
      letterSpacing: "0.08em",
    }}>
      <span>DESIGNED & ENGINEERED BY GABRIEL NAVARRO · 2026</span>
      <span>SYS_VERSION: MVP_0.1 · ALL SYSTEMS NOMINAL</span>
    </div>
  );
}

/* ── MAIN APP ─────────────────────────────────────────────── */
export default function Portfolio() {
  return (
    <div style={{ background: BG_BASE, color: TEXT_PRIMARY, minHeight: "100vh", cursor: "none", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;600;700;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${BG_BASE}; margin: 0; }
        ::selection { background: ${CYAN}33; color: ${TEXT_PRIMARY}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${BG_VOID}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER_MED}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${CYAN_DIM}; }

        input::placeholder, textarea::placeholder {
          color: ${TEXT_MUTED};
          font-family: 'JetBrains Mono', monospace;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scanDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dataFlow {
          0% { top: -40px; }
          100% { top: calc(100% + 40px); }
        }

        @media (max-width: 768px) {
          section { padding: 40px 20px !important; }
          nav > div:nth-child(2) { display: none !important; }
          div[style*="gridTemplateColumns: 1fr 1.5fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat"] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <CustomCursor />
      <GridBackground />
      <ScanLines />
      <NavBar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
    </div>
  );
}