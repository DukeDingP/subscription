'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  
  // 检查用户是否已登录，如果已登录则重定向到首页
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    } else {
      setPageLoaded(true);
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('登录时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setError('谷歌登录时发生错误');
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setLoading(true);
      await signIn('github', { callbackUrl: '/' });
    } catch {
      setError('GitHub登录时发生错误');
      setLoading(false);
    }
  };

  // 如果页面正在加载或检查会话状态，显示加载状态
  if (!pageLoaded) {
    return (
      <div className="login-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>欢迎回来</h1>
          <p>登录您的账户以继续</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">邮箱地址</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
          </div>
          
          <div className="input-group">
            <div className="password-header">
              <label htmlFor="password">密码</label>
              <Link href="/forgot-password" className="forgot-link">
                忘记密码?
              </Link>
            </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
          </div>

          {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? '登录中...' : '登录'}
            </button>

          <div className="divider">
            <span>或使用以下方式继续</span>
          </div>

          <div className="social-buttons">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="social-button google"
            >
              <svg viewBox="0 0 24 24" className="social-icon">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={loading}
              className="social-button github"
            >
              <svg viewBox="0 0 24 24" className="social-icon">
                <path
                  fill="currentColor"
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="signup-prompt">
            还没有账户? <Link href="/register" className="signup-link">立即注册</Link>
          </div>
        </form>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #121212;
          padding: 20px;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 154, 60, 0.1);
          border-radius: 50%;
          border-top: 4px solid #FF9A3C;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .login-container {
          width: 100%;
          max-width: 420px;
          background-color: #1e1e1e;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          padding: 40px 30px;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .login-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #ffffff;
          letter-spacing: -0.5px;
        }
        
        .login-header p {
          font-size: 16px;
          color: #9ca3af;
          margin: 0;
        }
        
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .password-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .input-group label {
          font-size: 14px;
          font-weight: 500;
          color: #e0e0e0;
        }
        
        .forgot-link {
          font-size: 14px;
          color: #FF9A3C;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .forgot-link:hover {
          color: #FFB673;
          text-decoration: underline;
        }
        
        .input-field {
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #3f3f46;
          background-color: #27272a;
          color: #ffffff;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .input-field::placeholder {
          color: #71717a;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #FF9A3C;
          box-shadow: 0 0 0 2px rgba(255, 154, 60, 0.2);
        }
        
        .error-message {
          color: #ef4444;
          font-size: 14px;
          padding: 8px 12px;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
          text-align: center;
        }
        
        .login-button {
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%);
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .login-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
        }
        
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 8px 0;
          color: #9ca3af;
          font-size: 14px;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #3f3f46;
        }
        
        .divider::before {
          margin-right: 16px;
        }
        
        .divider::after {
          margin-left: 16px;
        }
        
        .social-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .social-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #3f3f46;
          background-color: #27272a;
          color: #e0e0e0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .social-button:hover {
          background-color: #323236;
        }
        
        .social-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .social-icon {
          width: 18px;
          height: 18px;
        }
        
        .google {
          color: #ffffff;
        }
        
        .github {
          color: #ffffff;
        }
        
        .signup-prompt {
          text-align: center;
          font-size: 14px;
          color: #9ca3af;
        }
        
        .signup-link {
          color: #FF9A3C;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .signup-link:hover {
          color: #FFB673;
          text-decoration: underline;
        }
        
        @media (max-width: 480px) {
          .login-container {
            padding: 30px 20px;
          }
          
          .login-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
} 