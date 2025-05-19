'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {success === 'true' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          订阅成功！
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">账户信息</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">个人信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <p className="mt-1 text-lg">{session.user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">姓名</label>
            <p className="mt-1 text-lg">{session.user.name || '未设置'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">订阅状态</h2>
        {subscription ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">状态</label>
              <p className="mt-1 text-lg">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {subscription.status === 'active' ? '活跃' : '已过期'}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">开始日期</label>
              <p className="mt-1 text-lg">{new Date(subscription.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">结束日期</label>
              <p className="mt-1 text-lg">{new Date(subscription.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">您还没有订阅</p>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              立即订阅
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 