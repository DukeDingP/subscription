'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  const router = useRouter();
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
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          去登录
        </button>
      </div>
    );
  }

  if (hasSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">您已订阅</h1>
        <p className="text-gray-600 mb-4">您已经拥有有效的订阅，无需重复订阅</p>
        <button
          onClick={() => router.push('/account')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          查看订阅详情
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">选择订阅计划</h1>
      
      {/* 计费周期切换 */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-sm'
                : 'text-gray-600'
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md ${
              billingCycle === 'yearly'
                ? 'bg-white shadow-sm'
                : 'text-gray-600'
            }`}
          >
            年付
            <span className="ml-1 text-sm text-green-600">省 20%</span>
          </button>
        </div>
      </div>

      {/* 订阅计划卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-lg p-6 ${
              selectedPlan === plan.id
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
          >
            <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
            <div className="text-3xl font-bold mb-6">
              ¥{plan.price[billingCycle]}
              <span className="text-base font-normal text-gray-500">
                /{billingCycle === 'monthly' ? '月' : '年'}
              </span>
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full py-3 rounded-lg font-semibold ${
                selectedPlan === plan.id
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selectedPlan === plan.id ? '已选择' : '选择'}
            </button>
          </div>
        ))}
      </div>

      {/* 订阅按钮 */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSubscribe}
          disabled={loading || selectedPlan === 'free'}
          className={`bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold ${
            loading || selectedPlan === 'free'
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-blue-600'
          }`}
        >
          {loading ? '处理中...' : selectedPlan === 'free' ? '当前计划' : '立即订阅'}
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
    </div>
  );
} 