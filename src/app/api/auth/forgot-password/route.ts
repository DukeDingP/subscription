import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // 不验证证书
    rejectUnauthorized: process.env.NODE_ENV !== 'production',
  },
  debug: process.env.NODE_ENV === 'development', // 开发环境启用调试日志
});

// 验证邮件服务器连接
transporter.verify(function (error) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: '该邮箱未注册' },
        { status: 404 }
      );
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1小时后过期

    // 保存重置令牌到数据库
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry,
      },
    });

    // 发送重置密码邮件
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: '重置密码',
      html: `
        <h1>重置密码</h1>
        <p>请点击下面的链接重置您的密码：</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>此链接将在1小时后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
      `,
    });

    return NextResponse.json(
      { message: '重置密码链接已发送到您的邮箱' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { message: '发送重置密码邮件失败' },
      { status: 500 }
    );
  }
} 