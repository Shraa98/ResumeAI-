import { useState, useRef, useEffect } from "react";
import AppShell from "../components/AppShell";
import { Bot, Mic, Square } from "lucide-react";

type Message = { role: "ai" | "user"; text: string };
type InterviewStage = "intro" | "role" | "goal" | "interview";

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

export default function MockInterview() {
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! Great to meet you. How are you feeling today?" },
  ]);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<InterviewStage>("intro");
  const [targetRole, setTargetRole] = useState("");
  const [sessionGoal, setSessionGoal] = useState("");
  const recognitionRef = useRef<{
    start: () => void;
    stop: () => void;
  } | null>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const networkRetryCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const getInterviewFollowup = (answer: string) => {
    const lower = answer.toLowerCase();
    const hasMetric = /\b\d+%|\$\d+|\b\d+\s*(users|clients|hours|days|weeks|months)\b/.test(lower);
    const words = answer.trim().split(/\s+/).filter(Boolean).length;

    if (words < 12) {
      return "Good start. Can you expand that using STAR: Situation, Task, Action, and Result?";
    }
    if (!hasMetric) {
      return "Good response. To strengthen it, add a measurable result (for example, % improvement, time saved, or revenue impact).";
    }
    if (lower.includes("team") || lower.includes("stakeholder") || lower.includes("collaborat")) {
      return "Strong answer. Next question: tell me about a conflict in your team and how you resolved it.";
    }
    return "Great answer. Clear structure and measurable impact. Next, explain one challenge you faced and how you resolved it.";
  };

  const getAiFollowup = (answer: string) => {
    if (stage === "intro") {
      setStage("role");
      return "Nice. What role are you preparing for right now?";
    }

    if (stage === "role") {
      setTargetRole(answer.trim());
      setStage("goal");
      return "Awesome. What is your goal for this session: confidence, STAR storytelling, or technical clarity?";
    }

    if (stage === "goal") {
      const role = targetRole.trim() || "your target role";
      const goal = answer.trim() || "better interview performance";
      setSessionGoal(goal);
      setStage("interview");
      return `Perfect. We'll do a focused mock interview for ${role} with emphasis on ${goal}. First question: Tell me about yourself in 60-90 seconds.`;
    }

    if (sessionGoal && targetRole) {
      return getInterviewFollowup(answer);
    }

    return getInterviewFollowup(answer);
  };

  const commitCapturedAnswer = () => {
    const combined = `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.replace(/\s+/g, " ").trim();
    if (!combined) {
      return;
    }

    setMessages((m) => [
      ...m,
      { role: "user", text: combined },
      { role: "ai", text: getAiFollowup(combined) },
    ]);
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
  };

  const startRecording = () => {
    setError(null);

    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");

    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0]?.transcript ?? ""} `;
        } else {
          interimText += `${result[0]?.transcript ?? ""} `;
        }
      }
      interimTranscriptRef.current = interimText.trim();
      setTranscript(interimText.trim());
    };

    recognition.onerror = (event: any) => {
      const errorCode = event.error || "unknown";
      if (errorCode === "network") {
        if (networkRetryCountRef.current < 1) {
          networkRetryCountRef.current += 1;
          setError("Mic network hiccup detected. Retrying once...");
          try {
            recognition.stop();
          } catch {
            // ignore stop errors and continue retry path
          }
          setTimeout(() => {
            if (!isRecordingRef.current) return;
            try {
              recognition.start();
            } catch {
              setRecording(false);
              isRecordingRef.current = false;
              setError("Mic error: network. Please check internet and retry.");
            }
          }, 300);
          return;
        }
        setError("Mic error: network. Please check internet and retry.");
      } else {
        setError(`Mic error: ${errorCode}`);
      }
      setRecording(false);
      isRecordingRef.current = false;
      commitCapturedAnswer();
    };

    recognition.onend = () => {
      setRecording(false);
      isRecordingRef.current = false;
      commitCapturedAnswer();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    isRecordingRef.current = true;
    networkRetryCountRef.current = 0;
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
    isRecordingRef.current = false;
  };

  const handleRecord = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
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
                      <Bot size={16} className="text-primary" />
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
              {recording ? <Square size={24} className="text-background" /> : <Mic size={24} className="text-background" />}
            </button>
            <span className="text-body-sm text-text-secondary">
              {recording ? "Recording... tap to stop" : "Tap to answer"}
            </span>
            {transcript && (
              <p className="text-body-sm text-text-primary italic max-w-[80%] text-center">
                {transcript}
              </p>
            )}
            {error && (
              <p className="text-body-sm text-error max-w-[85%] text-center">{error}</p>
            )}
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
