'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SubscribePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建支付订单失败');
      }

      // 跳转到 Creem 支付页面
      window.location.href = data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建支付订单失败');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">选择订阅计划</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">专业版订阅</h2>
        <p className="text-gray-600 mb-4">
          解锁所有高级功能，包括：
        </p>
        <ul className="list-disc list-inside mb-6 text-gray-600">
          <li>无限访问所有功能</li>
          <li>优先客户支持</li>
          <li>高级数据分析</li>
          <li>自定义集成选项</li>
        </ul>
        <div className="text-3xl font-bold mb-6">¥199/月</div>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full bg-blue-500 text-white py-3 rounded-lg font-semibold ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {loading ? '处理中...' : '立即订阅'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
    </div>
  );
} 