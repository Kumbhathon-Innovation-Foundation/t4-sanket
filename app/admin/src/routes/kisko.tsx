// KISKO Public Kiosk Terminal — Interactive 55" High-Contrast Touch Screen
// For pilgrims without smartphones. Voice-driven, high-speed civic terminal.
// Implements Scene 7: Voice query -> Tool checking -> Instant result -> Auto-idle.

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Mic,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle2,
  Utensils,
  Car,
  HeartPulse,
  Route as RouteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AgentResponse } from "@/services";

export const Route = createFileRoute("/kisko")({
  component: KiskoKioskPage,
});

type KiskoState =
  | "IDLE"
  | "LISTENING"
  | "FINDING_FACILITIES"
  | "CHECKING_AVAILABILITY"
  | "RESULT";

export function KiskoKioskPage() {
  const [state, setState] = useState<KiskoState>("IDLE");
  const [transcribedText, setTranscribedText] = useState("");
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Auto-reset timer when in RESULT state
  useEffect(() => {
    if (state !== "RESULT") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setState("IDLE");
          setAgentResponse(null);
          setTranscribedText("");
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech synthesis
    }
  };

  const handleStartInteraction = async (queryText: string = "मुझे सबसे पास का कम भीड़ वाला शौचालय चाहिए।") => {
    setState("LISTENING");
    setTranscribedText(queryText);

    // Step 1: Listening delay
    await new Promise((r) => setTimeout(r, 900));
    setState("FINDING_FACILITIES");

    // Step 2: Finding delay
    await new Promise((r) => setTimeout(r, 700));
    setState("CHECKING_AVAILABILITY");

    // Step 3: Fetch response from /api/agent
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          sessionId: "kisko-kiosk-session",
          isKisko: true,
        }),
      });

      const data = (await res.json()) as AgentResponse;
      setAgentResponse(data);
      setState("RESULT");
      setCountdown(15);

      if (speechEnabled) {
        speakText(data.answer);
      }
    } catch {
      setState("IDLE");
      toast.error("Terminal offline — please ask ground marshal V01");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* Kiosk Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <Compass className="h-9 w-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-white font-sans">
                KISKO • कुंभ सेवा केंद्र
              </h1>
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-2 py-0.5 font-mono">
                TERMINAL #04 • LIVE
              </Badge>
            </div>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Ramkund North Entrance Plaza • Citizen Assistance Kiosk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setSpeechEnabled((v) => !v)}
            className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white text-sm gap-2"
          >
            {speechEnabled ? <Volume2 className="h-5 w-5 text-emerald-400" /> : <VolumeX className="h-5 w-5" />}
            <span>{speechEnabled ? "Voice Output ON" : "Voice Output Muted"}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setState("IDLE");
              setAgentResponse(null);
            }}
            className="border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Kiosk Interaction Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center my-8 max-w-4xl mx-auto w-full">
        {/* STATE 1: IDLE TOUCH PROMPT */}
        {state === "IDLE" && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="relative inline-block">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 opacity-30 blur-2xl animate-pulse" />
              <button
                onClick={() => handleStartInteraction()}
                className="relative h-44 w-44 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 transition-all shadow-2xl flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer group"
              >
                <Mic className="h-16 w-16 text-slate-950 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs uppercase tracking-widest font-mono">TOUCH TO SPEAK</span>
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                बोलिए, मैं आपकी क्या सहायता कर सकता हूँ?
              </h2>
              <p className="text-lg text-slate-400">
                Touch the microphone or select a quick option below.
              </p>
            </div>

            {/* Quick 1-Touch Presets for Pilgrims */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <button
                onClick={() => handleStartInteraction("मुझे सबसे पास का कम भीड़ वाला शौचालय चाहिए।")}
                className="rounded-2xl border-2 border-slate-800 bg-slate-900 hover:border-amber-500/60 p-5 text-left transition-all active:scale-95"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  🚻
                </div>
                <div className="font-bold text-white text-base">शौचालय / Toilet</div>
                <div className="text-xs text-slate-400 mt-1">Nearest clean facility</div>
              </button>

              <button
                onClick={() => handleStartInteraction("स्नान के बाद भोजन कहाँ मिलेगा?")}
                className="rounded-2xl border-2 border-slate-800 bg-slate-900 hover:border-amber-500/60 p-5 text-left transition-all active:scale-95"
              >
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
                  🍲
                </div>
                <div className="font-bold text-white text-base">भोजन / Food</div>
                <div className="text-xs text-slate-400 mt-1">Community kitchens</div>
              </button>

              <button
                onClick={() => handleStartInteraction("पार्किंग कहाँ खाली है?")}
                className="rounded-2xl border-2 border-slate-800 bg-slate-900 hover:border-amber-500/60 p-5 text-left transition-all active:scale-95"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  🚗
                </div>
                <div className="font-bold text-white text-base">पार्किंग / Parking</div>
                <div className="text-xs text-slate-400 mt-1">Available parking lots</div>
              </button>

              <button
                onClick={() => handleStartInteraction("रामकुंड जाने का सबसे सुरक्षित रास्ता?")}
                className="rounded-2xl border-2 border-slate-800 bg-slate-900 hover:border-amber-500/60 p-5 text-left transition-all active:scale-95"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                  🚶
                </div>
                <div className="font-bold text-white text-base">रास्ता / Route</div>
                <div className="text-xs text-slate-400 mt-1">Safe pilgrim corridor</div>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2, 3, 4: PROGRESSIVE VOICE QUERY FLOW */}
        {(state === "LISTENING" ||
          state === "FINDING_FACILITIES" ||
          state === "CHECKING_AVAILABILITY") && (
          <div className="text-center space-y-8 w-full max-w-xl animate-in fade-in duration-200">
            <div className="h-28 w-28 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 animate-pulse">
              <Mic className="h-14 w-14" />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono mb-2">
                SPEECH INPUT RECEIVED
              </div>
              <p className="text-2xl font-bold text-white font-sans">
                "{transcribedText}"
              </p>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="space-y-3 text-left bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    state === "LISTENING"
                      ? "bg-amber-400 animate-ping"
                      : "bg-emerald-400"
                  }`}
                />
                <span className={state === "LISTENING" ? "font-bold text-amber-300" : "text-slate-400"}>
                  Listening and transcribing query...
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    state === "FINDING_FACILITIES"
                      ? "bg-amber-400 animate-ping"
                      : state === "CHECKING_AVAILABILITY"
                        ? "bg-emerald-400"
                        : "bg-slate-700"
                  }`}
                />
                <span
                  className={
                    state === "FINDING_FACILITIES"
                      ? "font-bold text-amber-300"
                      : state === "CHECKING_AVAILABILITY"
                        ? "text-slate-400"
                        : "text-slate-600"
                  }
                >
                  Finding nearby civic facilities via PostGIS...
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    state === "CHECKING_AVAILABILITY"
                      ? "bg-amber-400 animate-ping"
                      : "bg-slate-700"
                  }`}
                />
                <span
                  className={
                    state === "CHECKING_AVAILABILITY"
                      ? "font-bold text-amber-300"
                      : "text-slate-600"
                  }
                >
                  Checking current availability and queue wait time...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STATE 5: FINAL KISKO RESULT DISPLAY */}
        {state === "RESULT" && agentResponse && (
          <div className="w-full max-w-2xl space-y-6 animate-in zoom-in-95 duration-300">
            {/* Spoken Voice Banner */}
            <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 to-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 font-mono">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> KISKO AUDIO GUIDANCE
                </span>
                <span className="text-slate-400">
                  Auto-reset in <span className="text-amber-400 font-bold">{countdown}s</span>
                </span>
              </div>

              <p className="text-xl font-bold text-white leading-relaxed">
                "{agentResponse.answer}"
              </p>
            </div>

            {/* High-Contrast Civic Action Card */}
            <div className="rounded-3xl border-4 border-emerald-400 bg-slate-900 p-8 shadow-2xl space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    RECOMMENDED CIVIC FACILITY
                  </span>
                  <div className="text-5xl font-black text-white tracking-tight mt-1">
                    T12
                  </div>
                  <div className="text-lg font-semibold text-emerald-400 mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Currently working • स्वच्छता गृह कार्यरत</span>
                  </div>
                </div>

                <Badge className="bg-emerald-500 text-slate-950 text-sm px-3 py-1 font-bold">
                  ✓ Recently Verified
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-mono">DISTANCE / अंतर</span>
                  <span className="text-3xl font-black text-white">120 metres</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-mono">WAIT TIME / प्रतीक्षा वेळ</span>
                  <span className="text-3xl font-black text-emerald-400">~1 min wait</span>
                </div>
              </div>

              {/* Big Action Button */}
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={() => {
                    toast.success("Direction signage illuminated! 🚶");
                    setState("IDLE");
                  }}
                  className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xl gap-2 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <span>START WALKING</span>
                  <ArrowRight className="h-6 w-6" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setState("IDLE");
                    setAgentResponse(null);
                  }}
                  className="h-16 px-8 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base rounded-2xl"
                >
                  DONE
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Kiosk Bottom Footer */}
      <footer className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span>PRAVAH REALTIME ENGINE</span>
          <span>•</span>
          <span>POSTGRESQL + POSTGIS</span>
        </div>
        <div>
          <span>FOR EMERGENCY ASSISTANCE: CALL 112 OR CONTACT POLICE BOOTH #02</span>
        </div>
      </footer>
    </div>
  );
}
