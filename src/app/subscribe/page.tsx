'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type PlanType = 'free' | 'pro' | 'business';
type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  id: PlanType;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: '免费版',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      '基础功能访问',
      '标准客户支持',
      '基础数据分析',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: {
      monthly: 10,
      yearly: 96,
    },
    features: [
      '无限访问所有功能',
      '优先客户支持',
      '高级数据分析',
      '自定义集成选项',
    ],
  },
  {
    id: 'business',
    name: '商业版',
    price: {
      monthly: 15,
      yearly: 144,
    },
    features: [
      '专业版所有功能',
      '24/7 专属支持',
      '高级安全功能',
      '团队管理功能',
      'API 访问权限',
    ],
  },
];

export default function SubscribePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      checkSubscription();
    }
  }, [session]);

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(!!data);
      }
    } catch (error) {
      console.error('检查订阅状态失败:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建支付订单失败');
      }

      window.location.href = data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建支付订单失败');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingSubscription) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <span>加载中...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="message-container">
        <h1 className="message-title">请先登录</h1>
        <p className="message-text">您需要登录才能订阅我们的服务</p>
        <Link href="/login" className="action-button">
          去登录
        </Link>
      </div>
    );
  }

  if (hasSubscription) {
    return (
      <div className="message-container">
        <div className="message-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h1 className="message-title">您已订阅</h1>
        <p className="message-text">您已经拥有有效的订阅，无需重复订阅</p>
        <Link href="/account" className="action-button">
          查看订阅详情
        </Link>
      </div>
    );
  }

  return (
    <div className="subscribe-container">
      <div className="subscribe-header">
        <Link href="/" className="back-link">
          <i className="fas fa-arrow-left"></i> 返回主页
        </Link>
        <h1 className="page-title">选择订阅计划</h1>
        <p className="page-subtitle">选择适合您的计划，随时可以升级或降级</p>
      </div>
      
      {/* 计费周期切换 */}
      <div className="billing-toggle">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`toggle-button ${billingCycle === 'monthly' ? 'active' : ''}`}
        >
          月付
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`toggle-button ${billingCycle === 'yearly' ? 'active' : ''}`}
        >
          年付
          <span className="discount-badge">省 20%</span>
        </button>
      </div>

      {/* 订阅计划卡片 */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <h2 className="plan-name">{plan.name}</h2>
            <div className="plan-price">
              {plan.price[billingCycle] > 0 ? (
                <>
                  <span className="currency">¥</span>
                  <span className="amount">{plan.price[billingCycle]}</span>
                  <span className="period">/{billingCycle === 'monthly' ? '月' : '年'}</span>
                </>
              ) : (
                <span className="free">免费</span>
              )}
            </div>
            <ul className="features-list">
              {plan.features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <i className="fas fa-check"></i>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`select-button ${selectedPlan === plan.id ? 'selected' : ''}`}
            >
              {selectedPlan === plan.id ? '已选择' : '选择'}
            </button>
          </div>
        ))}
      </div>

      {/* 订阅按钮 */}
      <div className="subscribe-footer">
        <button
          onClick={handleSubscribe}
          disabled={loading || selectedPlan === 'free'}
          className="subscribe-button"
        >
          {loading ? '处理中...' : selectedPlan === 'free' ? '当前计划' : '立即订阅'}
        </button>
        
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .subscribe-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #e0e0e0;
          min-height: 100vh;
        }
        
        .subscribe-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #b3b3b3;
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }
        
        .back-link:hover {
          color: #ff9e4a;
        }
        
        .page-title {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 12px;
          background: linear-gradient(90deg, #ff9e4a, #FF8134);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        
        .page-subtitle {
          color: #b3b3b3;
          font-size: 16px;
        }
        
        .billing-toggle {
          display: flex;
          justify-content: center;
          background-color: #1a1a1a;
          border-radius: 40px;
          padding: 4px;
          max-width: 300px;
          margin: 0 auto 40px;
          border: 1px solid #2a2a2a;
        }
        
        .toggle-button {
          padding: 10px 24px;
          background: transparent;
          border: none;
          color: #b3b3b3;
          border-radius: 40px;
          font-size: 15px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .toggle-button.active {
          background-color: #242424;
          color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .discount-badge {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ff9e4a;
          color: #fff;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
        }
        
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        
        .plan-card {
          background-color: #1a1a1a;
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s ease;
          border: 1px solid #2a2a2a;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        
        .plan-card.selected {
          border-color: #ff9e4a;
          box-shadow: 0 8px 20px rgba(251, 97, 7, 0.15);
          transform: translateY(-4px);
        }
        
        .plan-card:hover:not(.selected) {
          border-color: #333;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .plan-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #fff;
        }
        
        .plan-price {
          margin-bottom: 24px;
          display: flex;
          align-items: baseline;
        }
        
        .currency {
          font-size: 20px;
          color: #fff;
          margin-right: 4px;
        }
        
        .amount {
          font-size: 42px;
          font-weight: 700;
          color: #fff;
        }
        
        .period {
          font-size: 16px;
          color: #999;
          margin-left: 4px;
        }
        
        .free {
          font-size: 30px;
          font-weight: 700;
          color: #fff;
        }
        
        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
          flex-grow: 1;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          color: #ccc;
          font-size: 15px;
        }
        
        .feature-item i {
          color: #ff9e4a;
          font-size: 14px;
          margin-right: 8px;
        }
        
        .select-button {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: transparent;
          color: #ccc;
          border: 1px solid #333;
        }
        
        .select-button.selected {
          background: #ff9e4a;
          color: #fff;
          border-color: #ff9e4a;
        }
        
        .select-button:hover:not(.selected) {
          border-color: #ff9e4a;
          color: #ff9e4a;
        }
        
        .subscribe-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
        }
        
        .subscribe-button {
          background: linear-gradient(90deg, #ff9e4a, #FF8134);
          color: #fff;
          border: none;
          border-radius: 40px;
          padding: 16px 40px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 200px;
          box-shadow: 0 4px 10px rgba(251, 97, 7, 0.3);
        }
        
        .subscribe-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(251, 97, 7, 0.4);
        }
        
        .subscribe-button:disabled {
          background: linear-gradient(90deg, rgba(251, 97, 7, 0.4), rgba(255, 129, 52, 0.4));
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .error-message {
          margin-top: 20px;
          background-color: rgba(198, 40, 40, 0.1);
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #ef5350;
          font-size: 14px;
          border: 1px solid rgba(198, 40, 40, 0.2);
          max-width: 400px;
        }
        
        .error-message i {
          font-size: 16px;
        }
        
        .loading-container, .message-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: #e0e0e0;
          padding: 20px;
        }
        
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 3px solid #ff9e4a;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .message-icon {
          font-size: 48px;
          color: #ff9e4a;
          margin-bottom: 20px;
        }
        
        .message-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(90deg, #ff9e4a, #FF8134);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
          text-align: center;
        }
        
        .message-text {
          color: #b3b3b3;
          font-size: 16px;
          margin-bottom: 24px;
          text-align: center;
          max-width: 400px;
        }
        
        .action-button {
          background-color: #ff9e4a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
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
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr;
          }
          
          .plan-card {
            padding: 24px;
          }
          
          .page-title {
            font-size: 28px;
          }
        }
      `}</style>
      
      {/* 全局样式 */}
      <style jsx global>{`
        body {
          background-color: #121212;
          margin: 0;
          padding: 0;
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>
    </div>
  );
} 