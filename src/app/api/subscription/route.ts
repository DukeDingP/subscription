import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: '未授权' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }

    if (!user.subscription) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      productId: user.subscription.productId,
    });
  } catch (error) {
    console.error('获取订阅信息错误:', error);
    return NextResponse.json(
      { message: '获取订阅信息失败' },
      { status: 500 }
    );
  }
} 