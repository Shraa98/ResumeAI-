import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isSignUp = location.pathname === "/signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;
        
        // If Supabase auto-confirms or if user is logged in immediately:
        if (data.session) {
          navigate("/dashboard");
        } else {
          setSignUpSuccess(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-background font-bold text-xl">description</span>
          </div>
          <div>
            <h1 className="font-display text-headline-sm font-semibold text-primary tracking-tight">ResumeAI</h1>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-70">AI Career Suite</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border-muted p-8 space-y-6">
          {signUpSuccess ? (
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-primary">mark_email_read</span>
              <h2 className="font-display text-headline-sm text-text-primary font-semibold">Verify your email</h2>
              <p className="text-body-md text-text-secondary">
                We sent a confirmation link to <strong className="text-text-primary">{email}</strong>. Please check your email to complete registration.
              </p>
              <button
                onClick={() => {
                  setSignUpSuccess(false);
                  navigate("/login");
                }}
                className="text-primary text-body-sm font-bold hover:underline mt-4 block mx-auto"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-display text-headline-sm text-text-primary font-semibold">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </h2>
                <p className="text-body-md text-text-secondary mt-1">
                  {isSignUp ? "Sign up to start tailoring your resumes" : "Sign in to continue your career journey"}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-body-sm rounded flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-label-md text-text-secondary uppercase tracking-wider block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-muted px-4 py-3 text-body-md text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-md text-text-secondary uppercase tracking-wider block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-muted px-4 py-3 text-body-md text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-primary text-background font-bold py-3 text-body-md uppercase tracking-wider hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {authLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </button>
              </form>

              <div className="text-center">
                <span className="text-body-sm text-text-secondary">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                </span>
                <button
                  onClick={() => {
                    setAuthError(null);
                    navigate(isSignUp ? "/login" : "/signup");
                  }}
                  className="text-primary text-body-sm font-bold hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
