// ANUBHAV Pilgrim Mobile AI Assistant — Mobile-First Chat Screen
// Connects exclusively to /api/agent and renders interactive structured cards
// for all 7 Kumbh Mela multilingual scenes (Hindi → Marathi → English).

import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Car,
  Route as RouteIcon,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  ShieldAlert,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AgentResponse, StructuredCard } from "@/services";

export const Route = createFileRoute("/pilgrim")({
  component: PilgrimChatPage,
});

interface ChatMessage {
  id: string;
  sender: "user" | "anubhav";
  text: string;
  timestamp: string;
  language?: "hi" | "mr" | "en" | undefined;
  toolsCalled?: string[] | undefined;
  structuredCard?: StructuredCard | undefined;
  latencyMs?: number | undefined;
  tier?: "TACTICAL_OVERRIDE" | "VERIFIED_ADVISORY" | "AUTOMATED_GUIDANCE" | undefined;
  reasoning?: string | undefined;
}

const DEMO_SCENES = [
  {
    id: "scene1",
    label: "1. Hindi: 4 AM Journey",
    lang: "हिन्दी",
    prompt: "मैं सुबह 4 बजे आ रहा हूँ। मुझे स्नान और दर्शन दोनों करने हैं। सबसे आसान और कम भीड़ वाला रास्ता बताओ।",
  },
  {
    id: "scene2",
    label: "2. Hindi: 5 AM Follow-up",
    lang: "हिन्दी",
    prompt: "अगर मैं 5 बजे पहुँचूँ तो?",
  },
  {
    id: "scene3",
    label: "3. Marathi: Toilet T12",
    lang: "मराठी",
    prompt: "मला रामकुंडच्या जवळ कमी गर्दी असलेलं स्वच्छ शौचालय कुठे मिळेल?",
  },
  {
    id: "scene4",
    label: "4. Marathi: Food K08",
    lang: "मराठी",
    prompt: "स्नान झाल्यानंतर जवळपास चांगलं आणि परवडणारं जेवण कुठे मिळेल?",
  },
  {
    id: "scene5",
    label: "5. English: Darshan First",
    lang: "English",
    prompt: "Actually, I want to go for darshan first. What should I do?",
  },
  {
    id: "scene6",
    label: "6. English: Restrictions",
    lang: "English",
    prompt: "Is there anything I should know before going?",
  },
  {
    id: "scene_override",
    label: "🚨 7. Re-route / Override Check",
    lang: "हिन्दी",
    prompt: "अब मुझे कहाँ जाना चाहिए? क्या कोई आपातकालीन मार्ग परिवर्तन है?",
  },
];

function PilgrimChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "anubhav",
      text: "नमस्ते! मी अनुभव, कुंभमेळा २०२६ चा तुमचा वैयक्तिक मार्गदर्शक आहे. / Hello! I am ANUBHAV, your AI assistant for Kumbh Mela 2026. आप हिन्दी, मराठी किंवा English मध्ये विचारू शकता.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      language: "hi",
      tier: "AUTOMATED_GUIDANCE",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [activeLang, setActiveLang] = useState<"hi" | "mr" | "en">("hi");
  const [activeOverrideAlert, setActiveOverrideAlert] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Real-time listener for Tactical Overrides (Requirement 5)
  useEffect(() => {
    const checkActiveOverrides = async () => {
      try {
        const { getActiveOverrides } = await import("@/services");
        const ovrs = await getActiveOverrides();
        const active = ovrs.find(
          (o) => (o.entityId === "R18" || o.entityId === "R02") && o.active
        );
        if (active) {
          setActiveOverrideAlert(
            `🚨 Tactical Override on Route ${active.entityId}: Force-closed by SP Vikram Patil.`
          );
        } else {
          setActiveOverrideAlert(null);
        }
      } catch {}
    };

    checkActiveOverrides();
    const interval = setInterval(checkActiveOverrides, 2000);
    return () => clearInterval(interval);
  }, []);

  // Text-to-speech helper
  const speakText = (text: string, lang: "hi" | "mr" | "en") => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      if (lang === "mr") utterance.lang = "mr-IN";
      else if (lang === "hi") utterance.lang = "hi-IN";
      else utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech synthesis not supported or muted
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: "pilgrim-demo-session",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = (await response.json()) as AgentResponse;

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "anubhav",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        language: data.language,
        toolsCalled: data.toolsCalled,
        structuredCard: data.structuredCard,
        latencyMs: data.latencyMs,
        tier: data.tier,
        reasoning: data.reasoning,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setActiveLang(data.language);

      if (speechEnabled) {
        speakText(data.answer, data.language);
      }
    } catch (err) {
      toast.error("Could not reach ANUBHAV Agent server");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "anubhav",
          text: "कनेक्शन त्रुटी / Connection error. कृपया पुन्हा प्रयत्न करा.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    await fetch("/api/agent/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "pilgrim-demo-session" }),
    }).catch(() => {});

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "anubhav",
        text: "सत्र रीसेट केले! / Session reset. विचारण्यासाठी तयार आहे.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        language: "hi",
      },
    ]);
    toast.info("Conversation context reset");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-foreground flex justify-center p-0 sm:p-4">
      {/* Mobile Device Viewport Shell */}
      <div className="w-full max-w-md bg-slate-900 sm:rounded-3xl sm:border sm:border-slate-800 shadow-2xl flex flex-col h-[100dvh] sm:h-[92vh] overflow-hidden relative">
        {/* Device Top Bar */}
        <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-amber-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-100 font-sans tracking-tight">
                  ANUBHAV
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-300 font-mono"
                >
                  {activeLang === "hi" ? "हिन्दी" : activeLang === "mr" ? "मराठी" : "EN"}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">कुंभ मार्गदर्शक • Pilgrim AI</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              onClick={() => setSpeechEnabled((v) => !v)}
              title={speechEnabled ? "Mute Voice" : "Enable Voice"}
            >
              {speechEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              onClick={handleReset}
              title="Reset Conversation Context"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Real-time Tactical Alert Banner (Requirement 5) */}
        {activeOverrideAlert && (
          <div className="bg-rose-950/90 border-b border-rose-500/50 px-3 py-2 shrink-0 flex items-center justify-between gap-2 text-[11px] text-rose-200 animate-pulse z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate font-semibold">{activeOverrideAlert}</span>
            </div>
            <button
              onClick={() => handleSendMessage("अब मुझे कहाँ जाना चाहिए? क्या कोई नया सुरक्षित मार्ग है?")}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shrink-0 shadow"
            >
              Re-route Now
            </button>
          </div>
        )}

        {/* Demo Scene Quick Trigger Bar */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-3 py-2 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 z-10">
          <span className="text-[10px] font-bold text-amber-400 shrink-0 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> DEMO:
          </span>
          {DEMO_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => handleSendMessage(scene.prompt)}
              disabled={loading}
              className="rounded-full bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-slate-700/60 px-2.5 py-1 text-[10px] text-slate-300 font-medium whitespace-nowrap transition-all shrink-0 active:scale-95"
            >
              {scene.label}
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                  msg.sender === "user"
                    ? "bg-amber-600 text-white rounded-tr-xs"
                    : "bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-xs"
                }`}
              >
                {/* Meta header for ANUBHAV message */}
                {msg.sender === "anubhav" && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700/40 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> ANUBHAV
                      </span>

                      {/* 🟡🔵🔴 PRAVAH TIER BADGE (Requirement 1) */}
                      {msg.tier === "TACTICAL_OVERRIDE" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500/60 text-rose-300 font-bold text-[9px] animate-pulse">
                          🔴 TACTICAL OVERRIDE
                        </span>
                      )}
                      {msg.tier === "VERIFIED_ADVISORY" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/90 border border-blue-500/60 text-blue-300 font-bold text-[9px]">
                          🔵 VERIFIED ADVISORY
                        </span>
                      )}
                      {msg.tier === "AUTOMATED_GUIDANCE" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/60 text-amber-300 font-bold text-[9px]">
                          🟡 AUTOMATED GUIDANCE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      {msg.latencyMs && <span>{msg.latencyMs}ms</span>}
                      {msg.language && (
                        <span className="uppercase text-[9px] bg-slate-700 px-1 rounded">
                          {msg.language}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Response Text */}
                <div className="text-[13px] leading-relaxed font-sans whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* Decision Trace Reasoning (Requirement 2 & 4) */}
                {msg.reasoning && (
                  <div className="mt-2 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                    <span className="text-amber-400 font-semibold">⚡ Decision Reasoning: </span>
                    {msg.reasoning}
                  </div>
                )}

                {/* Tool calls trace */}
                {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/40 flex flex-wrap gap-1">
                    {msg.toolsCalled.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] bg-slate-900/60 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700/50"
                      >
                        ⚡ {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

              {/* Structured Card Renderers */}
              {msg.structuredCard && (
                <div className="w-full max-w-[92%] mt-2">
                  {renderStructuredCard(msg.structuredCard)}
                </div>
              )}
            </div>
          ))}

          {/* Typing Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/60 rounded-xl px-3 py-2 w-fit border border-slate-700/40">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Checking live operational signals…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input Bar */}
        <footer className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="विचार करा / Ask a question..."
                className="w-full bg-slate-800 border border-slate-700 rounded-full px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsListening((v) => !v);
                toast.info(
                  !isListening
                    ? "🎤 Listening... (Or click any scene quick-button above!)"
                    : "Mic off"
                );
              }}
              className={`h-9 w-9 rounded-full shrink-0 ${
                isListening
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={loading || !inputValue.trim()}
              className="h-9 w-9 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  STRUCTURED CARD RENDERERS                                                 */
/* ========================================================================== */

function renderStructuredCard(card: StructuredCard) {
  const d = card.data as any;
  switch (card.type) {
    /* 1. RECOMMENDED JOURNEY CARD (Scene 1 & 2) */
    case "JOURNEY_CARD": {
      return (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-800/80 p-4 shadow-lg text-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400 font-mono">
              {d.title}
            </span>
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
              {d.walkTime}
            </Badge>
          </div>

          <div className="space-y-2 border-l-2 border-amber-500/40 ml-2 pl-3 py-1 text-xs">
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-amber-400" />
                {d.parking?.name || "P09 Parking"}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                {d.parking?.availability || "72% availability"}
              </div>
            </div>

            <div className="text-slate-500 text-[10px]">↓</div>

            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <RouteIcon className="h-3.5 w-3.5 text-amber-400" />
                {d.route?.name || "R18 Route"}
              </div>
              <div className="text-[11px] text-amber-300">
                {d.route?.condition || "Moderate crowd"}
              </div>
            </div>

            <div className="text-slate-500 text-[10px]">↓</div>

            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                {d.destination || "Darshan / Snan"}
              </div>
            </div>
          </div>

          {d.badges && (
            <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1">
              {d.badges.map((b: string, i: number) => (
                <div key={i} className="text-[11px] text-emerald-300 flex items-center gap-1">
                  {b}
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={() => toast.success("Journey Navigation Started! 🚶")}
            className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5"
          >
            <span>{d.actionLabel || "START JOURNEY"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    /* 2. FACILITY CARD (Scene 3 - Marathi) */
    case "FACILITY_CARD": {
      return (
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-slate-800/80 p-4 shadow-lg text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {d.title}
            </span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300">
              {d.badge || "✓ अलीकडे पडताळले"}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-lg font-bold text-slate-100">{d.facilityId}</div>
            <div className="text-xs text-emerald-400 font-semibold">{d.status}</div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>{d.distance}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <Clock className="h-3.5 w-3.5" />
              <span>{d.waitTime}</span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => toast.success("नकाशा मार्ग दाखवला आहे 📍")}
            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
          >
            <span>{d.actionLabel || "मार्ग दाखवा"}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    /* 3. FOOD CARD (Scene 4 - Marathi Food) */
    case "FOOD_CARD": {
      return (
        <div className="rounded-2xl border border-orange-500/40 bg-gradient-to-b from-orange-500/10 to-slate-800/80 p-4 shadow-lg text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              {d.title}
            </span>
            <Badge className="bg-orange-500 text-slate-950 font-bold text-[10px]">
              संदर्भ किंमत: {d.referencePrice}
            </Badge>
          </div>

          <div className="text-base font-bold text-slate-100">{d.name}</div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 text-[10px] block">अंतर</span>
              <span className="font-semibold text-slate-200">{d.distance}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 text-[10px] block">प्रतीक्षा वेळ</span>
              <span className="font-semibold text-emerald-300">{d.waitTime}</span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => toast.success("अन्नछत्र मार्ग सुरू केला 🍽️")}
            className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs gap-1.5"
          >
            <span>{d.actionLabel || "मार्ग दाखवा"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    /* 4. DARSHAN PLAN CARD (Scene 5 - English) */
    case "DARSHAN_PLAN_CARD": {
      return (
        <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-500/10 to-slate-800/80 p-4 shadow-lg text-slate-100">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-3">
            {d.title}
          </div>

          <div className="space-y-2 text-xs">
            {d.steps.map((step: any, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-slate-200">{step.label}</div>
                  <div className="text-[11px] text-slate-400">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => toast.success("Darshan itinerary locked! 🙏")}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            {d.actionLabel || "CONFIRM DARSHAN PLAN"}
          </Button>
        </div>
      );
    }

    /* 5. ADVISORY & RESTRICTION COMPARISON CARD (Scene 6) */
    case "ADVISORY_COMPARISON_CARD": {
      return (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-slate-800/80 p-4 shadow-lg text-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-3">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{d.title}</span>
          </div>

          <div className="space-y-2">
            {d.routes.map((r: any, idx: number) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  r.status === "RESTRICTED"
                    ? "border-rose-500/40 bg-rose-950/30"
                    : r.status === "RECOMMENDED"
                      ? "border-emerald-500/40 bg-emerald-950/30"
                      : "border-amber-500/40 bg-amber-950/30"
                }`}
              >
                <span className="text-base shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{r.id}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        r.tier === "VERIFIED_ADVISORY"
                          ? "border-rose-400 text-rose-300"
                          : "border-emerald-400 text-emerald-300"
                      }`}
                    >
                      {r.tier.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* 6. KISKO FACILITY CARD (Scene 7) */
    case "KISKO_FACILITY_CARD": {
      return (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-950/40 p-5 shadow-2xl text-slate-100">
          <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
            KISKO TERMINAL GUIDANCE
          </div>
          <div className="text-2xl font-black text-white">{d.facilityId}</div>
          <div className="text-sm font-semibold text-emerald-400 mt-1">{d.status}</div>

          <div className="my-3 py-2 border-y border-emerald-500/30 flex justify-between items-baseline">
            <span className="text-base font-bold">{d.distance}</span>
            <span className="text-sm font-medium text-emerald-300">{d.waitTime}</span>
          </div>

          <Button
            size="lg"
            onClick={() => toast.success("Walking navigation initiated on terminal!")}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm"
          >
            {d.actionLabel || "START WALKING"}
          </Button>
        </div>
      );
    }

    default:
      return null;
  }
}
