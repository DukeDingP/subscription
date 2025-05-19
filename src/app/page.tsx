import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        欢迎使用订阅系统
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        这是一个简单的订阅管理系统，您可以在这里管理您的订阅信息。
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        {session ? (
          <Link
            href="/account"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            查看账户信息
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              注册 <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
} 