import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const CREEM_API_KEY = process.env.CREEM_API_KEY

interface RedirectParams {
  request_id?: string | null;
  checkout_id?: string | null;
  order_id?: string | null;
  customer_id?: string | null;
  subscription_id?: string | null;
  product_id?: string | null;
}
// 验证签名
// interface RedirectParams {
//   request_id?: string | null;
//   checkout_id?: string | null;
//   order_id?: string | null;
//   customer_id?: string | null;
//   subscription_id?: string | null;
//   product_id?: string | null;
// }

// function generateSignature(params: RedirectParams, apiKey: string): string {
//   const data = Object.entries(params)
//     .map(([key, value]) => `${key}=${value}`)
//     .concat(`salt=${apiKey}`)
//     .join('|');
//   return crypto.createHash('sha256').update(data).digest('hex');
// }

export async function GET(request: Request) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    const { searchParams } = new URL(request.url);
    console.log(searchParams);
    const signature = searchParams.get('signature');
    
    if (!signature) {
      return NextResponse.redirect(`${baseUrl}/subscribe?error=invalid_signature`);
    }

    // 验证签名
    // if (generateSignature(searchParams,CREEM_API_KEY)!=signature){
    //   return NextResponse.redirect(`${baseUrl}/subscribe?error=invalid_signature`);
    // }


    const checkoutId = searchParams.get('checkout_id');
    const orderId = searchParams.get('order_id');
    const customerId = searchParams.get('customer_id');
    const subscriptionId = searchParams.get('subscription_id');
    const productId = searchParams.get('product_id');

    if (!checkoutId || !orderId || !customerId || !subscriptionId || !productId) {
      return NextResponse.redirect(`${baseUrl}/subscribe?error=missing_parameters`);
    }

    // 先查找用户
    const user = await prisma.user.findFirst({
      where: { checkoutId },
    });

    if (!user) {
      console.error('找不到用户:', checkoutId);
      return NextResponse.redirect(`${baseUrl}/subscribe?error=user_not_found`);
    }

    // 更新用户订阅状态
    await prisma.subscription.create({
      data: {
        userEmail: user.email,
        subscriptionId,
        orderId,
        customerId,
        checkoutId,
        productId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      },
    });

    return NextResponse.redirect(`${baseUrl}/account?success=true`);
  } catch (error) {
    console.error('处理支付成功回调错误:', error);
    return NextResponse.redirect(`${baseUrl}/subscribe?error=processing_error`);
  }
} 