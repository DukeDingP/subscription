'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      router.push('/login?registered=true');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('注册时发生错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="back-to-home">
        <Link href="/">
          <i className="fas fa-arrow-left"></i>
          <span>返回主页</span>
        </Link>
      </div>
      <div className="register-container">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>填写以下信息注册新账户</p>
        </div>
        
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">姓名</label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              className="input-field"
                placeholder="请输入姓名"
              />
          </div>

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
            <label htmlFor="password">密码</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="至少8个字符"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            <p className="password-hint">密码必须至少8个字符</p>
          </div>

          {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
            className="register-button"
            >
            {loading ? '注册中...' : '创建账户'}
            </button>
          
          <div className="login-prompt">
            已有账户? <Link href="/login" className="login-link">立即登录</Link>
          </div>
        </form>
      </div>
      
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #121212;
          padding: 20px;
        }
        
        .register-container {
          width: 100%;
          max-width: 420px;
          background-color: #1e1e1e;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          padding: 40px 30px;
        }
        
        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .register-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #ffffff;
          letter-spacing: -0.5px;
        }
        
        .register-header p {
          font-size: 16px;
          color: #9ca3af;
          margin: 0;
        }
        
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .input-group label {
          font-size: 14px;
          font-weight: 500;
          color: #e0e0e0;
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
        
        .password-field {
          position: relative;
        }
        
        .password-toggle {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        
        .password-toggle:hover {
          color: #e0e0e0;
        }
        
        .password-hint {
          font-size: 12px;
          color: #9ca3af;
          margin: 4px 0 0;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 14px;
          padding: 8px 12px;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
          text-align: center;
        }
        
        .register-button {
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
        
        .register-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
        }
        
        .register-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-prompt {
          text-align: center;
          font-size: 14px;
          color: #9ca3af;
        }
        
        .login-link {
          color: #FF9A3C;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .login-link:hover {
          color: #FFB673;
          text-decoration: underline;
        }
        
        @media (max-width: 480px) {
          .register-container {
            padding: 30px 20px;
          }
          
          .register-header h1 {
            font-size: 28px;
          }
        }
        
        .back-to-home {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
        }
        
        .back-to-home a {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          background-color: rgba(30, 30, 30, 0.8);
          padding: 8px 16px;
          border-radius: 20px;
          transition: all 0.2s ease;
        }
        
        .back-to-home a:hover {
          background-color: rgba(50, 50, 50, 0.9);
          transform: translateY(-2px);
        }
        
        .back-to-home i {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
} 