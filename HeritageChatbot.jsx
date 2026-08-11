import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Mic, MicOff, Send, Image as ImageIcon, X, Volume2, VolumeX, Sparkles, AlertCircle, Loader2,
  MapPin, ChevronRight, Map as MapIcon, History as HistoryIcon, Plus, Trash2, ExternalLink,
} from "lucide-react";

/* ---------- Design tokens (shared with the Kalinga portal) ---------- */
const C = {
  bg: "#15120F",
  bgDeep: "#0E0C0A",
  panel: "#1F1B16",
  panelLine: "#3A342B",
  gold: "#C89B3C",
  goldSoft: "#E4C878",
  brick: "#A6362C",
  brickSoft: "#C97165",
  ivory: "#EDE3CC",
  ivoryMuted: "#AFA48D",
  teal: "#4E7A6E",
  tealSoft: "#7DA79A",
};

const TIER_COLOR = { 1: C.gold, 2: C.tealSoft, 3: C.ivoryMuted };
const STORAGE_KEY = "kalinga_guide_sessions_v1";
const MAX_SESSIONS = 20;

/* ---------- Language config ---------- */
const LANGS = {
  en: { label: "English", short: "EN", speechLang: "en-IN", ttsLang: "en" },
  hi: { label: "हिन्दी", short: "HI", speechLang: "hi-IN", ttsLang: "hi" },
  or: { label: "ଓଡ଼ିଆ", short: "OR", speechLang: "or-IN", ttsLang: "or" },
};

const SUGGESTIONS = {
  en: ["Best time to visit Jagannath Temple", "Tell me about Konark Sun Temple", "What can I do in Koraput?", "Show me a photo and read it for me"],
  hi: ["जगन्नाथ मंदिर जाने का सबसे अच्छा समय", "कोणार्क सूर्य मंदिर के बारे में बताएं", "कोरापुट में क्या देखें?"],
  or: ["ପୁରୀ ଯିବାର ସର୍ବୋତ୍ତମ ସମୟ", "କୋଣାର୍କ ମନ୍ଦିର ବିଷୟରେ କୁହନ୍ତୁ"],
};

/* ---------- District dataset (schematic x/y — not real GPS) ---------- */
const DISTRICTS = [
  { name: "Puri", tier: 1, cats: ["Spiritual & Temple", "Coastal & Beach"], hi: ["Jagannath Temple", "Rath Yatra", "Chilika Lake", "Raghurajpur craft village"], note: "Flagship pilot district.", x: 50, y: 58 },
  { name: "Khordha", tier: 1, cats: ["Spiritual & Temple", "Historical", "Urban"], hi: ["Lingaraj Temple", "Udayagiri-Khandagiri Caves", "Bhubaneswar"], x: 45, y: 48 },
  { name: "Cuttack", tier: 1, cats: ["Historical", "Craft & Textile", "Spiritual & Temple"], hi: ["Barabati Fort", "Tarakasi silver filigree", "Durga Puja"], x: 48, y: 40 },
  { name: "Sambalpur", tier: 1, cats: ["Craft & Textile", "Historical"], hi: ["Hirakud Dam", "Sambalpuri Ikat weaving"], x: 18, y: 28 },
  { name: "Koraput", tier: 1, cats: ["Tribal & Indigenous", "Hill & Scenic", "Wildlife & Eco"], hi: ["Tribal heartland", "Waterfalls", "Coffee plantations"], note: "Southern tribal-heritage anchor.", x: 25, y: 82 },
  { name: "Ganjam", tier: 2, cats: ["Coastal & Beach", "Spiritual & Temple", "Craft & Textile"], hi: ["Gopalpur Beach", "Temples", "Silk weaving"], x: 45, y: 75 },
  { name: "Balasore", tier: 2, cats: ["Coastal & Beach", "Historical"], hi: ["Chandipur vanishing sea", "Historical sites"], x: 60, y: 10 },
  { name: "Mayurbhanj", tier: 2, cats: ["Wildlife & Eco", "Tribal & Indigenous", "Hill & Scenic"], hi: ["Similipal National Park", "Waterfalls"], x: 45, y: 6 },
  { name: "Jajpur", tier: 2, cats: ["Spiritual & Temple", "Historical"], hi: ["Ancient spiritual centre", "Archaeological sites"], x: 48, y: 30 },
  { name: "Bargarh", tier: 2, cats: ["Spiritual & Temple", "Tribal & Indigenous"], hi: ["Dhanu Yatra festival", "Rural traditions"], x: 10, y: 30 },
  { name: "Kandhamal", tier: 2, cats: ["Tribal & Indigenous", "Hill & Scenic", "Wildlife & Eco"], hi: ["Hills", "Forests", "Waterfalls"], x: 30, y: 60 },
  { name: "Gajapati", tier: 2, cats: ["Tribal & Indigenous", "Hill & Scenic"], hi: ["Southern tribal heartland"], x: 40, y: 70 },
  { name: "Rayagada", tier: 2, cats: ["Hill & Scenic", "Tribal & Indigenous"], hi: ["Scenic train routes", "Tribal communities"], x: 30, y: 72 },
  { name: "Keonjhar", tier: 2, cats: ["Hill & Scenic", "Wildlife & Eco"], hi: ["Waterfalls", "Mineral-rich hills"], x: 35, y: 12 },
  { name: "Sundargarh", tier: 2, cats: ["Tribal & Indigenous", "Wildlife & Eco", "Hill & Scenic"], hi: ["Forests", "Waterfalls"], x: 15, y: 10 },
  { name: "Kendrapara", tier: 3, cats: ["Wildlife & Eco", "Coastal & Beach"], hi: ["Bhitarkanika mangroves", "Crocodiles"], x: 58, y: 35 },
  { name: "Jagatsinghpur", tier: 3, cats: ["Coastal & Beach", "Urban"], hi: ["Coastal belt", "Paradip Port"], x: 55, y: 45 },
  { name: "Angul", tier: 3, cats: ["Urban", "Hill & Scenic", "Spiritual & Temple"], hi: ["Industrial hub", "Forests, rivers"], x: 35, y: 28 },
  { name: "Dhenkanal", tier: 3, cats: ["Historical", "Wildlife & Eco", "Hill & Scenic"], hi: ["History", "Wildlife sanctuaries"], x: 40, y: 33 },
  { name: "Deogarh", tier: 3, cats: ["Hill & Scenic", "Wildlife & Eco"], hi: ["Waterfalls", "Forests"], x: 20, y: 18 },
  { name: "Jharsuguda", tier: 3, cats: ["Urban"], hi: ["Emerging destination"], x: 10, y: 20 },
  { name: "Balangir", tier: 3, cats: ["Historical", "Spiritual & Temple"], hi: ["Historical sites", "Temples"], x: 15, y: 42 },
  { name: "Subarnapur", tier: 3, cats: ["Spiritual & Temple", "Historical"], hi: ["Temples", "Heritage architecture"], x: 20, y: 40 },
  { name: "Nuapada", tier: 3, cats: ["Hill & Scenic", "Tribal & Indigenous"], hi: ["Scenic landscapes", "Village life"], x: 5, y: 45 },
  { name: "Kalahandi", tier: 3, cats: ["Hill & Scenic", "Tribal & Indigenous"], hi: ["Valleys", "Deep-rooted traditions"], x: 15, y: 55 },
  { name: "Nayagarh", tier: 3, cats: ["Hill & Scenic", "Spiritual & Temple"], hi: ["Hill views", "Temples"], x: 35, y: 50 },
  { name: "Nabarangpur", tier: 3, cats: ["Tribal & Indigenous"], hi: ["Tribal culture", "Forests, rivers"], x: 15, y: 75 },
  { name: "Malkangiri", tier: 3, cats: ["Tribal & Indigenous", "Wildlife & Eco"], hi: ["Offbeat", "Untouched nature"], x: 10, y: 88 },
  { name: "Bhadrak", tier: 3, cats: ["Spiritual & Temple", "Coastal & Beach"], hi: ["Temples", "Festivals"], x: 55, y: 22 },
  { name: "Boudh", tier: 3, cats: ["Spiritual & Temple", "Historical"], hi: ["Ancient temples", "River views"], x: 28, y: 40 },
];
const DISTRICT_NAMES_BY_LENGTH = [...DISTRICTS].sort((a, b) => b.name.length - a.name.length);
const DISTRICT_BY_NAME = Object.fromEntries(DISTRICTS.map(d => [d.name, d]));

const SYSTEM_PROMPT = `You are "Kalinga Guide" — the multilingual heritage assistant for a digital portal about Odisha, India. You speak with the calm, precise warmth of a museum guide, never over-excited.

Rules:
- Reply in the language the user's message is written in, or in the language named in [reply_language: X] if present at the end of the user's message.
- If asked to reply in Odia, do your best, but if you are not fully confident in the fluency of your Odia, add one short parenthetical note in English at the end flagging that translation quality may vary — do this at most once per conversation, not every message.
- Keep answers to 2-4 sentences by default. Only go longer if the user explicitly asks for detail.
- Cover Odisha heritage: temples, festivals, tribal (Adivasi) culture, crafts and textiles, wildlife and coastal sites, and practical travel tips like typical crowd timing.
- When you mention a specific district by name, use its exact name plainly in the text (e.g. "Puri", "Koraput") so it can be cross-referenced — don't only use a landmark name without the district.
- Never invent live facts (today's exact crowd count, today's weather, live prices). Say plainly when something needs a live data source instead of guessing.
- If the user sends a photo, describe plainly what is visible. If it looks like an inscription, palm-leaf manuscript (pothi), or Odia script, describe what you can make out but be honest about the limits of reading historic or damaged script from a photo — never invent a translation you are not confident in.
- No exclamation-point enthusiasm. Grounded and specific beats generic and cheerful.`;

/* ---------- generic helpers ---------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Could not read image"));
    r.readAsDataURL(file);
  });
}

function pickVoice(langCode) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  let v = voices.find(v => v.lang.toLowerCase().startsWith(langCode));
  if (!v && langCode === "or") v = voices.find(v => v.lang.toLowerCase().startsWith("hi"));
  if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith("en"));
  return v || voices[0] || null;
}

function speakText(text, langCode, onEnd) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(langCode);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = langCode; }
    u.rate = 0.97;
    u.onend = () => onEnd && onEnd();
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}

function findMentionedDistricts(text) {
  if (!text) return [];
  const found = [];
  const seen = new Set();
  for (const d of DISTRICT_NAMES_BY_LENGTH) {
    const re = new RegExp(`\\b${d.name}\\b`, "i");
    if (re.test(text) && !seen.has(d.name)) { found.push(d); seen.add(d.name); }
    if (found.length >= 3) break;
  }
  return found;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- live photo lookup (Wikipedia REST search, no key needed, CORS-open) ---------- */
const wikiImageCache = new Map();
async function fetchWikiImage(query) {
  if (wikiImageCache.has(query)) return wikiImageCache.get(query);
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=480&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;
    const result = page?.thumbnail?.source
      ? { src: page.thumbnail.source, title: page.title, pageUrl: page.fullurl }
      : null;
    wikiImageCache.set(query, result);
    return result;
  } catch (e) {
    wikiImageCache.set(query, null);
    return null;
  }
}

/* ---------- session persistence (real localStorage — this ships as a standalone app, not a Claude.ai artifact) ---------- */
function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function persistSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS))); } catch (e) { /* storage full or blocked — fail silently */ }
}
function sessionTitle(messages) {
  const firstUser = messages.find(m => m.role === "user");
  const raw = firstUser?.text?.trim();
  if (!raw || raw === "(photo)") return "New conversation";
  return raw.length > 42 ? raw.slice(0, 42) + "…" : raw;
}
/* strip base64 image data before persisting so localStorage never bloats */
function toStorableApiHistory(history) {
  return history.map(entry => {
    if (Array.isArray(entry.content)) {
      return { ...entry, content: entry.content.map(b => b.type === "image" ? { type: "text", text: "[a photo was attached here — not restored after reload]" } : b) };
    }
    return entry;
  });
}

const SpeechRecognitionCtor = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

/* ---------- sub-components ---------- */
function DistrictPhoto({ d }) {
  const [img, setImg] = useState(undefined); // undefined = loading, null = none found
  useEffect(() => {
    let alive = true;
    setImg(undefined);
    fetchWikiImage(`${d.hi[0]} ${d.name} Odisha`).then(r => { if (alive) setImg(r); });
    return () => { alive = false; };
  }, [d.name]);

  if (img === null) return null;
  return (
    <div className="rounded-lg overflow-hidden mb-2" style={{ border: `1px solid ${C.panelLine}`, height: 110, backgroundColor: C.bg, position: "relative" }}>
      {img === undefined ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 size={14} className="animate-spin" color={C.ivoryMuted} />
        </div>
      ) : (
        <>
          <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
          <a
            href={img.pageUrl} target="_blank" rel="noreferrer"
            className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[9px] font-mono flex items-center gap-0.5"
            style={{ backgroundColor: "#000000AA", color: C.ivoryMuted }}
          >
            Wikipedia <ExternalLink size={8} />
          </a>
        </>
      )}
    </div>
  );
}

function DistrictCard({ d, onAskMore, compact }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.panelLine}` }}>
      <DistrictPhoto d={d} />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TIER_COLOR[d.tier] }} />
          <span className="font-display text-sm" style={{ color: C.ivory }}>{d.name}</span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: C.ivoryMuted }}>Tier {d.tier}</span>
      </div>
      <p className="text-[11px] mb-1.5" style={{ color: C.goldSoft }}>{d.cats.join(" · ")}</p>
      {!compact && (
        <ul className="mb-2 space-y-0.5">
          {d.hi.slice(0, 3).map(h => (
            <li key={h} className="flex items-start gap-1 text-[11px]" style={{ color: C.ivoryMuted }}>
              <ChevronRight size={10} color={C.gold} className="shrink-0 mt-0.5" /> {h}
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => onAskMore(d)} className="text-[11px] font-mono flex items-center gap-1" style={{ color: C.gold }}>
        <MapPin size={10} /> Ask more about {d.name}
      </button>
    </div>
  );
}

function DistrictMap({ districts, highlighted, selected, onSelect }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.panelLine}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <MapIcon size={13} color={C.gold} />
        <span className="font-mono text-[11px]" style={{ color: C.ivoryMuted }}>Odisha — schematic, not to scale</span>
      </div>
      <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: "1/1.15" }}>
        <rect x="1" y="1" width="98" height="98" rx="10" fill="none" stroke={C.panelLine} strokeWidth="0.5" />
        {districts.map(d => {
          const isHi = highlighted.some(h => h.name === d.name);
          const isSel = selected?.name === d.name;
          return (
            <g key={d.name} onClick={() => onSelect(d)} style={{ cursor: "pointer" }}>
              {(isHi || isSel) && (
                <circle cx={d.x} cy={d.y} r="3.2" fill="none" stroke={C.gold} strokeWidth="0.5">
                  <animate attributeName="r" values="2.2;4.5;2.2" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={d.x} cy={d.y} r={isSel ? 2 : 1.4} fill={isHi || isSel ? C.gold : TIER_COLOR[d.tier]} stroke={C.bgDeep} strokeWidth="0.4" />
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {[1, 2, 3].map(t => (
          <div key={t} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TIER_COLOR[t] }} />
            <span className="text-[10px] font-mono" style={{ color: C.ivoryMuted }}>Tier {t}</span>
          </div>
        ))}
      </div>
      {selected && <div className="mt-3"><DistrictCard d={selected} onAskMore={onSelect} /></div>}
    </div>
  );
}

function HistoryDrawer({ open, onClose, sessions, currentId, onLoad, onDelete, onNew }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "#000000AA" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-[85vw] max-w-xs h-full p-4 flex flex-col gap-3 overflow-y-auto" style={{ backgroundColor: C.panel, borderLeft: `1px solid ${C.panelLine}` }}>
        <div className="flex items-center justify-between">
          <span className="font-display text-lg" style={{ color: C.goldSoft }}>Past conversations</span>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ border: `1px solid ${C.panelLine}` }}><X size={13} color={C.ivoryMuted} /></button>
        </div>
        <button
          onClick={onNew}
          className="flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-mono"
          style={{ backgroundColor: C.gold, color: "#15120F" }}
        >
          <Plus size={14} /> New conversation
        </button>
        {sessions.length === 0 && (
          <p className="text-xs mt-2" style={{ color: C.ivoryMuted }}>Nothing saved yet — conversations save automatically as you chat.</p>
        )}
        <div className="flex flex-col gap-2">
          {sessions.map(s => (
            <div
              key={s.id}
              className="rounded-xl p-3 flex items-start justify-between gap-2"
              style={{ backgroundColor: C.bgDeep, border: `1px solid ${s.id === currentId ? C.gold : C.panelLine}`, cursor: "pointer" }}
              onClick={() => onLoad(s.id)}
            >
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: C.ivory }}>{s.title}</p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: C.ivoryMuted }}>{new Date(s.updatedAt).toLocaleString()} · {s.messages.length} messages</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="p-1.5 rounded-full shrink-0" style={{ border: `1px solid ${C.panelLine}` }}>
                <Trash2 size={12} color={C.brickSoft} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeritageChatbot() {
  const [lang, setLang] = useState("en");
  const initialGreeting = { role: "assistant", text: "Namaskar. I'm Kalinga Guide — ask me about Odisha's temples, festivals, tribal heritage, or crafts. Type, speak, show me a photo, or tap a district on the map.", langUsed: "en" };
  const [messages, setMessages] = useState([initialGreeting]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [micSupported, setMicSupported] = useState(!!SpeechRecognitionCtor);
  const [micError, setMicError] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [mapOpenMobile, setMapOpenMobile] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => { setSessions(loadSessions()); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const tier1 = useMemo(() => DISTRICTS.filter(d => d.tier === 1), []);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setListening(false); }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) { setMicSupported(false); return; }
    setMicError("");
    const rec = new SpeechRecognitionCtor();
    rec.lang = LANGS[lang].speechLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => setInput(prev => (prev ? prev + " " : "") + e.results[0][0].transcript);
    rec.onerror = (e) => {
      if (e.error === "language-not-supported") setMicError(`Voice input for ${LANGS[lang].label} isn't supported on this browser — try English or Hindi, or type instead.`);
      else if (e.error === "not-allowed" || e.error === "service-not-allowed") setMicError("Microphone access was blocked. Allow it in your browser's site settings to use voice input.");
      else setMicError("Didn't catch that — try again or type your question.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [lang]);

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const base64 = await fileToBase64(file);
      setImage({ base64, mediaType: file.type, previewUrl: URL.createObjectURL(file) });
    } catch (err) { setMicError("Couldn't read that image — try a different file."); }
    e.target.value = "";
  }

  function persistCurrentSession(finalMessages, finalHistory) {
    const id = currentSessionId || genId();
    if (!currentSessionId) setCurrentSessionId(id);
    const storableMessages = finalMessages.map(m => ({ role: m.role, text: m.text, langUsed: m.langUsed, isError: m.isError, districtNames: (m.districts || []).map(d => d.name), hadImage: !!m.imagePreview }));
    const entry = { id, title: sessionTitle(finalMessages), createdAt: sessions.find(s => s.id === id)?.createdAt || Date.now(), updatedAt: Date.now(), messages: storableMessages, apiHistory: toStorableApiHistory(finalHistory) };
    setSessions(prev => {
      const next = [entry, ...prev.filter(s => s.id !== id)].slice(0, MAX_SESSIONS);
      persistSessions(next);
      return next;
    });
  }

  function loadSession(id) {
    const s = sessions.find(s => s.id === id);
    if (!s) return;
    setMessages(s.messages.map(m => ({ ...m, districts: (m.districtNames || []).map(n => DISTRICT_BY_NAME[n]).filter(Boolean) })));
    historyRef.current = s.apiHistory;
    setCurrentSessionId(id);
    setSelectedDistrict(null);
    setHistoryOpen(false);
  }

  function deleteSession(id) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      persistSessions(next);
      return next;
    });
    if (id === currentSessionId) startNewConversation();
  }

  function startNewConversation() {
    setMessages([initialGreeting]);
    historyRef.current = [];
    setCurrentSessionId(null);
    setSelectedDistrict(null);
    setHistoryOpen(false);
  }

  async function sendMessage(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text && !image) return;
    if (listening) stopListening();

    const userContentBlocks = [];
    if (image) userContentBlocks.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } });
    userContentBlocks.push({ type: "text", text: text || "Describe this photo and relate it to Odisha heritage if relevant." });

    const nextMessages = [...messages, { role: "user", text: text || "(photo)", imagePreview: image?.previewUrl, langUsed: lang }];
    setMessages(nextMessages);
    historyRef.current = [...historyRef.current, { role: "user", content: userContentBlocks }];
    setInput("");
    setImage(null);
    setThinking(true);

    const taggedLast = { ...historyRef.current[historyRef.current.length - 1] };
    taggedLast.content = taggedLast.content.map(b => b.type === "text" ? { ...b, text: `${b.text} [reply_language: ${LANGS[lang].label}]` } : b);
    const apiMessages = [...historyRef.current.slice(0, -1), taggedLast];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: SYSTEM_PROMPT, messages: apiMessages }),
      });
      const data = await response.json();
      const replyText = (data.content || []).map(b => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n").trim()
        || "I couldn't form a reply just then — could you ask again?";

      const mentioned = findMentionedDistricts(replyText);
      historyRef.current = [...historyRef.current, { role: "assistant", content: replyText }];
      const finalMessages = [...nextMessages, { role: "assistant", text: replyText, langUsed: lang, districts: mentioned }];
      setMessages(finalMessages);
      if (mentioned.length) setSelectedDistrict(mentioned[0]);
      if (autoSpeak) speakText(replyText, LANGS[lang].ttsLang);
      persistCurrentSession(finalMessages, historyRef.current);
    } catch (err) {
      const finalMessages = [...nextMessages, { role: "assistant", text: "Trouble reaching the guide just now — check your connection and try again.", isError: true, langUsed: lang }];
      setMessages(finalMessages);
      persistCurrentSession(finalMessages, historyRef.current);
    } finally {
      setThinking(false);
    }
  }

  function askAboutDistrict(d) {
    setSelectedDistrict(d);
    setMapOpenMobile(false);
    sendMessage(`Tell me about ${d.name}`);
  }

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
  const highlightedOnMap = lastAssistantMsg?.districts || [];

  return (
    <div style={{ backgroundColor: C.bg, color: C.ivory, minHeight: "100vh", fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;1,500&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        ::selection { background: ${C.gold}; color: #15120F; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
        @keyframes ripple { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes dotPulse { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
        .ripple-ring { position: absolute; inset: 0; border-radius: 9999px; border: 1.5px solid ${C.gold}; animation: ripple 1.6s ease-out infinite; }
        .ripple-ring.r2 { animation-delay: .5s; }
        .ripple-ring.r3 { animation-delay: 1s; }
        .dot { animation: dotPulse 1.2s infinite; }
        .dot:nth-child(2) { animation-delay: .2s; }
        .dot:nth-child(3) { animation-delay: .4s; }
        @media (prefers-reduced-motion: reduce) { .ripple-ring { animation: none; opacity: 0; } }
      `}</style>

      {/* HEADER */}
      <div className="px-6 md:px-12 py-6 flex flex-col gap-4" style={{ borderBottom: `1px solid ${C.panelLine}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} color={C.gold} />
            <span className="font-display text-2xl" style={{ color: C.goldSoft }}>Kalinga Guide</span>
            <span className="font-mono text-xs hidden sm:inline" style={{ color: C.ivoryMuted }}>/ voice · text · photo · map, one guide</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHistoryOpen(true)} className="px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5" style={{ border: `1px solid ${C.panelLine}`, color: C.ivoryMuted }}>
              <HistoryIcon size={12} /> History
            </button>
            <button onClick={() => setMapOpenMobile(v => !v)} className="lg:hidden px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5" style={{ border: `1px solid ${C.panelLine}`, color: C.ivoryMuted }}>
              <MapIcon size={12} /> Districts
            </button>
            {Object.entries(LANGS).map(([code, l]) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className="px-3 py-1.5 rounded-full text-sm font-mono transition-colors"
                style={{ border: `1px solid ${lang === code ? C.gold : C.panelLine}`, backgroundColor: lang === code ? C.gold : "transparent", color: lang === code ? "#15120F" : C.ivoryMuted }}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: C.ivoryMuted, lineHeight: 1.6 }}>
          Type, speak, show a photo, or tap a district — answers come back in {LANGS[lang].label}.
          {lang === "or" && <span> Odia voices are rare on most browsers, so spoken replies may fall back to a Hindi voice reading Odia text; typed Odia always works fully.</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {tier1.map(d => (
            <button key={d.name} onClick={() => askAboutDistrict(d)} className="text-xs px-3 py-1.5 rounded-full font-mono flex items-center gap-1" style={{ border: `1px solid ${C.panelLine}`, color: C.ivoryMuted }}>
              <MapPin size={10} color={C.gold} /> {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* BODY: chat + map */}
      <div className="px-4 md:px-12 py-8 max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="rounded-3xl overflow-hidden flex flex-col" style={{ backgroundColor: C.panel, border: `1px solid ${C.panelLine}`, height: "64vh", minHeight: 420 }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                {m.imagePreview && <img src={m.imagePreview} alt="Uploaded" className="rounded-xl mb-1 max-h-40 object-cover" style={{ border: `1px solid ${C.panelLine}` }} />}
                {!m.imagePreview && m.hadImage && (
                  <div className="text-[10px] font-mono mb-1 px-2 py-1 rounded-lg" style={{ color: C.ivoryMuted, border: `1px dashed ${C.panelLine}` }}>photo attached (not restored after reload)</div>
                )}
                <div className="text-sm max-w-[85%] px-4 py-2.5 rounded-2xl" style={{ backgroundColor: m.role === "user" ? C.gold : (m.isError ? C.brick + "33" : C.bgDeep), color: m.role === "user" ? "#15120F" : (m.isError ? C.brickSoft : C.ivory), lineHeight: 1.55 }}>
                  {m.isError && <AlertCircle size={13} className="inline mr-1 -mt-0.5" />}
                  {m.text}
                </div>
                {m.role === "assistant" && !m.isError && (
                  <button onClick={() => speakText(m.text, LANGS[m.langUsed || lang].ttsLang)} className="mt-1 flex items-center gap-1 text-[11px] font-mono" style={{ color: C.ivoryMuted }}>
                    <Volume2 size={11} /> Listen again
                  </button>
                )}
                {m.districts && m.districts.length > 0 && (
                  <div className="mt-2 grid gap-2 w-full max-w-[85%]" style={{ gridTemplateColumns: `repeat(${Math.min(m.districts.length, 2)}, 1fr)` }}>
                    {m.districts.map(d => <DistrictCard key={d.name} d={d} onAskMore={askAboutDistrict} compact />)}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl w-fit" style={{ backgroundColor: C.bgDeep }}>
                <span className="dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.gold }} />
                <span className="dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.gold }} />
                <span className="dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.gold }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {(SUGGESTIONS[lang] || SUGGESTIONS.en).map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 rounded-full font-mono" style={{ border: `1px solid ${C.panelLine}`, color: C.ivoryMuted }}>{s}</button>
              ))}
            </div>
          )}

          {micError && <div className="px-5 pb-2 flex items-center gap-2 text-xs" style={{ color: C.brickSoft }}><AlertCircle size={12} /> {micError}</div>}

          {image && (
            <div className="px-5 pb-2 flex items-center gap-2">
              <img src={image.previewUrl} alt="To send" className="h-12 w-12 object-cover rounded-lg" style={{ border: `1px solid ${C.panelLine}` }} />
              <button onClick={() => setImage(null)} className="p-1 rounded-full" style={{ border: `1px solid ${C.panelLine}` }}><X size={12} color={C.ivoryMuted} /></button>
              <span className="text-xs font-mono" style={{ color: C.ivoryMuted }}>attached — will be read by the guide</span>
            </div>
          )}

          <div className="p-3 flex items-center gap-2" style={{ borderTop: `1px solid ${C.panelLine}` }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} title="Attach a photo" className="p-2.5 rounded-full shrink-0" style={{ border: `1px solid ${C.panelLine}` }}>
              <ImageIcon size={16} color={C.ivoryMuted} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={`Ask in ${LANGS[lang].label}...`}
              className="flex-1 bg-transparent outline-none text-sm px-2 min-w-0"
              style={{ color: C.ivory }}
            />
            <button
              onClick={() => (listening ? stopListening() : startListening())}
              title={micSupported ? "Voice input" : "Voice input not supported in this browser"}
              disabled={!micSupported}
              className="relative p-2.5 rounded-full shrink-0"
              style={{ border: `1px solid ${listening ? C.gold : C.panelLine}`, backgroundColor: listening ? C.gold + "22" : "transparent", opacity: micSupported ? 1 : 0.4 }}
            >
              {listening && (<><span className="ripple-ring" /><span className="ripple-ring r2" /><span className="ripple-ring r3" /></>)}
              {listening ? <Mic size={16} color={C.gold} /> : <MicOff size={16} color={C.ivoryMuted} />}
            </button>
            <button onClick={() => sendMessage()} className="p-2.5 rounded-full shrink-0" style={{ backgroundColor: C.gold, color: "#15120F" }}>
              {thinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        <div className={`${mapOpenMobile ? "block" : "hidden"} lg:block`}>
          <DistrictMap districts={DISTRICTS} highlighted={highlightedOnMap} selected={selectedDistrict} onSelect={askAboutDistrict} />
        </div>
      </div>

      <div className="px-4 md:px-12 pb-8 max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <button onClick={() => setAutoSpeak(v => !v)} className="flex items-center gap-2 text-xs font-mono" style={{ color: autoSpeak ? C.goldSoft : C.ivoryMuted }}>
          {autoSpeak ? <Volume2 size={13} /> : <VolumeX size={13} />}
          {autoSpeak ? "Replies are spoken aloud" : "Replies stay silent — tap to enable audio"}
        </button>
        <span className="text-[11px] font-mono" style={{ color: C.ivoryMuted }}>
          {micSupported ? "Voice input ready" : "Voice input unsupported — type instead"} · powered live, not scripted
        </span>
      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        currentId={currentSessionId}
        onLoad={loadSession}
        onDelete={deleteSession}
        onNew={startNewConversation}
      />
    </div>
  );
}
