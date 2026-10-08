"use client";

/* ------------------------------------------------------------------ */
/*  STUDY DOCK — floating Pomodoro · tasks · quick notes               */
/*  Everything lives in this browser's localStorage: each visitor only */
/*  ever sees their own timer, tasks and notes (nothing is sent out).  */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ListTodo,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SkipForward,
  StickyNote,
  Timer,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

type Mode = "work" | "short" | "long";
type Tab = "timer" | "todos" | "notes";

type Settings = {
  work: number; // minutes
  short: number;
  long: number;
  longEvery: number; // long break after N work sessions
  autoStart: boolean;
  sound: boolean;
  volume: number; // 0..100
  notify: boolean;
};

type TimerState = {
  mode: Mode;
  running: boolean;
  fresh: boolean; // at full duration, never started (follows settings changes)
  endAt: number | null; // timestamp while running
  remaining: number; // ms, while paused
  completed: number; // finished work sessions
};

type Todo = { id: string; text: string; done: boolean };

type Store = { settings: Settings; timer: TimerState; todos: Todo[]; notes: string };

const STORAGE_KEY = "gein-study-dock-v1";

const DEFAULT_SETTINGS: Settings = {
  work: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStart: false,
  sound: true,
  volume: 60,
  notify: false,
};

const DEFAULT_TIMER: TimerState = {
  mode: "work",
  running: false,
  fresh: true,
  endAt: null,
  remaining: DEFAULT_SETTINGS.work * 60_000,
  completed: 0,
};

const MODE_LABEL: Record<Mode, string> = {
  work: "Travail",
  short: "Pause courte",
  long: "Pause longue",
};

function loadStore(): Store {
  const base: Store = { settings: DEFAULT_SETTINGS, timer: DEFAULT_TIMER, todos: [], notes: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Store>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...s.settings },
      timer: { ...DEFAULT_TIMER, ...s.timer },
      todos: Array.isArray(s.todos) ? s.todos : [],
      notes: typeof s.notes === "string" ? s.notes : "",
    };
  } catch {
    return base;
  }
}

function saveStore(s: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* private mode / storage full — the dock still works for this visit */
  }
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function fmt(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  SOUNDS — synthesized with Web Audio (soft "electric" cues)         */
/* ------------------------------------------------------------------ */
let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioCtx ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  o: { type: OscillatorType; f0: number; f1?: number; at: number; dur: number; gain: number }
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime + o.at;
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur * 0.45);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

// Short filtered-noise crackle — the "spark".
function spark(ctx: AudioContext, out: AudioNode, at: number, gain: number) {
  const len = Math.floor(ctx.sampleRate * 0.09);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.2);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2800;
  bp.Q.value = 2.5;
  const g = ctx.createGain();
  const t = ctx.currentTime + at;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
}

function playCue(kind: "work" | "break", volume: number) {
  const ctx = getAudio();
  if (!ctx || volume <= 0) return;
  const master = ctx.createGain();
  master.gain.value = (volume / 100) * 0.35; // capped — never loud
  master.connect(ctx.destination);
  if (kind === "work") {
    // "Power-up": spark, then a rising hum settling on a clean tone.
    spark(ctx, master, 0, 0.45);
    tone(ctx, master, { type: "sawtooth", f0: 110, f1: 220, at: 0.02, dur: 0.35, gain: 0.06 });
    tone(ctx, master, { type: "sine", f0: 196, f1: 523, at: 0.02, dur: 0.45, gain: 0.5 });
    tone(ctx, master, { type: "triangle", f0: 523, at: 0.38, dur: 0.6, gain: 0.32 });
    tone(ctx, master, { type: "sine", f0: 1046, at: 0.38, dur: 0.5, gain: 0.08 });
  } else {
    // "Break chime": small spark + two soft bell partials.
    spark(ctx, master, 0, 0.3);
    tone(ctx, master, { type: "sine", f0: 659, at: 0.05, dur: 1.3, gain: 0.42 });
    tone(ctx, master, { type: "sine", f0: 988, at: 0.24, dur: 1.5, gain: 0.32 });
    tone(ctx, master, { type: "sine", f0: 1318, at: 0.24, dur: 1.0, gain: 0.06 });
  }
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */
export function StudyDock() {
  const [mounted, setMounted] = useState(false);
  const [store, setStore] = useState<Store>({
    settings: DEFAULT_SETTINGS,
    timer: DEFAULT_TIMER,
    todos: [],
    notes: "",
  });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("timer");
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [draft, setDraft] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const baseTitle = useRef<string>("");

  const { settings, timer, todos, notes } = store;

  // Load once on the client (localStorage is unavailable during SSR).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(loadStore());
    setMounted(true);
    baseTitle.current = document.title;
  }, []);

  useEffect(() => {
    if (mounted) saveStore(store);
  }, [store, mounted]);

  const durationOf = useCallback(
    (m: Mode, s: Settings = settings) => Math.max(1, s[m]) * 60_000,
    [settings]
  );

  const total = durationOf(timer.mode);
  const remaining = timer.running
    ? Math.max(0, (timer.endAt ?? now) - now)
    : timer.fresh
      ? total
      : timer.remaining;
  const progress = Math.min(1, Math.max(0, 1 - remaining / total));

  // Tick while running (timestamps keep it exact in background tabs).
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer.running]);

  const update = (fn: (s: Store) => Store) => setStore((s) => fn(s));

  const notify = useCallback(
    (title: string, body: string) => {
      if (!settings.notify || typeof Notification === "undefined") return;
      if (Notification.permission !== "granted" || !document.hidden) return;
      try {
        new Notification(title, { body, icon: "/icon.png", silent: true });
      } catch {
        /* some browsers only allow notifications from a service worker */
      }
    },
    [settings.notify]
  );

  // Latest state for event-style callbacks (keeps side effects out of state updaters).
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Advance to the next phase. `counted` = a work session actually finished.
  const advance = useCallback(
    (counted: boolean, withCue: boolean) => {
      const s = storeRef.current;
      const t = s.timer;
      let completed = t.completed;
      let next: Mode;
      if (t.mode === "work") {
        if (counted) completed += 1;
        next = counted && completed % Math.max(1, s.settings.longEvery) === 0 ? "long" : "short";
      } else {
        next = "work";
      }
      if (withCue) {
        if (s.settings.sound) playCue(next === "work" ? "work" : "break", s.settings.volume);
        notify(
          next === "work" ? "Au travail ⚡" : "Pause ☕",
          next === "work"
            ? `Nouvelle session de ${s.settings.work} min.`
            : `${MODE_LABEL[next]} de ${s.settings[next]} min — bien joué !`
        );
      }
      const dur = Math.max(1, s.settings[next]) * 60_000;
      const auto = s.settings.autoStart;
      const nextTimer: TimerState = {
        mode: next,
        completed,
        running: auto,
        fresh: !auto,
        endAt: auto ? Date.now() + dur : null,
        remaining: dur,
      };
      storeRef.current = { ...s, timer: nextTimer }; // guard against a double fire before re-render
      setStore((cur) => ({ ...cur, timer: nextTimer }));
    },
    [notify]
  );

  // Phase finished.
  useEffect(() => {
    const t = storeRef.current.timer;
    if (t.running && t.endAt !== null && now >= t.endAt) advance(true, true);
  }, [now, timer.running, timer.endAt, advance]);

  // Countdown in the tab title while running.
  useEffect(() => {
    if (!mounted) return;
    if (timer.running) document.title = `${fmt(remaining)} · ${MODE_LABEL[timer.mode]} — GEIN`;
    else if (baseTitle.current) document.title = baseTitle.current;
  }, [mounted, timer.running, timer.mode, remaining]);

  // Close on Escape / outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(el) && !el.closest(".gein-dock-fab")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  /* ---------------- timer actions ---------------- */
  const start = () => {
    getAudio(); // unlock audio on a user gesture
    if (timer.fresh && timer.mode === "work" && settings.sound) playCue("work", settings.volume);
    update((s) => ({
      ...s,
      timer: { ...s.timer, running: true, fresh: false, endAt: Date.now() + remaining },
    }));
    setNow(Date.now());
  };
  const pause = () =>
    update((s) => ({
      ...s,
      timer: { ...s.timer, running: false, endAt: null, remaining: Math.max(0, (s.timer.endAt ?? Date.now()) - Date.now()) },
    }));
  const reset = () =>
    update((s) => ({ ...s, timer: { ...s.timer, running: false, fresh: true, endAt: null } }));
  const setMode = (m: Mode) =>
    update((s) => ({ ...s, timer: { ...s.timer, mode: m, running: false, fresh: true, endAt: null } }));
  const setSetting = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));

  const toggleNotify = async () => {
    if (settings.notify) return setSetting("notify", false);
    if (typeof Notification === "undefined") return;
    const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    setSetting("notify", perm === "granted");
  };

  /* ---------------- todo actions ---------------- */
  const addTodo = () => {
    const text = draft.trim();
    if (!text) return;
    update((s) => ({ ...s, todos: [...s.todos, { id: uid(), text, done: false }] }));
    setDraft("");
  };
  const doneCount = useMemo(() => todos.filter((t) => t.done).length, [todos]);

  if (!mounted) return null;

  const isBreak = timer.mode !== "work";
  const active = timer.running || !timer.fresh;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className={`gein-dock ${isBreak ? "is-break" : ""}`}>
      {open && (
        <div className="gein-dock-panel" ref={panelRef} role="dialog" aria-label="Espace d'étude">
          <div className="gein-dock-head">
            <div className="gein-dock-tabs" role="tablist">
              {(
                [
                  ["timer", Timer, "Minuteur"],
                  ["todos", ListTodo, "Tâches"],
                  ["notes", StickyNote, "Notes"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  className={`gein-dock-tab ${tab === id ? "active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  <Icon size={14} />
                  {label}
                  {id === "todos" && todos.length > 0 && (
                    <span className="gein-dock-count">{todos.length - doneCount}</span>
                  )}
                </button>
              ))}
            </div>
            <button className="gein-dock-icon-btn" onClick={() => setOpen(false)} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>

          {/* ---------------- TIMER ---------------- */}
          {tab === "timer" && (
            <div className="gein-dock-body">
              <div className="gein-dock-modes">
                {(["work", "short", "long"] as const).map((m) => (
                  <button
                    key={m}
                    className={`gein-dock-mode ${timer.mode === m ? "active" : ""}`}
                    onClick={() => setMode(m)}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>

              <div className="gein-dock-clock">
                <svg viewBox="0 0 128 128" aria-hidden>
                  <circle cx="64" cy="64" r={R} className="track" />
                  <circle
                    cx="64"
                    cy="64"
                    r={R}
                    className="bar"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - progress)}
                  />
                </svg>
                <div className="gein-dock-clock-text">
                  <span className="time">{fmt(remaining)}</span>
                  <span className="label">{MODE_LABEL[timer.mode]}</span>
                </div>
              </div>

              <div className="gein-dock-controls">
                <button className="gein-dock-icon-btn" onClick={reset} aria-label="Réinitialiser" title="Réinitialiser">
                  <RotateCcw size={16} />
                </button>
                {timer.running ? (
                  <button className="gein-dock-main" onClick={pause}>
                    <Pause size={18} /> Pause
                  </button>
                ) : (
                  <button className="gein-dock-main" onClick={start}>
                    <Play size={18} /> {timer.fresh ? "Démarrer" : "Reprendre"}
                  </button>
                )}
                <button
                  className="gein-dock-icon-btn"
                  onClick={() => advance(false, false)}
                  aria-label="Passer à la phase suivante"
                  title="Passer"
                >
                  <SkipForward size={16} />
                </button>
              </div>

              <div className="gein-dock-meta">
                <span>
                  <Zap size={12} /> {timer.completed} session{timer.completed > 1 ? "s" : ""} effectuée
                  {timer.completed > 1 ? "s" : ""}
                </span>
                <button className="gein-dock-link" onClick={() => setShowSettings((v) => !v)}>
                  <Settings2 size={13} /> Réglages
                </button>
              </div>

              {showSettings && (
                <div className="gein-dock-settings">
                  {(
                    [
                      ["work", "Travail", 1, 120],
                      ["short", "Pause courte", 1, 60],
                      ["long", "Pause longue", 1, 90],
                      ["longEvery", "Pause longue toutes les", 1, 12],
                    ] as const
                  ).map(([k, label, min, max]) => (
                    <label key={k} className="gein-dock-field">
                      <span>{label}</span>
                      <span className="gein-dock-num">
                        <input
                          type="number"
                          min={min}
                          max={max}
                          value={settings[k]}
                          onChange={(e) => {
                            const v = Math.round(Number(e.target.value));
                            if (Number.isFinite(v)) setSetting(k, Math.min(max, Math.max(min, v)));
                          }}
                        />
                        <em>{k === "longEvery" ? "sessions" : "min"}</em>
                      </span>
                    </label>
                  ))}
                  <label className="gein-dock-field">
                    <span>Enchaîner automatiquement</span>
                    <input
                      type="checkbox"
                      className="gein-dock-switch"
                      checked={settings.autoStart}
                      onChange={(e) => setSetting("autoStart", e.target.checked)}
                    />
                  </label>
                  <label className="gein-dock-field">
                    <span>
                      <Bell size={13} /> Notification (onglet en arrière-plan)
                    </span>
                    <input
                      type="checkbox"
                      className="gein-dock-switch"
                      checked={settings.notify}
                      onChange={toggleNotify}
                    />
                  </label>
                  <div className="gein-dock-field">
                    <button
                      className="gein-dock-icon-btn"
                      onClick={() => setSetting("sound", !settings.sound)}
                      aria-label={settings.sound ? "Couper le son" : "Activer le son"}
                    >
                      {settings.sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.volume}
                      disabled={!settings.sound}
                      onChange={(e) => setSetting("volume", Number(e.target.value))}
                      aria-label="Volume"
                      className="gein-dock-range"
                    />
                    <button
                      className="gein-dock-link"
                      disabled={!settings.sound}
                      onClick={() => playCue(timer.mode === "work" ? "break" : "work", settings.volume)}
                    >
                      Tester
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------- TODOS ---------------- */}
          {tab === "todos" && (
            <div className="gein-dock-body">
              <form
                className="gein-dock-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  addTodo();
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nouvelle tâche…"
                  maxLength={200}
                  autoFocus
                />
                <button type="submit" className="gein-dock-icon-btn" aria-label="Ajouter" disabled={!draft.trim()}>
                  <Plus size={16} />
                </button>
              </form>
              {todos.length === 0 ? (
                <p className="gein-dock-empty">Aucune tâche. Ajoute ce que tu veux finir aujourd'hui.</p>
              ) : (
                <ul className="gein-dock-todos">
                  {todos.map((t) => (
                    <li key={t.id} className={t.done ? "done" : ""}>
                      <button
                        className="gein-dock-check"
                        aria-label={t.done ? "Marquer non terminée" : "Marquer terminée"}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            todos: s.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                          }))
                        }
                      >
                        {t.done && <Check size={12} />}
                      </button>
                      <span>{t.text}</span>
                      <button
                        className="gein-dock-del"
                        aria-label="Supprimer"
                        onClick={() => update((s) => ({ ...s, todos: s.todos.filter((x) => x.id !== t.id) }))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {todos.length > 0 && (
                <div className="gein-dock-meta">
                  <span>
                    {doneCount}/{todos.length} terminée{doneCount > 1 ? "s" : ""}
                  </span>
                  {doneCount > 0 && (
                    <button
                      className="gein-dock-link"
                      onClick={() => update((s) => ({ ...s, todos: s.todos.filter((x) => !x.done) }))}
                    >
                      Effacer les terminées
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---------------- NOTES ---------------- */}
          {tab === "notes" && (
            <div className="gein-dock-body">
              <textarea
                className="gein-dock-notes"
                value={notes}
                onChange={(e) => update((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Notes rapides : formules, rappels, idées…"
                autoFocus
              />
              <div className="gein-dock-meta">
                <span>{notes.length} caractères</span>
                {notes && (
                  <button
                    className="gein-dock-link"
                    onClick={() => {
                      if (window.confirm("Effacer toutes les notes ?")) update((s) => ({ ...s, notes: "" }));
                    }}
                  >
                    Tout effacer
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="gein-dock-privacy">🔒 Enregistré uniquement dans ce navigateur — visible par toi seul.</p>
        </div>
      )}

      {/* Floating button — shows a live progress ring + time when a session is active */}
      <button
        className={`gein-dock-fab ${open ? "open" : ""} ${timer.running ? "running" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'espace d'étude" : "Ouvrir l'espace d'étude (minuteur, tâches, notes)"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 56 56" aria-hidden className="gein-dock-fab-ring">
          <circle cx="28" cy="28" r="25" className="track" />
          {active && (
            <circle
              cx="28"
              cy="28"
              r="25"
              className="bar"
              strokeDasharray={2 * Math.PI * 25}
              strokeDashoffset={2 * Math.PI * 25 * (1 - progress)}
            />
          )}
        </svg>
        {open ? <X size={20} /> : <Zap size={22} />}
        {active && !open && <span className="gein-dock-fab-time">{fmt(remaining)}</span>}
      </button>
    </div>
  );
}
