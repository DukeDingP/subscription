import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const CREEM_API_KEY = process.env.CREEM_API_KEY;

// 产品 ID 配置
const PRODUCT_IDS = {
  pro: {
    monthly: process.env.CREEM_PRODUCT_ID_PRO_MONTHLY,
    yearly: process.env.CREEM_PRODUCT_ID_PRO_YEARLY,
  },
  business: {
    monthly: process.env.CREEM_PRODUCT_ID_BUSINESS_MONTHLY,
    yearly: process.env.CREEM_PRODUCT_ID_BUSINESS_YEARLY,
  },
};

// 根据产品 ID 获取计划类型和计费周期
function getPlanAndBillingCycle(productId: string): { plan: string; billingCycle: string } | null {
  for (const [plan, cycles] of Object.entries(PRODUCT_IDS)) {
    for (const [cycle, id] of Object.entries(cycles)) {
      if (id === productId) {
        return { plan, billingCycle: cycle };
      }
    }
  }
  return null;
}

// 计算订阅结束日期
function calculateEndDate(billingCycle: string): Date {
  const now = new Date();
  if (billingCycle === 'yearly') {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return new Date(now.setMonth(now.getMonth() + 1));
}

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

    // 获取计划类型和计费周期
    const planInfo = getPlanAndBillingCycle(productId);
    if (!planInfo) {
      console.error('无效的产品 ID:', productId);
      return NextResponse.redirect(`${baseUrl}/subscribe?error=invalid_product`);
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: { checkoutId },
    });

    if (!user) {
      console.error('找不到用户:', checkoutId);
      return NextResponse.redirect(`${baseUrl}/subscribe?error=user_not_found`);
    }

    // 计算订阅结束日期
    const endDate = calculateEndDate(planInfo.billingCycle);

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
        plan: planInfo.plan,
        billingCycle: planInfo.billingCycle,
        startDate: new Date(),
        endDate,
      },
    });

    return NextResponse.redirect(`${baseUrl}/account?success=true`);
  } catch (error) {
    console.error('处理支付成功回调错误:', error);
    return NextResponse.redirect(`${baseUrl}/subscribe?error=processing_error`);
  }
} 