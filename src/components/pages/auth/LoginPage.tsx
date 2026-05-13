import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { toast } from 'sonner@2.0.3';

interface LoginPageProps {
  // Kept for compatibility with App.tsx, but no longer used —
  // SSO is the only entry point. The post-login navigation fires
  // from AuthProvider's onAuthStateChange handler after the OAuth
  // round-trip, not from this page.
  onLoginSuccess?: (role: string) => void;
  onForgotPassword?: () => void;
  onSignup?: () => void;
}

export function LoginPage(_: LoginPageProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Full-page redirect to Google. On return, AuthProvider's
      // onAuthStateChange listener finishes the login.
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
      toast.error(err?.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SuperLeap CRM</h1>
          <p className="text-gray-600">CARS24 Dealer Referral Platform</p>
        </div>

        {/* Login Card — SSO only */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-600 mb-6">Use your Cars24 Google account to continue.</p>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Continue with Google"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Redirecting to Google…
              </>
            ) : (
              <>
                {/* Google "G" logo */}
                <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-1">
            <p className="text-xs text-gray-500">
              Only <span className="font-medium text-gray-700">@cars24.com</span> Google accounts can sign in.
            </p>
            <p className="text-xs text-gray-500">
              Need access? Contact your admin to be provisioned.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secured with Google SSO via Supabase Auth
          </p>
          <p className="text-xs text-gray-500 mt-1">
            SuperLeap CRM © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
