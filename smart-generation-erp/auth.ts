import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
            authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        
        const { prisma } = await import("@/lib/prisma")
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        
        // BLOCK LOGIN IF USER IS INACTIVE
        if (!user || !user.isActive) return null
        
        const isPasswordValid = await compare(credentials.password as string, user.password)
        if (!isPasswordValid) return null
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})