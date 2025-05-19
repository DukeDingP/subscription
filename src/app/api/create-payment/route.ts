import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const CREEM_API_BASE_URL = process.env.CREEM_API_BASE_URL;
const CREEM_PRODUCT_ID = process.env.CREEM_PRODUCT_ID ;
const CREEM_API_KEY = process.env.CREEM_API_KEY;

// 获取回调地址
function getCallbackUrl() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/payment/success`;
}

async function createCheckoutSession(userEmail: string) {
  try {
    const callbackUrl = getCallbackUrl();
    console.log('创建结账会话:', {
      url: `${CREEM_API_BASE_URL}/v1/checkouts`,
      callbackUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY,
      },
      body: {
        product_id: CREEM_PRODUCT_ID,
        success_url: callbackUrl,
        customer: {
          email: userEmail,
        },
      },
    });

    const response = await fetch(`${CREEM_API_BASE_URL}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        product_id: CREEM_PRODUCT_ID,
        success_url: callbackUrl,
        customer: {
          email: userEmail,
        },
      }),
    });

    const data = await response.json();
    console.log('API 响应:', { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.message || `API 错误: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('创建结账会话错误:', error);
    throw error;
  }
}

export async function POST(req: Request) {
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
    });

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }

    const data = await createCheckoutSession(user.email);

    // 保存 customerId
    console.log("data", data);
    console.log("user.id", user.id);
    if (data.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { checkoutId: data.id },
      });
    }

    return NextResponse.json({ url: data.checkout_url });
  } catch (error) {
    console.error('创建支付订单错误:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建支付订单失败' },
      { status: 500 }
    );
  }
} 