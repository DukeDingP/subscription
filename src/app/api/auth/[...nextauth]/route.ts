import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 扩展 Session 类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      // authorization: {
      //   params: {
      //     scope: 'openid email profile',
      //     prompt: "consent",
      //     access_type: "offline",
      //     response_type: "code"
      //   }
      // },
      httpOptions: {
        timeout: 10000, // 增加超时时间到 10 秒
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000, // 增加超时时间到 10 秒
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }

        // 检查密码长度是否大于8位
        if (credentials.password.length < 8) {
          throw new Error("密码必须大于8位数");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.password) {
          throw new Error("用户不存在");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("密码错误");
        }

        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
    updateAge: 24 * 60 * 60, // 24 小时更新一次
  },
  secret: process.env.NEXTAUTH_SECRET,
  //debug: process.env.NODE_ENV === "development",
  debug: process.env.NODE_ENV === "production",
  pages: {
    signIn: "/login",
    error: "/login", // 添加错误页面
  },
  callbacks: {
    async signIn({ user, account, profile }) {
//      console.log("signIn triggered!", { user, account }); // 调试日志
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // 检查用户是否已存在
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (existingUser) {
            // 如果用户已存在，检查是否已经有该提供商的账号
            const existingAccount = await prisma.$queryRaw`
              SELECT * FROM "Account" 
              WHERE "userId" = ${existingUser.id} 
              AND "provider" = ${account.provider}
            `;

            if (!existingAccount || (Array.isArray(existingAccount) && existingAccount.length === 0)) {
              // 如果没有该提供商的账号，创建新的账号关联
              await prisma.$executeRaw`
                INSERT INTO "Account" (
                  "id", "userId", "type", "provider", "providerAccountId",
                  "access_token", "token_type", "scope", "id_token", "session_state"
                ) VALUES (
                  ${crypto.randomUUID()}, ${existingUser.id}, ${account.type},
                  ${account.provider}, ${account.providerAccountId},
                  ${account.access_token}, ${account.token_type},
                  ${account.scope}, ${account.id_token}, ${account.session_state}
                )
              `;
            }
          } else {
            // 创建新用户
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                password: "", // OAuth 登录用户不需要密码
              }
            });
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 