import { useState, useRef } from "react";
import AppShell from "../components/AppShell";

interface AnalysisResult {
  ats: number;
  keywords: string[];
  missing: string[];
  section_scores?: Record<string, number>;
  feedback?: string[];
  action_verbs_count?: number;
  metrics_count?: number;
  word_count?: number;
}

export default function ResumeUpload() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    try {
      const response = await fetch("http://localhost:8000/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to analyze resume.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Could not connect to the backend analysis service.");
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-primary" : score >= 60 ? "text-secondary" : "text-error";

  const scoreBarColor = (score: number) =>
    score >= 80 ? "bg-primary" : score >= 60 ? "bg-secondary" : "bg-error";

  return (
    <AppShell title="Resume Upload & ATS Analysis">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            dragging ? "border-primary bg-primary/5" : "border-border-muted bg-surface hover:border-primary/50"
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            if (selected) {
              setFile(selected);
              setError(null);
            }
          }} />
          <span className="material-symbols-outlined text-5xl text-primary/60 mb-4">upload_file</span>
          <p className="text-body-lg text-text-primary font-medium">Drop your resume PDF here</p>
          <p className="text-body-sm text-text-secondary mt-1">or click to browse</p>
          {file && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-border-muted rounded">
              <span className="material-symbols-outlined text-primary text-[18px]">article</span>
              <span className="text-body-sm text-text-primary">{file.name}</span>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 text-error text-body-sm rounded flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Job Description */}
        <div className="bg-surface border border-border-muted p-6 space-y-4">
          <h3 className="text-label-md text-text-primary uppercase tracking-widest">Target Job Description</h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full bg-surface-container-low border border-border-muted px-4 py-3 text-body-md text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none h-32"
            placeholder="Paste the job description here to detect skill gaps..."
          />
          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="px-8 py-3 bg-primary text-background font-bold text-body-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                Analyzing...
              </span>
            ) : "Analyze Resume"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Row 1: ATS Score + Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-surface border border-border-muted p-6 flex flex-col items-center justify-center">
                <span className="text-label-md text-text-secondary uppercase tracking-wider mb-2">ATS Score</span>
                <span className={`font-display text-headline-lg font-bold ${scoreColor(result.ats)}`}>{result.ats}</span>
                <span className="text-body-sm text-text-secondary">/100</span>
                {result.word_count && (
                  <span className="text-[11px] text-text-secondary mt-3">{result.word_count} words parsed</span>
                )}
              </div>
              <div className="bg-surface border border-border-muted p-6 space-y-3">
                <h4 className="text-label-md text-text-primary uppercase tracking-widest">Found Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((kw) => (
                    <span key={kw} className="px-2 py-1 bg-primary/10 text-primary text-[12px] rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-surface border border-border-muted p-6 space-y-3">
                <h4 className="text-label-md text-text-primary uppercase tracking-widest">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {result.missing.map((kw) => (
                    <span key={kw} className="px-2 py-1 bg-error/10 text-error text-[12px] rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Section Scores + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Section Breakdown */}
              {result.section_scores && (
                <div className="lg:col-span-6 bg-surface border border-border-muted flex flex-col">
                  <div className="px-5 py-4 border-b border-border-muted">
                    <h3 className="text-label-md text-text-primary uppercase tracking-widest">Section Breakdown</h3>
                  </div>
                  <div className="p-6 space-y-5 flex-1">
                    {Object.entries(result.section_scores).map(([section, score]) => (
                      <div key={section} className="space-y-2">
                        <div className="flex justify-between text-body-sm">
                          <span className="text-text-primary capitalize">{section.replace(/_/g, " ")}</span>
                          <span className={scoreColor(score)}>{score}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full ${scoreBarColor(score)} transition-all duration-700`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-surface border border-border-muted p-5 flex items-center justify-between">
                  <div>
                    <span className="text-label-md text-text-secondary uppercase tracking-wider">Action Verbs</span>
                    <div className={`font-display text-headline-md font-bold mt-1 ${scoreColor(Math.min(100, (result.action_verbs_count || 0) * 10))}`}>
                      {result.action_verbs_count || 0}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary/40 text-4xl">edit_note</span>
                </div>
                <div className="bg-surface border border-border-muted p-5 flex items-center justify-between">
                  <div>
                    <span className="text-label-md text-text-secondary uppercase tracking-wider">Metrics Used</span>
                    <div className={`font-display text-headline-md font-bold mt-1 ${scoreColor(Math.min(100, (result.metrics_count || 0) * 15))}`}>
                      {result.metrics_count || 0}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary/40 text-4xl">monitoring</span>
                </div>
              </div>
            </div>

            {/* Row 3: AI Feedback */}
            {result.feedback && result.feedback.length > 0 && (
              <div className="bg-surface border border-border-muted flex flex-col">
                <div className="px-5 py-4 border-b border-border-muted flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                  <h3 className="text-label-md text-text-primary uppercase tracking-widest">AI Recommendations</h3>
                </div>
                <div className="p-6 space-y-3">
                  {result.feedback.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-low border border-border-muted rounded">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">lightbulb</span>
                      <span className="text-body-sm text-text-primary">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}



