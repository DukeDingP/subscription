'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">订阅管理系统</span>
            </Link>
          </div>
          <div className="flex items-center">
            {session ? (
              <>
                <Link href="/account" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                  账户
                </Link>
                <Link href="/subscribe" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                  订阅
                </Link>
                <button
                  onClick={() => signOut()}
                  className="ml-4 text-gray-700 hover:text-gray-900 px-3 py-2"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                  登录
                </Link>
                <Link href="/register" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 