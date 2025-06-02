'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '发送重置密码邮件失败');
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : '发送重置密码邮件失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">找回密码</h1>
          <p className="auth-subtitle">
            输入您的邮箱地址，我们将发送重置密码链接
          </p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            <p className="success-text">
                  重置密码链接已发送到您的邮箱，请查收
                </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="input-label">
                邮箱地址
              </label>
              <div className="input-container">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="请输入您的邮箱"
              />
              </div>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? '发送中...' : '发送重置链接'}
              </button>
            </div>

            <div className="auth-links">
              <Link href="/login" className="auth-link">
                返回登录
              </Link>
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Montserrat', sans-serif;
        }
        
        body {
          background-color: #121212;
          color: #fff;
        }
        
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: #121212;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(50, 50, 50, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(40, 40, 40, 0.2) 0%, transparent 50%);
        }
        
        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 32px;
          border-radius: 16px;
          background-color: #1a1a1a;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          border: 1px solid #2a2a2a;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .auth-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
          background: linear-gradient(90deg, #FB6107, #FF8134);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        
        .auth-subtitle {
          color: #b3b3b3;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .input-label {
          color: #e0e0e0;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .input-container {
          position: relative;
        }
        
        .input-field {
          width: 100%;
          padding: 12px 16px;
          background-color: #242424;
          color: #fff;
          border: 1px solid #333;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #FB6107;
          box-shadow: 0 0 0 2px rgba(251, 97, 7, 0.2);
        }
        
        .input-field::placeholder {
          color: #777;
        }
        
        .error-message {
          color: #ff5252;
          font-size: 14px;
          padding: 4px 0;
          text-align: center;
        }
        
        .form-actions {
          margin-top: 8px;
        }
        
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #FB6107;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(251, 97, 7, 0.25);
        }
        
        .submit-btn:hover {
          background: #FF8134;
          transform: translateY(-1px);
          box-shadow: 0 6px 10px rgba(251, 97, 7, 0.3);
        }
        
        .submit-btn:disabled {
          background: rgba(251, 97, 7, 0.5);
          cursor: not-allowed;
          box-shadow: none;
          opacity: 0.7;
        }
        
        .auth-links {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        
        .auth-link {
          color: #FB6107;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .auth-link:hover {
          color: #FF8134;
          text-decoration: underline;
        }
        
        .success-message {
          background-color: rgba(46, 125, 50, 0.1);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid rgba(46, 125, 50, 0.2);
        }
        
        .success-icon {
          width: 24px;
          height: 24px;
          color: #4caf50;
          flex-shrink: 0;
        }
        
        .success-text {
          color: #a5d6a7;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
} 