'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Subscription {
  status: string;
  startDate: string;
  endDate: string;
  productId: string;
}

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSubscription();
    }
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      const data = await response.json();
      if (response.ok) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  const success = searchParams.get('success');

  return (
    <div className="account-container">
      <div className="account-content">
        <div className="account-header">
          <Link href="/" className="back-link">
            <i className="fas fa-arrow-left"></i> 返回主页
          </Link>
          <h1 className="page-title">账户信息</h1>
        </div>

        {success === 'true' && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <span>订阅成功！感谢您的支持</span>
          </div>
        )}

        <div className="account-card">
          <h2 className="card-title">个人信息</h2>
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">邮箱</label>
              <p className="info-value">{session.user.email}</p>
            </div>
            <div className="info-item">
              <label className="info-label">姓名</label>
              <p className="info-value">{session.user.name || '未设置'}</p>
            </div>
          </div>
        </div>

        <div className="account-card">
          <h2 className="card-title">订阅状态</h2>
          {subscription ? (
            <div className="info-grid">
              <div className="info-item">
                <label className="info-label">状态</label>
                <p className="info-value">
                  <span className={`status-badge ${
                    subscription.status === 'active' ? 'status-active' : 'status-inactive'
                  }`}>
                    {subscription.status === 'active' ? '活跃' : '已过期'}
                  </span>
                </p>
              </div>
              <div className="info-item">
                <label className="info-label">开始日期</label>
                <p className="info-value">{new Date(subscription.startDate).toLocaleDateString()}</p>
              </div>
              <div className="info-item">
                <label className="info-label">结束日期</label>
                <p className="info-value">{new Date(subscription.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-text">您还没有订阅</p>
              <button
                onClick={() => router.push('/subscribe')}
                className="action-button"
              >
                立即订阅
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .account-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background-color: rgba(0, 0, 0, 0.8);
        }
        
        .account-content {
          width: 100%;
          max-width: 600px;
          background-color: #1a1a1a;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
          border: 1px solid #2a2a2a;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .account-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }
        
        /* 爱马仕橙返回链接 */
        .back-link {
          color: #e8b886; /* 爱马仕橙色调（Hermès经典色） */
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: #ff9e4a; /* 悬停时更明亮的橙色 */
        }
        
        .page-title {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .success-message {
          background-color: rgba(46, 125, 50, 0.1);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          border: 1px solid rgba(46, 125, 50, 0.2);
          color: #81c784;
        }
        
        .success-message i {
          color: #4caf50;
          font-size: 16px;
        }
        
        .account-card {
          background-color: #242424;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #333;
        }
        
        .card-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 14px;
          color: #fff;
        }
        
        .info-grid {
          display: grid;
          gap: 14px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 13px;
          color: #cccccc;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 15px;
          color: #ffffff;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .status-active {
          background-color: rgba(46, 125, 50, 0.15);
          color: #4caf50;
        }
        
        .status-inactive {
          background-color: rgba(211, 47, 47, 0.15);
          color: #ef5350;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
        }
        
        .empty-text {
          color: #ffffff;
          margin-bottom: 14px;
        }
        
        .action-button {
          background-color: #ff9e4a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(251, 97, 7, 0.25);
        }
        
        .action-button:hover {
          background-color: #FF8134;
          transform: translateY(-1px);
          box-shadow: 0 6px 10px rgba(251, 97, 7, 0.3);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: #fff;
          gap: 16px;
        }
        
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 3px solid #FB6107;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* 全局样式 */}
      <style jsx global>{`
        body {
          background-color: #121212;
          margin: 0;
          padding: 0;
          font-family: 'Montserrat', sans-serif;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
} 