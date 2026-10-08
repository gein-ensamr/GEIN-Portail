"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  File,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  GraduationCap,
  Hammer,
  HardDrive,
  type LucideIcon,
  Maximize2,
  Menu,
  MessageCircle,
  Minus,
  Network,
  PlayCircle,
  Plus,
  Rocket,
  Sparkles,
  Users,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import { GEIN_DATA, type GEINLink, type GEINModule } from "./gein-data";
import {
  buildEdges,
  getVisibleNodes,
  NODE_COLORS,
  SYL_FILTERS,
  SYL_META,
  SYL_NODES,
  SYL_OBJECTIVES,
  SYL_OPTIONS,
  SYL_PREREQS,
  SYL_SEMESTERS,
  type SylFilterId,
  type SylNode,
  type SylOptionId,
} from "./syllabus-data";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
type ViewId =
  | "home"
  | "resources"
  | "specialisations"
  | "syllabus"
  | "internships"
  | "community";

type ResourceTab = "s1" | "s2" | "s3" | "s4";
type SpecTab = "isnm" | "ise" | "isei";
type InternTab = "init" | "pfa" | "pfe";

/* ------------------------------------------------------------------ */
/*  YOUTUBE HELPER — handles single videos AND playlists              */
/* ------------------------------------------------------------------ */
function parseYouTube(url: string): { vid: string | null; listId: string | null } {
  if (!url || url === "#" || url.trim() === "") return { vid: null, listId: null };
  const listMatch = url.match(/[?&]list=([\w-]+)/);
  const listId = listMatch ? listMatch[1] : null;
  let vid: string | null = null;
  let m = url.match(/youtu\.be\/([\w-]+)/);
  if (m) vid = m[1];
  else {
    m = url.match(/[?&]v=([\w-]+)/);
    if (m) vid = m[1];
    else {
      m = url.match(/youtube\.com\/embed\/([\w-]+)/);
      if (m) vid = m[1];
      else {
        m = url.match(/youtube\.com\/shorts\/([\w-]+)/);
        if (m) vid = m[1];
      }
    }
  }
  return { vid, listId };
}

/* ------------------------------------------------------------------ */
/*  DRIVE HELPER — folder listing via /api/drive                       */
/* ------------------------------------------------------------------ */
type DriveItem = { id: string; name: string; folder: boolean; kind: string };

function parseDriveFolderId(url: string): string | null {
  const m = url?.match(/\/folders\/([\w-]+)/);
  return m ? m[1] : null;
}

// Listings are cached for the session so going back/forth is instant.
const driveCache = new Map<string, DriveItem[]>();
async function fetchDriveFolder(id: string): Promise<DriveItem[]> {
  const cached = driveCache.get(id);
  if (cached) return cached;
  const res = await fetch(`/api/drive?id=${id}`);
  if (!res.ok) throw new Error("drive");
  const data = await res.json();
  const items: DriveItem[] = data.items ?? [];
  driveCache.set(id, items);
  return items;
}

/* ------------------------------------------------------------------ */
/*  SCROLL REVEAL                                                      */
/* ------------------------------------------------------------------ */
function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={`gein-reveal ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  CIRCUIT CANVAS BACKGROUND                                          */
/*  Dynamic electrical field: fast glowing particles + random electric */
/*  arc sparks (Tesla-coil style) + cursor lightning surges.           */
/* ------------------------------------------------------------------ */
function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cyan = [0, 229, 255];
    const yellow = [250, 204, 21];
    const baseAlpha = 0.45;
    const litAlpha = 1;
    const haloAlpha = 0.14;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, active: false };
    const REACT_RADIUS = 180;

    type Dot = {
      x: number;
      y: number;
      baseR: number;
      vx: number;
      vy: number;
      isYellow: boolean;
      phase: number;        // for pulsing
    };
    let dots: Dot[] = [];

    type Arc = {
      x1: number; y1: number;
      x2: number; y2: number;
      life: number;          // 0..1, decrements
      maxLife: number;
      points: { x: number; y: number }[]; // jagged intermediate points
      color: number[];       // cyan or yellow
    };
    let arcs: Arc[] = [];

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(
        200,
        Math.max(60, Math.floor((width * height) / 11000))
      );
      dots = [];
      for (let i = 0; i < target; i++) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseR: 0.8 + Math.random() * 1.4,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          isYellow: Math.random() < 0.18,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };
    build();

    const rgb = (c: number[], a: number) =>
      `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    // Create a jagged lightning path between two points
    const makeArcPath = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(4, Math.floor(dist / 18));
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        const jitter = i === 0 || i === steps ? 0 : (dist / steps) * 0.6;
        pts.push({
          x: px + (Math.random() - 0.5) * jitter,
          y: py + (Math.random() - 0.5) * jitter,
        });
      }
      return pts;
    };

    // Spawn a random electric arc between two nearby particles
    const spawnArc = (cx: number, cy: number, radius: number) => {
      // find two particles near (cx,cy) within radius
      const nearby = dots.filter((d) => {
        const dx = d.x - cx;
        const dy = d.y - cy;
        return dx * dx + dy * dy < radius * radius;
      });
      if (nearby.length < 2) return;
      const a = nearby[Math.floor(Math.random() * nearby.length)];
      const b = nearby[Math.floor(Math.random() * nearby.length)];
      if (a === b) return;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 200 || dist < 20) return;
      arcs.push({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.3,
        points: makeArcPath(a.x, a.y, b.x, b.y),
        color: Math.random() < 0.5 ? cyan : yellow,
      });
    };

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // --- Spawn random ambient arcs (every ~25 frames) ---
      if (frame % 22 === 0 && dots.length > 0) {
        const seed = dots[Math.floor(Math.random() * dots.length)];
        spawnArc(seed.x, seed.y, 180);
      }

      // --- Spawn cursor arcs (when mouse active) ---
      if (mouse.active && frame % 6 === 0) {
        spawnArc(mouse.x, mouse.y, REACT_RADIUS);
      }

      // --- Update + draw particles ---
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        d.phase += 0.05;
        if (d.x < -20) d.x = width + 20;
        if (d.x > width + 20) d.x = -20;
        if (d.y < -20) d.y = height + 20;
        if (d.y > height + 20) d.y = -20;

        let scale = 1;
        let glow = 0;
        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REACT_RADIUS) {
            const t = 1 - dist / REACT_RADIUS;
            scale = 1 + t * 3.5;
            glow = t;
          }
        }
        // subtle pulse
        const pulse = 0.85 + Math.sin(d.phase) * 0.15;
        const r = d.baseR * scale * pulse;
        const col = d.isYellow ? yellow : cyan;
        const alpha = baseAlpha + glow * (litAlpha - baseAlpha);

        // halo
        ctx.beginPath();
        ctx.arc(d.x, d.y, r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = rgb(col, haloAlpha + glow * 0.3);
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = rgb(col, alpha);
        ctx.fill();
      }

      // --- Update + draw electric arcs ---
      arcs = arcs.filter((a) => a.life > 0);
      for (const a of arcs) {
        a.life -= 0.045 / a.maxLife;
        const alpha = Math.max(0, a.life);
        // occasionally re-jitter the path for a crackling effect
        if (frame % 3 === 0) {
          a.points = makeArcPath(a.x1, a.y1, a.x2, a.y2);
        }
        // glow stroke (wide, low alpha)
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) {
          ctx.lineTo(a.points[i].x, a.points[i].y);
        }
        ctx.strokeStyle = rgb(a.color, alpha * 0.25);
        ctx.lineWidth = 4;
        ctx.shadowColor = rgb(a.color, 0.8);
        ctx.shadowBlur = 12;
        ctx.stroke();

        // bright core stroke (thin, high alpha)
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) {
          ctx.lineTo(a.points[i].x, a.points[i].y);
        }
        ctx.strokeStyle = rgb(a.color, alpha * 0.9);
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // endpoint sparks
        ctx.beginPath();
        ctx.arc(a.x1, a.y1, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = rgb(a.color, alpha);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(a.x2, a.y2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = rgb(a.color, alpha);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onResize = () => build();

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="gein-canvas-bg" aria-hidden />
      <div className="gein-pcb-grid" aria-hidden />
      <div className="gein-bg-overlay" aria-hidden />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  MAGNETIC BUTTON                                                    */
/* ------------------------------------------------------------------ */
function Magnetic({
  children,
  className = "",
  strength = 0.35,
  as = "button",
  href,
  onClick,
  ariaLabel,
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "button" | "a";
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  type?: "button" | "submit";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  if (as === "a") {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  3D TILT CARD (polymorphic)                                         */
/* ------------------------------------------------------------------ */
function TiltCard({
  children,
  className = "",
  max = 8,
  as = "div",
  href,
  onClick,
  style,
  target,
  rel,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  as?: "div" | "button" | "a";
  href?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const onMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * max * 2;
      const ry = (px - 0.5) * max * 2;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    },
    [max]
  );
  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }, []);

  const handlers = { onMouseMove: onMove, onMouseLeave: onLeave };

  if (as === "a") {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={className}
        style={style}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        {...handlers}
      >
        {children}
      </a>
    );
  }
  if (as === "button") {
    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={className}
        style={style}
        aria-label={ariaLabel}
        {...handlers}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={style}
      {...handlers}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NAVIGATION                                                         */
/* ------------------------------------------------------------------ */
const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: "home", label: "Accueil" },
  { id: "resources", label: "Ressources" },
  { id: "specialisations", label: "Spécialisations" },
  { id: "syllabus", label: "Syllabus" },
  { id: "internships", label: "Stages" },
  { id: "community", label: "Communauté" },
];

function Navbar({
  view,
  onNavigate,
}: {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: ViewId) => {
    onNavigate(v);
    setOpen(false);
  };

  return (
    <header className={`gein-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="gein-container">
        <div className="gein-nav-bar">
          <button className="gein-brand" onClick={() => go("home")} aria-label="GEIN accueil">
            <img src="/logo.png" alt="GEIN" className="gein-brand-logo" width={385} height={197} />
          </button>

          <nav className="gein-nav-links" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`gein-nav-link ${view === item.id ? "active" : ""}`}
                onClick={() => go(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="gein-nav-actions">
            <button
              className="gein-menu-btn"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className={`gein-mobile-menu ${open ? "open" : ""}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME VIEW                                                          */
/* ------------------------------------------------------------------ */
const HOME_CARDS: {
  view: ViewId;
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}[] = [
  {
    view: "resources",
    icon: BookOpen,
    title: "Ressources",
    desc: "Supports de cours, dossiers Drive et vidéos pour chaque module de S1 à S4.",
    color: "var(--accent)",
  },
  {
    view: "specialisations",
    icon: Compass,
    title: "Spécialisations",
    desc: "Filières de 3ème année — ISNM, ISE et ISEI — avec le tronc commun et les modules d'option.",
    color: "var(--cyan)",
  },
  {
    view: "syllabus",
    icon: Network,
    title: "Syllabus & Orientation",
    desc: "Une carte mentale interactive de la progression et des prérequis des modules de S1 à S5, avec les objectifs détaillés.",
    color: "var(--accent)",
  },
  {
    view: "internships",
    icon: Rocket,
    title: "Stages",
    desc: "Guides et archives de rapports pour le stage d'initiation, le PFA et le PFE.",
    color: "var(--cyan)",
  },
  {
    view: "community",
    icon: Users,
    title: "Communauté",
    desc: "Le serveur Discord, les groupes WhatsApp et la chaîne YouTube qui connectent la promo.",
    color: "var(--accent)",
  },
];

const MARQUEE_ITEMS = [
  "Systèmes Automatisés",
  "Microcontrôleurs",
  "Smart Grids",
  "Robotique",
  "IoT",
  "Traitement du Signal",
  "Convertisseurs de Puissance",
  "Intelligence Artificielle",
  "Énergies Renouvelables",
  "Réseaux Électriques",
];

/* ------------------------------------------------------------------ */
/*  SCROLL-DRIVEN CAROUSEL (electrical engineering photos)            */
/*  Vertical scroll drives horizontal movement of image cards.         */
/* ------------------------------------------------------------------ */
const CAROUSEL_IMAGES = [
  { url: "/carousel/pcb.png", tag: "Électronique", title: "Circuits Imprimés & Composants" },
  { url: "/carousel/substation.png", tag: "Énergie", title: "Postes de Transformation HT" },
  { url: "/carousel/panel.png", tag: "Automatisme", title: "Pupitres & Automates Industriels" },
  { url: "/carousel/chip.png", tag: "Embarqué", title: "Microcontrôleurs & Systèmes sur Puce" },
  { url: "/carousel/motor.png", tag: "Mécatronique", title: "Machines Électriques & Actionneurs" },
  { url: "/carousel/renewable.png", tag: "Smart Grids", title: "Énergies Renouvelables & Réseaux Intelligents" },
];

function ScrollCarousel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!section || !track || !fill) return;

    let raf = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight;
      const vh = window.innerHeight;
      // scroll progress through the section (0 at top entering, 1 at bottom leaving)
      const scrollable = sectionH - vh;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));

      // horizontal travel = trackWidth - viewportWidth
      const trackW = track.scrollWidth;
      const travel = Math.max(0, trackW - window.innerWidth + 80);
      track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
      fill.style.width = `${progress * 100}%`;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="gein-carousel-section" ref={sectionRef}>
      <div className="gein-carousel-sticky">
        <div className="gein-carousel-head">
          <div>
            <div className="gein-section-eyebrow">Le Génie Électrique en Images</div>
            <h2>Du composant au réseau</h2>
          </div>
          <span className="gein-carousel-hint">
            <span className="gein-scroll-icon" aria-hidden>
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </span>
            Faites défiler pour explorer
          </span>
        </div>

        <div className="gein-carousel-track" ref={trackRef}>
          {CAROUSEL_IMAGES.map((img, i) => (
            <div className="gein-carousel-card" key={i}>
              <img src={img.url} alt={img.title} loading="lazy" />
              <div className="gein-carousel-card-overlay" />
              <div className="gein-carousel-card-label">
                <span className="gein-carousel-card-tag">{img.tag}</span>
                <div className="gein-carousel-card-title">{img.title}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="gein-carousel-progress">
          <div className="gein-carousel-progress-bar">
            <div className="gein-carousel-progress-fill" ref={fillRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  return (
    <div className="gein-view">
      <section className="gein-hero">
        <div className="gein-container">
          <Reveal>
            <span className="gein-eyebrow">
              <span className="dot" />
              Portail Étudiant • Génie Électrique et Industries Numériques
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="gein-hero-title">
              Tout l'<span className="accent">GEIN</span>,
              <br />
              <span className="outline">au même endroit.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="gein-hero-sub">
              Un portail pour la filière GEIN — chaque module, chaque
              ressource, chaque spécialisation et chaque lien communautaire,
              organisé semestre par semestre. Conçu par et pour la communauté.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <p className="gein-hero-shine">
              Partagez vos connaissances avec les autres — ADAK TRICYAN
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="gein-hero-actions">
              <Magnetic
                as="button"
                className="gein-btn gein-btn-primary"
                onClick={() => onNavigate("resources")}
                strength={0.4}
              >
                Explorer les Ressources
                <ArrowRight size={17} />
              </Magnetic>
              <Magnetic
                as="button"
                className="gein-btn gein-btn-ghost"
                onClick={() => onNavigate("specialisations")}
                strength={0.3}
              >
                Voir les Spécialisations
              </Magnetic>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="gein-hero-stats">
              <div>
                <div className="gein-stat-num">
                  4<span className="accent">+</span>
                </div>
                <div className="gein-stat-label">Semestres couverts</div>
              </div>
              <div>
                <div className="gein-stat-num">
                  3<span className="accent">.</span>
                </div>
                <div className="gein-stat-label">Filières de spécialisation</div>
              </div>
              <div>
                <div className="gein-stat-num">
                  30<span className="accent">+</span>
                </div>
                <div className="gein-stat-label">Modules répertoriés</div>
              </div>
              <div>
                <div className="gein-stat-num">
                  1<span className="accent">.</span>
                </div>
                <div className="gein-stat-label">Communauté étudiante</div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="gein-marquee" aria-hidden>
              <div className="gein-marquee-track">
                {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((m, i) => (
                  <span className="gein-marquee-item" key={i}>
                    <span className="star">✦</span>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <ScrollCarousel />

      <section className="gein-section">
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head centered">
              <div className="gein-section-eyebrow">Navigation</div>
              <h2 className="gein-section-title">Où voulez-vous aller ?</h2>
              <p className="gein-section-desc">
                Choisissez une destination ci-dessous. Chaque section correspond
                à un moment clé de votre parcours d'ingénieur — des
                fondamentaux de première année à votre spécialisation finale.
              </p>
            </div>
          </Reveal>

          <div className="gein-nav-grid">
            {HOME_CARDS.map((c, i) => (
              <Reveal key={c.view} delay={i * 80}>
                <TiltCard
                  as="button"
                  className="gein-nav-card"
                  max={7}
                  onClick={() => onNavigate(c.view)}
                  style={{ ["--card-color" as string]: c.color } as React.CSSProperties}
                >
                  <span className="gein-nav-card-icon">
                    <c.icon size={24} />
                  </span>
                  <span className="gein-nav-card-title">{c.title}</span>
                  <span className="gein-nav-card-desc">{c.desc}</span>
                  <span className="gein-nav-card-arrow">
                    Ouvrir <ArrowUpRight size={15} />
                  </span>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TABS                                                               */
/* ------------------------------------------------------------------ */
function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="gein-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`gein-tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {active === t.id && <span className="gein-tab-pill" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LINK DROPDOWN                                                      */
/* ------------------------------------------------------------------ */
function LinkDropdown({ link }: { link: GEINLink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="gein-dropdown" ref={ref}>
      <Magnetic
        as="button"
        className="gein-btn gein-btn-discord"
        onClick={() => setOpen((o) => !o)}
        strength={0.25}
      >
        <MessageCircle size={16} />
        {link.name}
        <ChevronDown
          size={15}
          style={{
            transition: "transform 0.25s ease",
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
          }}
        />
      </Magnetic>
      {open && (
        <div className="gein-dropdown-menu" role="menu">
          {link.items.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={(e) => {
                if (item.url === "#" || !item.url) {
                  e.preventDefault();
                }
                setOpen(false);
              }}
            >
              {item.name}
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  YOUTUBE PLAYLIST PLAYER                                            */
/* ------------------------------------------------------------------ */

// Extend Window for the YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          host?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayerInstance }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayerInstance {
  getPlaylist: () => string[];
  getPlaylistIndex: () => number;
  playVideoAt: (index: number) => void;
  loadPlaylist: (opts: { list: string; listType: string; index: number }) => void;
  destroy: () => void;
}

// Singleton: load the YT IFrame API script once
let ytApiLoaded = false;
let ytApiCallbacks: (() => void)[] = [];
function loadYTApi(cb: () => void) {
  if (ytApiLoaded) { cb(); return; }
  ytApiCallbacks.push(cb);
  if (document.getElementById("yt-iframe-api")) return;
  const script = document.createElement("script");
  script.id = "yt-iframe-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiCallbacks.forEach((fn) => fn());
    ytApiCallbacks = [];
  };
}

// Video titles via YouTube oEmbed (CORS-enabled, no API key, works for unlisted videos).
// Cached for the session so reopening a playlist is instant.
const ytTitleCache = new Map<string, Promise<string | null>>();
function fetchVideoTitle(id: string): Promise<string | null> {
  let p = ytTitleCache.get(id);
  if (!p) {
    p = fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.title ?? null)
      .catch(() => null);
    ytTitleCache.set(id, p);
  }
  return p;
}

function YouTubePlaylistPlayer({ url, name }: { url: string; name: string }) {
  const { vid: initialVid, listId } = useMemo(() => parseYouTube(url), [url]);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [thumbIds, setThumbIds] = useState<string[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [listLoaded, setListLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [apiReady, setApiReady] = useState(false);

  // Fetch titles once the playlist IDs are known
  useEffect(() => {
    let cancelled = false;
    thumbIds.forEach((id) =>
      fetchVideoTitle(id).then((t) => {
        if (t && !cancelled) setTitles((prev) => ({ ...prev, [id]: t }));
      })
    );
    return () => { cancelled = true; };
  }, [thumbIds]);

  // Keep the active thumbnail visible (e.g. when the next video auto-plays)
  useEffect(() => {
    const strip = thumbsRef.current;
    const el = strip?.children[activeIdx] as HTMLElement | undefined;
    if (!strip || !el) return;
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [activeIdx, thumbIds]);

  // Load YT IFrame API
  useEffect(() => {
    if (!listId) return;
    loadYTApi(() => setApiReady(true));
  }, [listId]);

  // Create player once API is ready
  useEffect(() => {
    if (!apiReady || !listId || !containerRef.current) return;
    const div = document.createElement("div");
    div.id = `yt-player-${listId.slice(-6)}`;
    containerRef.current.appendChild(div);

    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    playerRef.current = new window.YT.Player(div, {
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        listType: "playlist",
        list: listId,
        index: initialVid ? undefined : 0,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin,
      } as Record<string, string | number>,
      events: {
        onReady: (e) => {
          // The playlist metadata arrives shortly after onReady — poll for it
          // (up to ~6 s) instead of guessing a single delay.
          let tries = 0;
          const poll = () => {
            const ids = e.target.getPlaylist() ?? [];
            if (ids.length > 0) {
              setThumbIds(ids);
              setListLoaded(true);
            } else if (++tries < 20) {
              pollTimer = setTimeout(poll, 300);
            } else {
              setListLoaded(true);
            }
          };
          poll();
        },
        onStateChange: (e) => {
          // state 1 = playing — update active index
          if (e.data === 1) {
            const idx = playerRef.current?.getPlaylistIndex() ?? 0;
            setActiveIdx(idx);
          }
        },
      },
    });

    return () => {
      clearTimeout(pollTimer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [apiReady, listId, initialVid]);

  // Single video (no playlist)
  if (!listId) {
    const src = initialVid
      ? `https://www.youtube.com/embed/${initialVid}`
      : null;
    return (
      <div className="gein-yt-playlist-player">
        <div className="gein-yt-frame">
          {src ? (
            <iframe
              src={src}
              title={`Lecteur vidéo — ${name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="gein-yt-placeholder">
              <span className="play-circle"><PlayCircle size={28} /></span>
              <p><strong>Vidéo / Playlist à venir.</strong><br />Le lien YouTube n'a pas encore été ajouté. Revenez bientôt.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="gein-yt-playlist-player">
      {/* ── Main player (YT IFrame API manages this div) ── */}
      <div className="gein-yt-frame" ref={containerRef} />

      {/* ── Thumbnail strip ── */}
      {thumbIds.length > 1 && (
        <div className="gein-yt-strip">
          <span className="gein-yt-strip-label">
            <Youtube size={12} />
            {thumbIds.length} vidéos dans la playlist
          </span>
          <div className="gein-yt-thumbs" ref={thumbsRef}>
            {thumbIds.map((id, idx) => {
              const title = titles[id];
              return (
                <button
                  key={id}
                  className={`gein-yt-item ${activeIdx === idx ? "active" : ""}`}
                  onClick={() => {
                    setActiveIdx(idx);
                    playerRef.current?.playVideoAt(idx);
                  }}
                  aria-label={title ? `Vidéo ${idx + 1} : ${title}` : `Vidéo ${idx + 1}`}
                  title={title}
                >
                  <span className="gein-yt-thumb">
                    <img
                      src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                    />
                    <span className="gein-yt-thumb-num">{idx + 1}</span>
                    {activeIdx === idx && (
                      <span className="gein-yt-thumb-playing">
                        <PlayCircle size={18} />
                      </span>
                    )}
                  </span>
                  <span className="gein-yt-item-title">{title ?? `Vidéo ${idx + 1}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading hint while thumbs not yet populated */}
      {thumbIds.length === 0 && !listLoaded && (
        <div className="gein-yt-strip">
          <span className="gein-yt-strip-label">
            <Youtube size={12} />
            Chargement de la playlist…
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  INLINE DRIVE EXPLORER                                              */
/* ------------------------------------------------------------------ */
function driveItemIcon(item: DriveItem) {
  if (item.folder) return <Folder size={18} />;
  const k = item.kind.toLowerCase();
  if (k.includes("image")) return <FileImage size={18} />;
  if (k.includes("video") || k.includes("vidéo")) return <FileVideo size={18} />;
  if (k.includes("pdf") || k.includes("document") || k.includes("text")) return <FileText size={18} />;
  return <File size={18} />;
}

function DriveExplorer({ url, name }: { url: string; name: string }) {
  const rootId = useMemo(() => parseDriveFolderId(url), [url]);
  const [path, setPath] = useState<{ id: string; name: string }[]>(
    rootId ? [{ id: rootId, name }] : []
  );
  // Result is tagged with its folder id, so a stale result reads as "loading".
  const [result, setResult] = useState<{ id: string; items: DriveItem[] | null; error: boolean } | null>(null);
  const [preview, setPreview] = useState<DriveItem | null>(null);

  const current = path[path.length - 1];
  const fresh = result && current && result.id === current.id ? result : null;
  const items = fresh?.items ?? null;
  const error = fresh?.error ?? false;

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    fetchDriveFolder(current.id)
      .then((list) => { if (!cancelled) setResult({ id: current.id, items: list, error: false }); })
      .catch(() => { if (!cancelled) setResult({ id: current.id, items: null, error: true }); });
    return () => { cancelled = true; };
  }, [current]);

  if (!current) {
    return (
      <div className="gein-drive-empty">
        <HardDrive size={26} />
        <p><strong>Dossier à venir.</strong><br />Le lien Drive n'a pas encore été ajouté.</p>
      </div>
    );
  }

  const openInDrive = preview
    ? `https://drive.google.com/file/d/${preview.id}/view`
    : `https://drive.google.com/drive/folders/${current.id}`;

  return (
    <div className="gein-drive">
      {/* ── Toolbar: breadcrumb + open externally ── */}
      <div className="gein-drive-bar">
        <nav className="gein-drive-crumbs" aria-label="Chemin du dossier">
          {path.map((p, i) => {
            const last = i === path.length - 1 && !preview;
            return (
              <span key={p.id} className="gein-drive-crumb">
                {i > 0 && <ChevronRight size={13} aria-hidden />}
                <button
                  disabled={last}
                  onClick={() => { setPreview(null); setPath(path.slice(0, i + 1)); }}
                >
                  {i === 0 ? <HardDrive size={13} /> : null}
                  {p.name}
                </button>
              </span>
            );
          })}
          {preview && (
            <span className="gein-drive-crumb">
              <ChevronRight size={13} aria-hidden />
              <button disabled>{preview.name}</button>
            </span>
          )}
        </nav>
        <a className="gein-drive-ext" href={openInDrive} target="_blank" rel="noopener noreferrer">
          Ouvrir dans Drive
          <ArrowUpRight size={13} />
        </a>
      </div>

      {/* ── Body: file preview or folder listing ── */}
      {preview ? (
        <div className="gein-drive-preview">
          <iframe
            src={`https://drive.google.com/file/d/${preview.id}/preview`}
            title={`Aperçu — ${preview.name}`}
            allow="autoplay"
            allowFullScreen
          />
        </div>
      ) : error ? (
        <div className="gein-drive-empty">
          <HardDrive size={26} />
          <p><strong>Impossible de charger ce dossier.</strong><br />Réessayez, ou ouvrez-le directement dans Drive.</p>
        </div>
      ) : items === null ? (
        <div className="gein-drive-list" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="gein-drive-item skeleton" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="gein-drive-empty">
          <Folder size={26} />
          <p><strong>Dossier vide pour l'instant.</strong><br />Les documents seront ajoutés bientôt.</p>
        </div>
      ) : (
        <div className="gein-drive-list">
          {items.map((item) => (
            <button
              key={item.id}
              className={`gein-drive-item ${item.folder ? "is-folder" : ""}`}
              onClick={() =>
                item.folder
                  ? setPath([...path, { id: item.id, name: item.name }])
                  : setPreview(item)
              }
            >
              <span className="gein-drive-item-icon">{driveItemIcon(item)}</span>
              <span className="gein-drive-item-name">{item.name}</span>
              {item.folder && <ChevronRight size={15} className="gein-drive-item-go" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MODULE ACCORDION + INLINE YT                                       */
/* ------------------------------------------------------------------ */
function ElementRow({
  name,
  drive,
  yt,
  panel,
  onTogglePanel,
}: {
  name: string;
  drive: string;
  yt: string;
  panel: "drive" | "yt" | null;
  onTogglePanel: (p: "drive" | "yt") => void;
}) {
  const isPlaying = panel === "yt";
  const isBrowsing = panel === "drive";
  const { vid, listId } = parseYouTube(yt);
  const hasVideo = Boolean(vid || listId);
  return (
    <div className="gein-element">
      <div className="gein-element-top">
        <span className="gein-element-bullet" aria-hidden />
        <span className="gein-element-name">{name}</span>
        <div className="gein-element-actions">
          <Magnetic
            as="button"
            className={`gein-btn gein-btn-drive ${isBrowsing ? "active" : ""}`}
            onClick={() => onTogglePanel("drive")}
            strength={0.2}
            ariaLabel={isBrowsing ? `Masquer le dossier Drive pour ${name}` : `Parcourir le dossier Drive pour ${name}`}
            aria-expanded={isBrowsing}
          >
            <HardDrive size={15} />
            {isBrowsing ? "Masquer" : "Drive"}
          </Magnetic>
          <Magnetic
            as="button"
            className={`gein-btn gein-btn-yt ${isPlaying ? "active" : ""} ${hasVideo ? "" : "is-empty"}`}
            onClick={() => onTogglePanel("yt")}
            strength={0.2}
            ariaLabel={isPlaying ? `Masquer la vidéo pour ${name}` : `Lire la vidéo pour ${name}`}
            aria-expanded={isPlaying}
          >
            <Youtube size={15} />
            {isPlaying ? "Masquer" : "YouTube"}
          </Magnetic>
        </div>
      </div>

      {isPlaying && (
        <div className="gein-yt-player" style={{ animation: "gein-view-in 0.4s ease both" }}>
          <YouTubePlaylistPlayer url={yt} name={name} />
        </div>
      )}

      {isBrowsing && (
        <div className="gein-drive-player" style={{ animation: "gein-view-in 0.4s ease both" }}>
          <DriveExplorer url={drive} name={name} />
        </div>
      )}
    </div>
  );
}

function ModuleAccordion({
  module: mod,
  prefix,
  openModules,
  toggleModule,
  playingKey,
  setPlayingKey,
}: {
  module: GEINModule;
  prefix: string;
  openModules: Set<string>;
  toggleModule: (k: string) => void;
  playingKey: string | null;
  setPlayingKey: (k: string | null) => void;
}) {
  const key = `${prefix}-${mod.id}`;
  const isOpen = openModules.has(key);
  return (
    <div className={`gein-module ${isOpen ? "open" : ""}`}>
      <button
        className="gein-module-head"
        onClick={() => toggleModule(key)}
        aria-expanded={isOpen}
      >
        <span className="gein-module-id">{mod.id}</span>
        <span className="gein-module-title">{mod.title}</span>
        <span className="gein-module-count">
          {mod.elements.length} {mod.elements.length > 1 ? "éléments" : "élément"}
        </span>
        <ChevronDown className="gein-module-chevron" size={20} />
      </button>
      <div className="gein-module-body">
        <div className="gein-module-body-inner">
          <div className="gein-module-content">
            {mod.elements.map((el, idx) => {
              const elKey = `${key}-${idx}`;
              // playingKey is "<elKey>:yt" or "<elKey>:drive" — one open panel at a time.
              const panel = playingKey?.startsWith(`${elKey}:`)
                ? (playingKey.slice(elKey.length + 1) as "drive" | "yt")
                : null;
              return (
                <ElementRow
                  key={elKey}
                  name={el.name}
                  drive={el.drive}
                  yt={el.yt}
                  panel={panel}
                  onTogglePanel={(p) =>
                    setPlayingKey(panel === p ? null : `${elKey}:${p}`)
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleList({
  modules,
  prefix,
  openModules,
  toggleModule,
  playingKey,
  setPlayingKey,
}: {
  modules: GEINModule[];
  prefix: string;
  openModules: Set<string>;
  toggleModule: (k: string) => void;
  playingKey: string | null;
  setPlayingKey: (k: string | null) => void;
}) {
  return (
    <div className="gein-modules">
      {modules.map((m, i) => (
        <Reveal key={`${prefix}-${m.id}`} delay={i * 60}>
          <ModuleAccordion
            module={m}
            prefix={prefix}
            openModules={openModules}
            toggleModule={toggleModule}
            playingKey={playingKey}
            setPlayingKey={setPlayingKey}
          />
        </Reveal>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RESOURCES VIEW                                                     */
/* ------------------------------------------------------------------ */
const RESOURCE_TABS: { id: ResourceTab; label: string }[] = [
  { id: "s1", label: "S1" },
  { id: "s2", label: "S2" },
  { id: "s3", label: "S3" },
  { id: "s4", label: "S4" },
];

function ResourcesView() {
  const [tab, setTab] = useState<ResourceTab>("s1");
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const data = GEIN_DATA[tab];
  const toggleModule = useCallback((k: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  return (
    <div className="gein-view">
      <section className="gein-section" style={{ paddingBottom: "2.5rem" }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head" style={{ marginBottom: "1.75rem" }}>
              <div className="gein-section-eyebrow">Ressources Académiques</div>
              <h1 className="gein-section-title">Supports de Cours</h1>
              <p className="gein-section-desc">
                Parcourez chaque module par semestre. Chaque élément renvoie à
                son dossier Drive et à un lecteur YouTube intégré — sans
                redirection, tout reste ici.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <Tabs tabs={RESOURCE_TABS} active={tab} onChange={setTab} />
              {data.links && (
                <div className="gein-linkbar">
                  {data.links.map((l, i) => (
                    <LinkDropdown key={i} link={l} />
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem 1.25rem",
                alignItems: "baseline",
                marginBottom: "1.75rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "1.5rem",
                }}
              >
                {data.title}
              </h2>
              <span style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
                {data.subtitle}
              </span>
            </div>
          </Reveal>

          <ModuleList
            modules={data.modules}
            prefix={tab}
            openModules={openModules}
            toggleModule={toggleModule}
            playingKey={playingKey}
            setPlayingKey={setPlayingKey}
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SPECIALISATIONS VIEW                                               */
/* ------------------------------------------------------------------ */
const SPEC_TABS: { id: SpecTab; label: string }[] = [
  { id: "isnm", label: "ISNM" },
  { id: "ise", label: "ISE" },
  { id: "isei", label: "ISEI" },
];

function SpecialisationsView() {
  const [tab, setTab] = useState<SpecTab>("isnm");
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const option = GEIN_DATA[tab];
  const commun = GEIN_DATA.s5_commun;
  const toggleModule = useCallback((k: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  return (
    <div className="gein-view">
      <section className="gein-section" style={{ paddingBottom: "2.5rem" }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head" style={{ marginBottom: "1.75rem" }}>
              <div className="gein-section-eyebrow">3ème Année • Semestre 5</div>
              <h1 className="gein-section-title">Spécialisations</h1>
              <p className="gein-section-desc">
                Choisissez votre filière — ISNM, ISE ou ISEI. Chaque option
                s'appuie sur le tronc commun du S5, puis plonge dans ses modules
                spécialisés.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.75rem",
              }}
            >
              <Tabs tabs={SPEC_TABS} active={tab} onChange={setTab} />
              {option.links && (
                <div className="gein-linkbar">
                  {option.links.map((l, i) => (
                    <LinkDropdown key={i} link={l} />
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem 1.25rem",
                alignItems: "baseline",
                marginBottom: "0.5rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "1.5rem",
                }}
              >
                {option.title}
              </h2>
              <span style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
                {option.subtitle}
              </span>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-2)",
                marginBottom: "2.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <GraduationCap size={15} />
              Ci-dessous : les modules du tronc commun S5, suivis des modules
              spécialisés de cette option.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "1rem",
              }}
            >
              <span className="gein-syl-chip yellow">Tronc Commun</span>
              <span style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
                {commun.title}
              </span>
            </div>
          </Reveal>

          <ModuleList
            modules={commun.modules}
            prefix={`commun-${tab}`}
            openModules={openModules}
            toggleModule={toggleModule}
            playingKey={playingKey}
            setPlayingKey={setPlayingKey}
          />

          <Reveal delay={80}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                margin: "3rem 0 1rem",
              }}
            >
              <span className="gein-syl-chip cyan">Modules d'Option</span>
              <span style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
                {option.subtitle}
              </span>
            </div>
          </Reveal>

          <ModuleList
            modules={option.modules}
            prefix={`opt-${tab}`}
            openModules={openModules}
            toggleModule={toggleModule}
            playingKey={playingKey}
            setPlayingKey={setPlayingKey}
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SYLLABUS — INTERACTIVE MINDMAP (GEIN_DATA-based)                   */
/* ------------------------------------------------------------------ */
function Mindmap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [option, setOption] = useState<SylOptionId>("isnm");

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [edgePaths, setEdgePaths] = useState<
    { id: string; d: string; type: string; from: string; to: string }[]
  >([]);

  const activeNode = hovered || selected;

  const visibleNodes = useMemo(() => getVisibleNodes(option), [option]);
  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );
  const edges = useMemo(() => buildEdges(visibleIds), [visibleIds]);

  const measureEdges = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const paths: { id: string; d: string; type: string; from: string; to: string }[] = [];
    for (const e of edges) {
      const fromEl = nodeRefs.current[e.from];
      const toEl = nodeRefs.current[e.to];
      if (!fromEl || !toEl) continue;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const x1 = fr.right - wrapRect.left;
      const y1 = fr.top + fr.height / 2 - wrapRect.top;
      const x2 = tr.left - wrapRect.left;
      const y2 = tr.top + tr.height / 2 - wrapRect.top;
      const dx = Math.max(40, (x2 - x1) * 0.5);
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      paths.push({
        id: `${e.from}-${e.to}`,
        d,
        type: e.type,
        from: e.from,
        to: e.to,
      });
    }
    setEdgePaths(paths);
  }, [edges]);

  useEffect(() => {
    const raf = requestAnimationFrame(measureEdges);
    const t = setTimeout(measureEdges, 300);
    const onResize = () => measureEdges();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [zoom, option, measureEdges]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let down = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".gein-mm-node")) return;
      down = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = el.scrollLeft;
      startTop = el.scrollTop;
      el.classList.add("grabbing");
    };
    const onMove = (e: MouseEvent) => {
      if (!down) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
      el.scrollTop = startTop - (e.clientY - startY);
    };
    const onUp = () => {
      down = false;
      el.classList.remove("grabbing");
    };
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const connectedIds = useMemo(() => {
    if (!activeNode) return null;
    const ids = new Set<string>([activeNode]);
    for (const e of edges) {
      if (e.from === activeNode) ids.add(e.to);
      if (e.to === activeNode) ids.add(e.from);
    }
    return ids;
  }, [activeNode, edges]);

  const registerRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      nodeRefs.current[id] = el;
    },
    []
  );

  const isEdgeActive = (from: string, to: string) =>
    !!activeNode && (from === activeNode || to === activeNode);

  const zoomBy = (d: number) =>
    setZoom((z) => Math.max(0.6, Math.min(1.6, +(z + d).toFixed(2))));

  // group S5 nodes: commun first, then option
  const s5Nodes = useMemo(
    () =>
      visibleNodes
        .filter((n) => n.semester === "S5")
        .sort((a, b) => a.row - b.row),
    [visibleNodes]
  );

  return (
    <div className="gein-mindmap-wrap">
      <div className="gein-mindmap-toolbar">
        <div className="gein-mindmap-legend">
          <span className="gein-legend-item">
            <span className="gein-legend-swatch" style={{ background: "var(--accent)", color: "var(--accent)" }} />
            Tronc Commun
          </span>
          <span className="gein-legend-item">
            <span className="gein-legend-swatch" style={{ background: "var(--cyan)", color: "var(--cyan)" }} />
            Option (ISNM · ISE · ISEI)
          </span>
          <span className="gein-legend-item" style={{ color: "var(--text-2)" }}>
            Survolez un nœud pour tracer ses prérequis →
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <div className="gein-mm-options">
            {SYL_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={`gein-mm-opt ${option === o.id ? "active" : ""}`}
                onClick={() => setOption(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="gein-mindmap-controls">
            <button className="gein-mm-btn" onClick={() => zoomBy(-0.1)} aria-label="Dézoomer" title="Dézoomer">
              <Minus size={16} />
            </button>
            <button className="gein-mm-btn" onClick={() => setZoom(1)} aria-label="Réinitialiser le zoom" title="Réinitialiser">
              <Maximize2 size={15} />
            </button>
            <button className="gein-mm-btn" onClick={() => zoomBy(0.1)} aria-label="Zoomer" title="Zoomer">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="gein-mindmap-scroll" ref={scrollRef}>
        <div className="gein-mindmap" ref={wrapRef} style={{ transform: `scale(${zoom})` }}>
          <svg className="gein-mm-svg">
            {edgePaths.map((p) => {
              const active = isEdgeActive(p.from, p.to);
              const dimmed = connectedIds && !active;
              return (
                <path
                  key={p.id}
                  className={`gein-mm-edge ${p.type === "option" ? "cyan" : ""} ${active ? "active" : ""} ${dimmed ? "dimmed" : ""}`}
                  d={p.d}
                />
              );
            })}
          </svg>

          <div className="gein-mm-layer">
            {/* S1 - S4 columns */}
            {SYL_SEMESTERS.slice(0, 4).map((sem, colIdx) => (
              <div key={sem.id} style={{ display: "flex", flexDirection: "column" }}>
                <div className="gein-mm-col-label">
                  {sem.label}
                  <span className="sub">{sem.sub}</span>
                </div>
                {visibleNodes
                  .filter((n) => n.col === colIdx)
                  .sort((a, b) => a.row - b.row)
                  .map((n) => (
                    <MindmapNode
                      key={n.id}
                      node={n}
                      registerRef={registerRef}
                      activeNode={activeNode}
                      connectedIds={connectedIds}
                      onHover={setHovered}
                      onSelect={setSelected}
                    />
                  ))}
              </div>
            ))}

            {/* S5 column */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="gein-mm-col-label">
                {SYL_SEMESTERS[4].label}
                <span className="sub">{SYL_SEMESTERS[4].sub}</span>
              </div>
              {/* commun */}
              {s5Nodes
                .filter((n) => n.category === "common")
                .map((n) => (
                  <MindmapNode
                    key={n.id}
                    node={n}
                    registerRef={registerRef}
                    activeNode={activeNode}
                    connectedIds={connectedIds}
                    onHover={setHovered}
                    onSelect={setSelected}
                  />
                ))}
              {/* option label */}
              <div className="gein-mm-group-label">
                Option {option.toUpperCase()}
              </div>
              {s5Nodes
                .filter((n) => n.category === option)
                .map((n) => (
                  <MindmapNode
                    key={n.id}
                    node={n}
                    registerRef={registerRef}
                    activeNode={activeNode}
                    connectedIds={connectedIds}
                    onHover={setHovered}
                    onSelect={setSelected}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MindmapNode({
  node,
  registerRef,
  activeNode,
  connectedIds,
  onHover,
  onSelect,
}: {
  node: SylNode;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  activeNode: string | null;
  connectedIds: Set<string> | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}) {
  const colors = NODE_COLORS[node.category];
  const dimmed = connectedIds && !connectedIds.has(node.id);
  const highlighted = activeNode === node.id;
  return (
    <div
      ref={(el) => registerRef(node.id, el)}
      className={`gein-mm-node ${dimmed ? "dimmed" : ""} ${highlighted ? "highlighted" : ""}`}
      style={
        {
          ["--node-color" as string]: colors.color,
          ["--node-glow" as string]: colors.glow,
        } as React.CSSProperties
      }
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(activeNode === node.id ? null : node.id)}
    >
      <span className="gein-mm-node-id">{node.id.split("-")[1]}</span>
      <span className="gein-mm-node-title">{node.title}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SYLLABUS — MODULE DETAIL CARDS                                     */
/* ------------------------------------------------------------------ */
function SylDetailCard({ node }: { node: SylNode }) {
  const colors = NODE_COLORS[node.category];
  const objectives = SYL_OBJECTIVES[node.id] || [];
  const meta = SYL_META[node.id] || {};
  const prereqs = SYL_PREREQS[node.id] || [];
  return (
    <div
      className="gein-syl-card"
      style={
        {
          ["--card-color" as string]: colors.color,
        } as React.CSSProperties
      }
    >
      <div className="gein-syl-card-head">
        <span className="gein-syl-card-id">{node.id.split("-")[1]}</span>
        <span className="gein-syl-card-title">{node.title}</span>
      </div>

      <div className="gein-syl-card-meta">
        <span className={`gein-syl-chip ${node.category === "common" ? "yellow" : "cyan"}`}>
          {node.semester}
        </span>
        {meta.credits && <span className="gein-syl-chip">{meta.credits} crédits</span>}
        {meta.hours && <span className="gein-syl-chip">{meta.hours}h</span>}
        {meta.nature && (
          <span className={`gein-syl-chip ${meta.nature === "Disciplinaire" ? "yellow" : "cyan"}`}>
            {meta.nature}
          </span>
        )}
        {node.category !== "common" && (
          <span className="gein-syl-chip cyan">{node.category.toUpperCase()}</span>
        )}
      </div>

      {objectives.length > 0 && (
        <ul className="gein-syl-objectives">
          {objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}

      {node.elements.length > 0 && (
        <div className="gein-syl-elements">
          {node.elements.map((el, i) => (
            <span key={i} className="gein-syl-element">
              {el}
            </span>
          ))}
        </div>
      )}

      {prereqs.length > 0 && (
        <div className="gein-syl-prereqs">
          <span className="gein-syl-prereq-label">Prérequis :</span>
          {prereqs.map((p) => {
            const pn = SYL_NODES.find((x) => x.id === p);
            return (
              <span key={p} className="gein-syl-prereq" title={pn?.title}>
                {pn ? pn.id.split("-")[1] : p}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SyllabusView() {
  const [filter, setFilter] = useState<SylFilterId>("all");

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? SYL_NODES
        : SYL_NODES.filter((n) => n.category === filter);
    const order: Record<string, number> = { S1: 0, S2: 1, S3: 2, S4: 3, S5: 4 };
    return [...list].sort(
      (a, b) => order[a.semester] - order[b.semester] || a.row - b.row
    );
  }, [filter]);

  return (
    <div className="gein-view">
      <section className="gein-section" style={{ paddingBottom: "2.5rem" }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head" style={{ marginBottom: "1.75rem" }}>
              <div className="gein-section-eyebrow">Carte du Programme</div>
              <h1 className="gein-section-title">Syllabus &amp; Orientation</h1>
              <p className="gein-section-desc">
                Suivez la progression complète du programme GEIN — des
                fondamentaux de première année à votre spécialisation en
                troisième année. Survolez un nœud de la carte mentale pour
                mettre en évidence sa chaîne de prérequis ; descendez plus bas
                pour les objectifs détaillés de chaque module.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <Mindmap />
          </Reveal>

          <Reveal delay={40}>
            <div
              style={{
                marginTop: "2rem",
                padding: "1.1rem 1.4rem",
                borderRadius: "1rem",
                border: "1px solid var(--border-soft)",
                background: "color-mix(in srgb, var(--bg-2) 50%, transparent)",
                display: "flex",
                gap: "0.85rem",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  flexShrink: 0,
                  border: "1px solid var(--border-soft)",
                }}
              >
                <Zap size={18} />
              </span>
              <p style={{ fontSize: "0.86rem", lineHeight: 1.55, color: "var(--text-1)", margin: 0 }}>
                <strong style={{ color: "var(--text-0)" }}>Comment lire :</strong>{" "}
                les nœuds jaunes forment le tronc commun partagé par tous les
                étudiants ; les nœuds cyan sont spécifiques à une option (ISNM,
                ISE ou ISEI). Les lignes représentent les relations de prérequis
                — un module dépend de ceux auxquels il se relie.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="gein-section" style={{ paddingTop: 0 }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head" style={{ marginBottom: "1.5rem" }}>
              <div className="gein-section-eyebrow">Catalogue des Modules</div>
              <h2 className="gein-section-title">Descriptions Détaillées des Modules</h2>
              <p className="gein-section-desc">
                Objectifs pédagogiques, sous-éléments, crédits et prérequis pour
                chaque module — extraits du syllabus officiel GEIN.
              </p>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="gein-syl-tabs">
              {SYL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={`gein-syl-tab ${filter === f.id ? "active" : ""} ${
                    f.id !== "all" && f.id !== "common" ? "cyan" : ""
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="gein-syl-grid">
            {filtered.map((node, i) => (
              <Reveal key={node.id} delay={Math.min(i * 40, 280)}>
                <SylDetailCard node={node} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  INTERNSHIPS VIEW                                                   */
/* ------------------------------------------------------------------ */
const INTERN_TABS: { id: InternTab; label: string }[] = [
  { id: "init", label: "1ère Année" },
  { id: "pfa", label: "2ème Année" },
  { id: "pfe", label: "3ème Année" },
];

const INTERN_DATA: Record<
  InternTab,
  {
    phase: string;
    title: string;
    desc: string;
    color: string;
    guide: string; // Drive folder — "Stages/<phase>/Guide et Instructions"
    archives: string; // Drive folder — "Stages/<phase>/Archives des Rapports"
  }
> = {
  init: {
    phase: "1A",
    title: "Stage d'Initiation",
    desc: "Votre premier contact avec le monde professionnel. Un court stage d'immersion à la fin de la première année pour découvrir un environnement industriel ou technique et rédiger votre premier rapport.",
    color: "var(--accent)",
    guide: "https://drive.google.com/drive/folders/15kiS3G56zcvsoAmioUm5tH29e3NAbCsl",
    archives: "https://drive.google.com/drive/folders/1IiCCag2l6vH1KdQZ0AjTIUVEBTBRywd5",
  },
  pfa: {
    phase: "2A",
    title: "PFA — Projet de Fin d'Année",
    desc: "Un projet technique réalisé durant la deuxième année, appliquant les connaissances d'ingénieur acquises en S3 et S4. Se termine par une soutenance et un rapport écrit.",
    color: "var(--accent)",
    guide: "https://drive.google.com/drive/folders/1EUxV-wTrIRBNa-mnL3iEZOh4SDPRG3dH",
    archives: "https://drive.google.com/drive/folders/1UqxnXFUvnRPU-WeN0YiQZNzgBx0Xv1VL",
  },
  pfe: {
    phase: "3A",
    title: "PFE — Projet de Fin d'Études",
    desc: "Le couronnement. Un long stage de fin d'études en entreprise ou en laboratoire, culminant avec votre mémoire d'ingénieur et la soutenance finale avant l'obtention du diplôme.",
    color: "var(--cyan)",
    guide: "https://drive.google.com/drive/folders/1qMEcGVL-Yn0EWRGDi5OyO79vKIp3OKKr",
    archives: "https://drive.google.com/drive/folders/14YmuxRMdRilnralNqyLcLLL6OCmOHuzC",
  },
};

/* ------------------------------------------------------------------ */
/*  COMPANY CONSTELLATION (Moroccan EE companies star-map)             */
/* ------------------------------------------------------------------ */
type Sector =
  | "Énergie"
  | "Mines & Industrie"
  | "Ferroviaire"
  | "Automobile"
  | "Ingénierie"
  | "Électronique"
  | "Télécoms"
  | "Aéronautique"
  | "Biomédical";

type Company = {
  id: string;
  name: string;
  sector: Sector;
  desc: string;
  x: number;  // 0-100 (percent of viewBox width)
  y: number;  // 0-100
  mag: number; // star size
};

// Distinct color per sector — intentionally different from the theme
// (yellow/cyan) so each domain is visually identifiable.
const SECTOR_COLOR: Record<Sector, string> = {
  Énergie: "#FF6B35",            // orange (fire/energy)
  "Mines & Industrie": "#A78BFA", // purple (minerals)
  Ferroviaire: "#34D399",        // emerald (transit/movement)
  Automobile: "#F472B6",         // pink (automotive)
  Ingénierie: "#60A5FA",         // blue (engineering)
  Électronique: "#2DD4BF",       // teal (electronics)
  Télécoms: "#C084FC",           // violet (telecoms)
  Aéronautique: "#38BDF8",       // sky blue (aerospace)
  Biomédical: "#FB7185",         // rose (medical)
};

const COMPANIES: Company[] = [
  // ---- Énergie (top-left) ----
  { id: "onee", name: "ONEE", sector: "Énergie", desc: "Office National de l'Électricité et de l'Eau potable — production, transport et distribution d'électricité à l'échelle nationale.", x: 8, y: 12, mag: 4 },
  { id: "masen", name: "MASEN", sector: "Énergie", desc: "Moroccan Agency for Sustainable Energy — développement des énergies renouvelables (solaire, éolien) à grande échelle.", x: 14, y: 24, mag: 3 },
  { id: "nareva", name: "Nareva", sector: "Énergie", desc: "Filiale du groupe OCP — production d'énergie renouvelable et gestion de parcs éoliens et solaires.", x: 6, y: 30, mag: 3 },
  { id: "vinci", name: "VINCI Energies", sector: "Énergie", desc: "Ingénierie et installations électriques, infrastructures d'énergie et d'information au Maroc.", x: 18, y: 8, mag: 3 },
  { id: "taqa", name: "Taqa Morocco", sector: "Énergie", desc: "Production d'électricité — centrale thermique de Jorf Lasfar, l'une des plus grandes d'Afrique.", x: 22, y: 18, mag: 3 },
  { id: "cevital", name: "Cevital", sector: "Énergie", desc: "Groupe industriel diversifié — production d'énergie, agro-industrie et infrastructures électriques.", x: 12, y: 38, mag: 2 },
  { id: "edf", name: "EDF Maroc", sector: "Énergie", desc: "Filiale marocaine d'EDF — exploitation de centrales et conseil en efficacité énergétique et électrification.", x: 4, y: 20, mag: 2 },
  { id: "steg", name: "Siemens Energy", sector: "Énergie", desc: "Solutions de production et transport d'énergie — turbines à gaz, transformateurs HT et smart grids.", x: 26, y: 10, mag: 2 },
  { id: "engie", name: "ENGIE Maroc", sector: "Énergie", desc: "Producteur indépendant d'énergie — centrales à cycle combiné, solaire et éolien offshore en développement.", x: 4, y: 38, mag: 2 },

  // ---- Mines & Industrie (top-center) ----
  { id: "ocp", name: "OCP Group", sector: "Mines & Industrie", desc: "Office Chérifien des Phosphates — leader mondial du phosphate, gros consommateur d'énergie et d'ingénierie électrique.", x: 36, y: 14, mag: 5 },
  { id: "managem", name: "Managem", sector: "Mines & Industrie", desc: "Groupe minier (cobalt, cuivre, or) — installations électriques et automatisme industriel pour mines.", x: 44, y: 8, mag: 3 },
  { id: "sonasid", name: "Sonasid", sector: "Mines & Industrie", desc: "Société Nationale de Sidérurgie — production d'acier, fours électriques et automatisme industriel.", x: 32, y: 26, mag: 3 },
  { id: "maghrebsteel", name: "Maghreb Steel", sector: "Mines & Industrie", desc: "Lamineur d'acier — installations électriques lourdes et automatisme de process.", x: 42, y: 24, mag: 2 },
  { id: "lafarge", name: "LafargeHolcim", sector: "Mines & Industrie", desc: "Cimenterie — fours rotatifs, broyeurs et installations électriques haute puissance.", x: 38, y: 34, mag: 3 },
  { id: "cosumar", name: "Cosumar", sector: "Mines & Industrie", desc: "Agro-industrie sucrière — automatisation industrielle, instrumentation et installations électriques.", x: 50, y: 16, mag: 2 },
  { id: "ciments", name: "Ciments du Maroc", sector: "Mines & Industrie", desc: "Groupe HeidelbergCement — cimenteries équipées en automatisme industriel et gestion de l'énergie.", x: 46, y: 30, mag: 2 },
  { id: "fertima", name: "Fertima", sector: "Mines & Industrie", desc: "Production et distribution d'engrais — installations chimiques et électriques de process industriel.", x: 34, y: 38, mag: 2 },

  // ---- Ferroviaire (center) ----
  { id: "oncf", name: "ONCF", sector: "Ferroviaire", desc: "Office National des Chemins de Fer — traction électrique, signalisation et automatisme ferroviaire (Al Boraq).", x: 54, y: 30, mag: 4 },
  { id: "alstom", name: "Alstom Maroc", sector: "Ferroviaire", desc: "Construction ferroviaire — trains à grande vitesse, signalisation et systèmes d'électrification.", x: 48, y: 40, mag: 3 },
  { id: "caf", name: "CAF Maroc", sector: "Ferroviaire", desc: "Construcciones y Auxiliar de Ferrocarriles — fabrication de trains et équipements ferroviaires à Tanger.", x: 60, y: 38, mag: 3 },
  { id: "tmsa", name: "TMSA", sector: "Ferroviaire", desc: "Tanger Med Special Agency — port industriel géant avec systèmes d'automatisation et énergie portuaire.", x: 56, y: 44, mag: 2 },
  { id: "casatram", name: "Casa Tramway", sector: "Ferroviaire", desc: "Tramway de Casablanca — traction électrique, signalisation urbaine et gestion de flux.", x: 50, y: 50, mag: 2 },

  // ---- Automobile (top-right) ----
  { id: "renault", name: "Renault Tanger", sector: "Automobile", desc: "Usine de montage automobile — robotique, électronique embarquée et lignes de production automatisées.", x: 88, y: 12, mag: 4 },
  { id: "stellantis", name: "Stellantis Kénitra", sector: "Automobile", desc: "Groupe PSA — production de véhicules, électronique embarquée et systèmes électriques automobiles.", x: 80, y: 32, mag: 3 },
  { id: "lear", name: "Lear Corporation", sector: "Automobile", desc: "Fabricant de sièges et systèmes électriques automobiles — câblage, électronique embarquée.", x: 68, y: 10, mag: 3 },
  { id: "yazaki", name: "Yazaki", sector: "Automobile", desc: "Leader mondial du faisceau de câbles électriques automobile — câblage embarqué pour véhicules.", x: 76, y: 16, mag: 3 },
  { id: "bosch", name: "Bosch Maroc", sector: "Automobile", desc: "Équipementier automobile — électronique de puissance, systèmes d'injection, capteurs et IoT industriel.", x: 84, y: 22, mag: 3 },
  { id: "valeo", name: "Valeo", sector: "Automobile", desc: "Équipementier automobile — systèmes électriques, éclairage, aide à la conduite et véhicules électriques.", x: 72, y: 26, mag: 3 },
  { id: "sumitomo", name: "Sumitomo", sector: "Automobile", desc: "Fabricant de faisceaux de câbles électriques automobiles — câblage embarqué haute performance.", x: 90, y: 30, mag: 3 },
  { id: "plastomnium", name: "Plastic Omnium", sector: "Automobile", desc: "Équipementier automobile — systèmes électriques et électroniques pour batteries et carburant.", x: 66, y: 22, mag: 2 },
  { id: "delphi", name: "Aptiv Maroc", sector: "Automobile", desc: "Ex-Delphi — systèmes électriques et électroniques automobiles haute tension pour véhicules électriques.", x: 74, y: 6, mag: 2 },
  { id: "komax", name: "Komax Maroc", sector: "Automobile", desc: "Équipementier de câblage automobile — machines de coupe et d'assemblage de faisceaux de fils.", x: 82, y: 10, mag: 2 },
  { id: "amphenol", name: "Amphenol", sector: "Automobile", desc: "Fabricant de connecteurs et systèmes de câblage pour l'industrie automobile et aéronautique.", x: 78, y: 38, mag: 2 },

  // ---- Aéronautique (right) ----
  { id: "safran", name: "Safran Maroc", sector: "Aéronautique", desc: "Équipementier aéronautique — systèmes électriques et électroniques pour avions, câblage embarqué.", x: 92, y: 44, mag: 4 },
  { id: "boeing", name: "Boeing Maroc", sector: "Aéronautique", desc: "Ingénierie aéronautique — systèmes électriques, avionique et câblage pour aéronefs.", x: 84, y: 50, mag: 3 },
  { id: "ram", name: "RAM Engineering", sector: "Aéronautique", desc: "Royal Air Maroc — maintenance et ingénierie des systèmes électriques et avioniques.", x: 76, y: 46, mag: 3 },
  { id: "hexcel", name: "Hexcel Maroc", sector: "Aéronautique", desc: "Matériaux composites pour l'aéronautique — structures allégées et outillages électriques de production.", x: 92, y: 56, mag: 2 },
  { id: "stelia", name: "Stelia Aerospace", sector: "Aéronautique", desc: "Aérostructures — fuselages et structures câblées pour avions moyen-courrier et long-courrier.", x: 86, y: 60, mag: 2 },
  { id: "moog", name: "Moog Maroc", sector: "Aéronautique", desc: "Actionneurs électromécaniques et systèmes de contrôle de vol — électronique embarquée avancée.", x: 80, y: 56, mag: 2 },

  // ---- Télécoms (bottom-right) ----
  { id: "iam", name: "Maroc Telecom", sector: "Télécoms", desc: "Itissalat Al-Maghrib — infrastructures de télécommunications, fibre optique et centres de données.", x: 88, y: 64, mag: 4 },
  { id: "orange", name: "Orange Maroc", sector: "Télécoms", desc: "Opérateur télécom — réseaux mobiles, fibre optique et infrastructures de communication.", x: 80, y: 72, mag: 3 },
  { id: "inwi", name: "Inwi", sector: "Télécoms", desc: "Opérateur télécom — réseaux 4G/5G, fibre et solutions IoT pour l'industrie.", x: 92, y: 78, mag: 3 },
  { id: "huawei", name: "Huawei Maroc", sector: "Télécoms", desc: "Équipementier télécom — réseaux 5G, centres de données, solutions smart city et IA.", x: 84, y: 78, mag: 3 },
  { id: "ericsson", name: "Ericsson Maroc", sector: "Télécoms", desc: "Infrastructure de réseau mobile — déploiement 4G/5G, IoT industriel et connectivité critique.", x: 76, y: 82, mag: 2 },
  { id: "nokia", name: "Nokia Maroc", sector: "Télécoms", desc: "Réseaux télécom et solutions cloud — infrastructure IP/optique et solutions pour smart city.", x: 90, y: 86, mag: 2 },
  { id: "cisco", name: "Cisco Maroc", sector: "Télécoms", desc: "Réseau d'entreprise, cybersécurité, IoT industriel et automatisation des infrastructures numériques.", x: 82, y: 88, mag: 2 },

  // ---- Biomédical (center-left) ----
  { id: "dispha", name: "Dispha Maroc", sector: "Biomédical", desc: "Distributeur de matériel médical — instrumentation électronique et équipements biomédicaux.", x: 28, y: 48, mag: 3 },
  { id: "medis", name: "Medis", sector: "Biomédical", desc: "Fabricant et distributeur d'équipements médicaux — électronique médicale et imagerie.", x: 20, y: 56, mag: 3 },
  { id: "pfizer", name: "Pfizer Maroc", sector: "Biomédical", desc: "Industrie pharmaceutique — instrumentation électronique, automatisation de process et laboratoires.", x: 34, y: 56, mag: 2 },
  { id: "gemed", name: "GE Healthcare", sector: "Biomédical", desc: "Imagerie médicale et diagnostic — systèmes IRM, scanner et équipements électroniques médicaux.", x: 24, y: 64, mag: 2 },
  { id: "sothema", name: "Sothema", sector: "Biomédical", desc: "Laboratoire pharmaceutique marocain — automatisation de production et systèmes SCADA pharma.", x: 14, y: 58, mag: 2 },

  // ---- Ingénierie (bottom-left) ----
  { id: "bertrandt", name: "Bertrandt", sector: "Ingénierie", desc: "Bureau d'études d'ingénierie — R&D en électronique embarquée, mécatronique et systèmes électriques (Rabat & Tanger).", x: 14, y: 70, mag: 3 },
  { id: "schneider", name: "Schneider Electric", sector: "Ingénierie", desc: "Leader de la gestion d'énergie et de l'automatisme — distribution BT/HT, automatisme industriel, digitalisation.", x: 8, y: 78, mag: 4 },
  { id: "siemens", name: "Siemens Maroc", sector: "Ingénierie", desc: "Solutions d'automatisation industrielle, transport d'énergie, trains et infrastructures intelligentes.", x: 20, y: 80, mag: 4 },
  { id: "abb", name: "ABB Maroc", sector: "Ingénierie", desc: "Technologies d'électrification et d'automatisme industriel — variateurs de vitesse, robots, networks.", x: 6, y: 64, mag: 3 },
  { id: "segula", name: "Segula Technologies", sector: "Ingénierie", desc: "Bureau d'ingénierie mondiale — R&D en électricité, électronique et systèmes embarqués.", x: 28, y: 74, mag: 3 },
  { id: "alten", name: "Alten Maroc", sector: "Ingénierie", desc: "Ingénierie technologique — R&D en électronique, électricité et systèmes embarqués pour l'industrie.", x: 12, y: 88, mag: 3 },
  { id: "snef", name: "SNEF Maroc", sector: "Ingénierie", desc: "Ingénierie électrique et multi-technique — installations électriques, automatisme et réseaux.", x: 32, y: 86, mag: 3 },
  { id: "eiffage", name: "Eiffage Énergie", sector: "Ingénierie", desc: "Génie électrique et multitechnique — installations HT/BT, courants faibles, data centers et smart building.", x: 4, y: 86, mag: 2 },
  { id: "spie", name: "SPIE Maroc", sector: "Ingénierie", desc: "Services multi-techniques — électricité, automatisme, instrumentation et maintenance industrielle.", x: 22, y: 90, mag: 2 },
  { id: "sofrel", name: "Leroy-Somer", sector: "Ingénierie", desc: "Moteurs électriques, alternateurs et variateurs — solutions d'entraînement électrique industriel.", x: 36, y: 78, mag: 2 },

  // ---- Électronique / Composants (bottom-center) ----
  { id: "st", name: "STMicroelectronics", sector: "Électronique", desc: "Site de Bouskoura — assemblage et tests de semi-conducteurs, microélectronique et systèmes sur puce.", x: 48, y: 64, mag: 4 },
  { id: "ingelec", name: "Ingelec", sector: "Électronique", desc: "Constructeur marocain de matériel électrique — appareillage, canalisation, chemin de câbles et prises.", x: 56, y: 72, mag: 3 },
  { id: "nexans", name: "Nexans Maroc", sector: "Électronique", desc: "Fabricant de câbles électriques — câbles BT/MT, fibres optiques et solutions de connectique.", x: 64, y: 68, mag: 3 },
  { id: "snep", name: "SNEP", sector: "Électronique", desc: "Société Nationale d'Équipement et de Pièces — câbles électriques et équipements pour automobile et industrie.", x: 52, y: 80, mag: 3 },
  { id: "lextronics", name: "Lextronics", sector: "Électronique", desc: "Fabrication de cartes électroniques et EMS — assemblage de composants SMD pour l'industrie.", x: 42, y: 76, mag: 3 },
  { id: "composantma", name: "Composant Maroc", sector: "Électronique", desc: "Distribution de composants électroniques — semi-conducteurs, résistances, condensateurs et connecteurs.", x: 60, y: 82, mag: 2 },
  { id: "dehn", name: "DEHN Maroc", sector: "Électronique", desc: "Protection contre la foudre et surtensions — parafoudres, protections SPD et mises à la terre industrielles.", x: 44, y: 86, mag: 2 },
  { id: "legrand", name: "Legrand Maroc", sector: "Électronique", desc: "Équipements électriques basse tension — tableaux, prises, domotique et gestionnaires d'énergie.", x: 68, y: 80, mag: 2 },
  { id: "phoenix", name: "Phoenix Contact", sector: "Électronique", desc: "Connectique industrielle, automates modulaires et interfaces signal — solutions pour armoires électriques.", x: 56, y: 88, mag: 2 },
];


// Build links: connect companies in the same sector + key cross-sector links
function buildCompanyLinks(): { from: string; to: string; color: string }[] {
  const links: { from: string; to: string; color: string }[] = [];
  const bySector: Record<string, Company[]> = {};
  for (const c of COMPANIES) {
    (bySector[c.sector] = bySector[c.sector] || []).push(c);
  }
  for (const list of Object.values(bySector)) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const dx = list[i].x - list[j].x;
        const dy = list[i].y - list[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 22) {
          links.push({
            from: list[i].id,
            to: list[j].id,
            color: SECTOR_COLOR[list[i].sector],
          });
        }
      }
    }
  }
  // Cross-sector key links
  const find = (id: string) => COMPANIES.find((c) => c.id === id)!;
  const cross: [string, string][] = [
    ["ocp", "nareva"],
    ["ocp", "oncf"],
    ["oncf", "siemens"],
    ["oncf", "alstom"],
    ["lear", "st"],
    ["bosch", "st"],
    ["renault", "valeo"],
    ["renault", "lear"],
    ["yazaki", "snep"],
    ["schneider", "onee"],
    ["vinci", "onee"],
    ["siemens", "abb"],
    ["safran", "boeing"],
    ["iam", "orange"],
    ["st", "ingelec"],
    ["abb", "schneider"],
    ["alten", "bertrandt"],
    ["segula", "bertrandt"],
    // New links for added companies
    ["huawei", "iam"],
    ["nokia", "ericsson"],
    ["cisco", "iam"],
    ["eiffage", "schneider"],
    ["spie", "snef"],
    ["steg", "onee"],
    ["masen", "onee"],
    ["engie", "taqa"],
    ["delphi", "lear"],
    ["amphenol", "safran"],
    ["hexcel", "safran"],
    ["stelia", "boeing"],
    ["moog", "safran"],
    ["legrand", "schneider"],
    ["phoenix", "schneider"],
    ["leroy", "abb"],
    ["tmsa", "oncf"],
    ["gemed", "dispha"],
    ["sothema", "pfizer"],
    ["ocp", "fertima"],
    ["ocp", "managem"],
    ["ciments", "lafarge"],
    ["casatram", "oncf"],
  ];

  for (const [a, b] of cross) {
    if (find(a) && find(b)) {
      links.push({ from: a, to: b, color: "#64748B" }); // neutral grey for cross-sector
    }
  }
  return links;
}

const COMPANY_LINKS = buildCompanyLinks();

// Lookup tables for the constellation (built once).
const COMPANY_BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));
const COMPANY_NEIGHBORS = (() => {
  const m = new Map<string, Set<string>>(COMPANIES.map((c) => [c.id, new Set<string>()]));
  for (const l of COMPANY_LINKS) {
    m.get(l.from)?.add(l.to);
    m.get(l.to)?.add(l.from);
  }
  return m;
})();

// Pre-rendered radial glow per color — stamped with drawImage instead of
// live blur filters (the old SVG drop-shadows were what made hovering lag).
const glowSprites = new Map<string, HTMLCanvasElement>();
function glowSprite(color: string): HTMLCanvasElement {
  let c = glowSprites.get(color);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, `${color}aa`);
  grad.addColorStop(0.6, `${color}26`);
  grad.addColorStop(1, `${color}00`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowSprites.set(color, c);
  return c;
}

function CompanyConstellation() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = hovered || selected;
  const activeCompany = activeId ? COMPANY_BY_ID.get(activeId) ?? null : null;

  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<string | null>(null);
  const kickRef = useRef<() => void>(() => {});
  const geomRef = useRef({ s: 1, ox: 0, oy: 0 });

  // Canvas renderer: draws only while alphas are still easing toward their
  // targets, then stops — zero cost when nothing changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const starA = new Float32Array(COMPANIES.length).fill(1);
    const linkA = new Float32Array(COMPANY_LINKS.length).fill(0.22);
    const idx = new Map(COMPANIES.map((c, i) => [c.id, i]));
    const links = COMPANY_LINKS.map((l) => ({
      a: COMPANY_BY_ID.get(l.from)!,
      b: COMPANY_BY_ID.get(l.to)!,
      color: l.color,
    }));
    const mono = getComputedStyle(canvas).getPropertyValue("--font-mono").trim() || "monospace";
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.clientWidth;
      h = box.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Same mapping as the old viewBox="0 0 100 100" + xMidYMid meet.
      const s = Math.min(w, h) / 100;
      geomRef.current = { s, ox: (w - 100 * s) / 2, oy: (h - 100 * s) / 2 };
      kick();
    };

    const draw = () => {
      const { s, ox, oy } = geomRef.current;
      const X = (v: number) => ox + v * s;
      const Y = (v: number) => oy + v * s;
      const active = activeRef.current;
      const near = active ? COMPANY_NEIGHBORS.get(active)! : null;

      // Ease every alpha toward its target.
      let moving = false;
      COMPANIES.forEach((c, i) => {
        const target = !active || c.id === active || near!.has(c.id) ? 1 : 0.18;
        starA[i] += (target - starA[i]) * 0.25;
        if (Math.abs(target - starA[i]) > 0.01) moving = true;
        else starA[i] = target;
      });
      links.forEach((l, i) => {
        const on = !!active && (l.a.id === active || l.b.id === active);
        const target = on ? 0.95 : active ? 0.04 : 0.22;
        linkA[i] += (target - linkA[i]) * 0.25;
        if (Math.abs(target - linkA[i]) > 0.01) moving = true;
        else linkA[i] = target;
      });

      ctx.clearRect(0, 0, w, h);

      // Links
      ctx.lineCap = "round";
      links.forEach((l, i) => {
        const on = !!active && (l.a.id === active || l.b.id === active);
        ctx.globalAlpha = linkA[i];
        ctx.strokeStyle = l.color;
        ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(X(l.a.x), Y(l.a.y));
        ctx.lineTo(X(l.b.x), Y(l.b.y));
        ctx.stroke();
      });

      // Stars: halo sprite + solid core
      COMPANIES.forEach((c, i) => {
        const color = SECTOR_COLOR[c.sector];
        const isActive = c.id === active;
        const r = c.mag * s * (isActive ? 2.6 : 1.9);
        ctx.globalAlpha = starA[i] * (isActive ? 0.9 : 0.55);
        ctx.drawImage(glowSprite(color), X(c.x) - r, Y(c.y) - r, r * 2, r * 2);
        ctx.globalAlpha = starA[i];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(X(c.x), Y(c.y), Math.max(2, c.mag * s * (isActive ? 0.6 : 0.45)), 0, Math.PI * 2);
        ctx.fill();
      });

      // Labels: the active company and its direct connections
      if (active) {
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.lineJoin = "round";
        for (const id of [...near!, active]) {
          const c = COMPANY_BY_ID.get(id)!;
          const isActive = id === active;
          ctx.globalAlpha = starA[idx.get(id)!];
          ctx.font = `${isActive ? 600 : 500} ${isActive ? 14 : 11.5}px ${mono}, monospace`;
          const tx = X(c.x);
          const ty = Y(c.y) - c.mag * s * 0.9 - 6;
          ctx.strokeStyle = "rgba(6, 8, 13, 0.85)";
          ctx.lineWidth = 4;
          ctx.strokeText(c.name, tx, ty);
          ctx.fillStyle = isActive ? "#f3f4f6" : "#9ca3af";
          ctx.fillText(c.name, tx, ty);
        }
      }
      ctx.globalAlpha = 1;

      raf = moving ? requestAnimationFrame(draw) : 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    kickRef.current = kick;

    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Redraw when the highlighted company changes.
  useEffect(() => {
    activeRef.current = activeId;
    kickRef.current();
  }, [activeId]);

  // Hit-test: nearest star within its glow radius (min 12px).
  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { s, ox, oy } = geomRef.current;
    let best: string | null = null;
    let bestD = Infinity;
    for (const c of COMPANIES) {
      const d = Math.hypot(ox + c.x * s - px, oy + c.y * s - py);
      if (d < Math.max(12, c.mag * s * 1.6) && d < bestD) {
        best = c.id;
        bestD = d;
      }
    }
    return best;
  };

  return (
    <div className="gein-constellation-wrap">
      <div className="gein-constellation-toolbar">
        <div className="gein-const-legend">
          {Object.keys(SECTOR_COLOR).map((s) => (
            <span
              key={s}
              className="gein-const-stage"
              style={{ color: SECTOR_COLOR[s as Sector] }}
            >
              <span className="swatch" />
              {s}
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color: "var(--text-2)",
          }}
        >
          Survolez une étoile pour explorer →
        </span>
      </div>

      <div className="gein-const-scroll">
        <div className="gein-constellation" ref={boxRef}>
          <canvas
            ref={canvasRef}
            className="gein-const-canvas"
            role="img"
            aria-label={`Carte de ${COMPANIES.length} entreprises marocaines liées au génie électrique`}
            onPointerMove={(e) => {
              const id = pick(e);
              e.currentTarget.style.cursor = id ? "pointer" : "default";
              if (id !== hovered) setHovered(id);
            }}
            onPointerLeave={() => setHovered(null)}
            onClick={(e) => {
              const id = pick(e as unknown as React.PointerEvent<HTMLCanvasElement>);
              setSelected((cur) => (id && cur !== id ? id : null));
            }}
          />
        </div>
      </div>

      <div className="gein-const-info">
        {activeCompany ? (
          <div
            className="gein-const-info-card"
            style={
              {
                ["--star-color" as string]: SECTOR_COLOR[activeCompany.sector],
              } as React.CSSProperties
            }
          >
            <span className="gein-const-info-dot" />
            <div>
              <div className="gein-const-info-name">{activeCompany.name}</div>
              <div className="gein-const-info-sector">{activeCompany.sector}</div>
            </div>
            <div className="gein-const-info-desc">{activeCompany.desc}</div>
          </div>
        ) : (
          <span className="gein-const-info-empty">
            ✦ {COMPANIES.length} entreprises marocaines en relation avec le génie électrique — survolez une étoile pour découvrir l'entreprise.
          </span>
        )}
      </div>
    </div>
  );
}

function InternshipsView() {
  const [tab, setTab] = useState<InternTab>("init");
  const [panel, setPanel] = useState<"guide" | "archives" | null>(null);
  const data = INTERN_DATA[tab];
  const togglePanel = (p: "guide" | "archives") => setPanel(panel === p ? null : p);
  return (
    <div className="gein-view">
      <section className="gein-section" style={{ paddingBottom: "2.5rem" }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head centered" style={{ marginBottom: "1.75rem" }}>
              <div className="gein-section-eyebrow">Stages &amp; PFE</div>
              <h1 className="gein-section-title">Stages</h1>
              <p className="gein-section-desc">
                Tout ce qu'il faut pour chaque phase de stage — guides
                officiels, modèles de rapports, archive des mémoires et la
                carte des entreprises partenaires au Maroc.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
              <Tabs tabs={INTERN_TABS} active={tab} onChange={(t) => { setTab(t); setPanel(null); }} />
            </div>
          </Reveal>

          <div className="gein-intern-grid">
            <Reveal key={tab}>
              <TiltCard
                className="gein-intern-card"
                max={5}
                style={{ ["--card-color" as string]: data.color } as React.CSSProperties}
              >
                <span className="gein-intern-phase">{data.phase}</span>
                <div className="gein-intern-info">
                  <h3>{data.title}</h3>
                  <p>{data.desc}</p>
                </div>
                <div className="gein-intern-actions">
                  <Magnetic
                    as="button"
                    className={`gein-btn gein-btn-ghost ${panel === "guide" ? "active" : ""}`}
                    onClick={() => togglePanel("guide")}
                    strength={0.25}
                    aria-expanded={panel === "guide"}
                  >
                    <FileText size={16} />
                    Guide & Instructions
                  </Magnetic>
                  <Magnetic
                    as="button"
                    className={`gein-btn gein-btn-drive ${panel === "archives" ? "active" : ""}`}
                    onClick={() => togglePanel("archives")}
                    strength={0.25}
                    aria-expanded={panel === "archives"}
                  >
                    <HardDrive size={16} />
                    Archives des Rapports
                  </Magnetic>
                </div>
              </TiltCard>
            </Reveal>
            {panel && (
              <div className="gein-drive-player" style={{ animation: "gein-view-in 0.4s ease both" }}>
                <DriveExplorer
                  key={`${tab}-${panel}`}
                  url={panel === "guide" ? data.guide : data.archives}
                  name={`${data.phase} · ${panel === "guide" ? "Guide & Instructions" : "Archives des Rapports"}`}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="gein-section" style={{ paddingTop: 0 }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head centered" style={{ marginBottom: "1.75rem" }}>
              <div className="gein-section-eyebrow">Carte des Entreprises</div>
              <h2 className="gein-section-title">Entreprises au Maroc</h2>
              <p className="gein-section-desc">
                Une constellation des principales entreprises marocaines en
                relation avec le génie électrique — énergie, mines,
                ferroviaire, automobile, ingénierie et électronique. Survolez
                une étoile pour découvrir l'entreprise et ses liens.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <CompanyConstellation />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  COMMUNITY VIEW                                                     */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  BRAND ICONS (custom SVG — lucide has no brand icons)               */
/* ------------------------------------------------------------------ */
function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const COMMUNITY_CARDS: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  cta: string;
  href: string;
  color: string;
}[] = [
  {
    icon: WhatsAppIcon,
    title: "Groupe WhatsApp Global",
    desc: "Le groupe de chat toujours actif pour les annonces, les rappels et les conversations qui ne tiennent pas dans un fil Discord.",
    cta: "Ouvrir WhatsApp",
    href: "https://chat.whatsapp.com/HzrQuRVNrPv92krZdVBioh",
    color: "#25D366", // WhatsApp brand green
  },
  {
    icon: Youtube,
    title: "Chaîne YouTube Étudiante",
    desc: "Tutoriels, sessions enregistrées et vidéos de révision produites par les étudiants pour la communauté GEIN. Abonnez-vous pour ne rien manquer.",
    cta: "Visiter la Chaîne",
    href: "https://www.youtube.com/channel/UCqaHrJCdbizXuUW2Rn9gqCQ",
    color: "#FF0000", // YouTube brand red
  },
];

function CommunityView() {
  return (
    <div className="gein-view">
      <section className="gein-section" style={{ paddingBottom: "2.5rem" }}>
        <div className="gein-container">
          <Reveal>
            <div className="gein-section-head" style={{ marginBottom: "2rem" }}>
              <div className="gein-section-eyebrow">Restez Connecté</div>
              <h1 className="gein-section-title">Communauté</h1>
              <p className="gein-section-desc">
                La filière GEIN, c'est plus que des modules et des examens. Voici
                les espaces où vit réellement la communauté — choisissez votre
                plateforme et rejoignez-nous.
              </p>
            </div>
          </Reveal>

          <div className="gein-community-grid">
            {COMMUNITY_CARDS.map((c, i) => {
              // No link yet ("#") — show the card muted and non-clickable.
              const disabled = !c.href || c.href === "#";
              return (
                <Reveal key={c.title} delay={i * 90}>
                  <TiltCard
                    {...(disabled
                      ? { as: "div" as const }
                      : { as: "a" as const, href: c.href, target: "_blank", rel: "noopener noreferrer" })}
                    className={`gein-community-card ${disabled ? "is-disabled" : ""}`}
                    max={disabled ? 0 : 8}
                    style={{ ["--card-color" as string]: c.color } as React.CSSProperties}
                  >
                    <span className="gein-community-icon">
                      <c.icon size={26} />
                    </span>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                    <span className="gein-community-cta">
                      {disabled ? "Bientôt disponible" : c.cta}
                      {!disabled && <ArrowUpRight size={16} />}
                    </span>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div
              style={{
                marginTop: "2.5rem",
                padding: "1.75rem",
                borderRadius: "1.25rem",
                border: "1px solid var(--border-soft)",
                background: "color-mix(in srgb, var(--bg-2) 50%, transparent)",
                backdropFilter: "blur(12px)",
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  <Hammer size={20} />
                </span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.1rem" }}>
                    Envie de contribuer ?
                  </div>
                  <div style={{ color: "var(--text-1)", fontSize: "0.88rem" }}>
                    Les ressources sont maintenues par la communauté. Contactez-nous pour ajouter ou corriger un lien.
                  </div>
                </div>
              </div>
              {/* No destination yet — disabled until a contact link is provided */}
              <button className="gein-btn gein-btn-primary is-disabled" disabled title="Bientôt disponible">
                <Sparkles size={16} />
                S'impliquer
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                             */
/* ------------------------------------------------------------------ */
function Footer({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  return (
    <footer className="gein-footer">
      <div className="gein-container">
        <div className="gein-footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img src="/logo.png" alt="" aria-hidden className="gein-brand-logo" style={{ height: 26 }} width={385} height={197} />
            <p>Portail Étudiant GEIN</p>
          </div>
          <div className="gein-footer-links">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.id}
                onClick={() => onNavigate(n.id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <div className="gein-footer-initiative">
          <span className="gein-footer-dot" aria-hidden />
          Initiative étudiante &amp; à but non lucratif — conçu par et pour la communauté.
          Les ressources sont partagées librement par les étudiants de la filière GEIN.
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  ROOT                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [view, setView] = useState<ViewId>("home");

  const navigate = useCallback((v: ViewId) => {
    setView(v);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <>
      <CircuitBackground />
      <div className="gein-shell">
        <Navbar view={view} onNavigate={navigate} />
        <main className="gein-main">
          {view === "home" && <HomeView onNavigate={navigate} />}
          {view === "resources" && <ResourcesView />}
          {view === "specialisations" && <SpecialisationsView />}
          {view === "syllabus" && <SyllabusView />}
          {view === "internships" && <InternshipsView />}
          {view === "community" && <CommunityView />}
        </main>
        <Footer onNavigate={navigate} />
      </div>
    </>
  );
}
