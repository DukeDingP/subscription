import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    // 查找并验证令牌
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: '无效的重置令牌' },
        { status: 400 }
      );
    }

    // 检查令牌是否过期
    if (verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: '重置令牌已过期' },
        { status: 400 }
      );
    }

    // 更新用户密码
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword },
    });

    // 删除使用过的令牌
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json(
      { message: '密码重置成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json(
      { message: '重置密码失败' },
      { status: 500 }
    );
  }
} 