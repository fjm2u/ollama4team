import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import {signInSchema} from "../lib/zod";
import {ZodError} from "zod";
import {sha256} from "../lib/crypto";
import prisma from "../lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                id: { label: 'ID', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {
                try {
                    const { id, password } = await signInSchema.parseAsync(credentials)
                    const pwHash = sha256(password)
                    const user = await prisma.user.findFirst({
                        where: {
                            displayId: id,
                            password: pwHash
                        }
                    })
                    if (!user) {
                        throw new Error("User not found.")
                    }
                    return JSON.parse(JSON.stringify({
                        id: user.id,
                        displayId: user.displayId,
                        role: user.roleId
                    }))
                } catch (error) {
                    if (error instanceof ZodError) return null
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                token.user = user;
            }
            return token;
        },
        session: async ({ session, token }) => {
            // @ts-ignore
            session.user = token.user;
            return session;
        }
    }
})