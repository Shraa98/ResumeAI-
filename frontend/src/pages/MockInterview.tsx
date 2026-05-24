import { useState, useRef, useEffect } from "react";
import AppShell from "../components/AppShell";

type Message = { role: "ai" | "user"; text: string };

export default function MockInterview() {
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm your AI interviewer. Let's start with: Tell me about a time you led a cross-functional team under pressure." },
  ]);
  const [transcript, setTranscript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRecord = () => {
    setRecording((r) => !r);
    if (recording) {
      // TODO: stop MediaRecorder, POST audio to /api/interview/transcribe (Whisper)
      // then POST transcript to /api/interview/evaluate (GPT-4o-mini)
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          { role: "user", text: "I led a team of 8 engineers to deliver a critical platform migration in 6 weeks..." },
          { role: "ai", text: "Great STAR structure! Your Situation and Task were clear. For Result, try to add a specific metric — e.g., '20% faster load time' or '$500K saved'. Want to try again?" },
        ]);
        setTranscript("");
      }, 1500);
    }
  };

  return (
    <AppShell title="Mock Interview">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* Chat Panel */}
        <div className="lg:col-span-2 bg-surface border border-border-muted flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border-muted">
            <h3 className="text-label-md text-text-primary uppercase tracking-widest">Live Session</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg text-body-md ${
                    msg.role === "ai"
                      ? "bg-surface-container-high text-text-primary border border-border-muted"
                      : "bg-primary text-background"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">smart_toy</span>
                      <span className="text-label-md text-primary uppercase tracking-wider">AI Interviewer</span>
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Voice Controls */}
          <div className="p-5 border-t border-border-muted flex flex-col items-center gap-4">
            <button
              onClick={handleRecord}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                recording
                  ? "bg-error animate-pulse scale-110"
                  : "bg-primary hover:bg-primary-fixed-dim"
              }`}
            >
              <span className="material-symbols-outlined text-background text-2xl">
                {recording ? "stop" : "mic"}
              </span>
            </button>
            <span className="text-body-sm text-text-secondary">
              {recording ? "Recording... tap to stop" : "Tap to answer"}
            </span>
          </div>
        </div>

        {/* STAR Evaluation Panel */}
        <div className="bg-surface border border-border-muted flex flex-col">
          <div className="px-5 py-4 border-b border-border-muted">
            <h3 className="text-label-md text-text-primary uppercase tracking-widest">STAR Evaluation</h3>
          </div>
          <div className="p-5 space-y-5 flex-1">
            {[
              { label: "Situation", score: 90, color: "bg-primary" },
              { label: "Task", score: 85, color: "bg-primary" },
              { label: "Action", score: 70, color: "bg-secondary" },
              { label: "Result", score: 55, color: "bg-error" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-text-primary">{item.label}</span>
                  <span className="text-text-secondary">{item.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} transition-all duration-700`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-border-muted">
              <div className="text-label-md text-text-secondary uppercase tracking-wider mb-2">Feedback</div>
              <p className="text-body-sm text-text-secondary">
                Strong situation framing. Add a measurable result to boost your score. Avoid filler words like "basically" and "um".
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
