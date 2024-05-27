import { PrismaClient } from '@prisma/client'
import {sha256} from "../lib/crypto";

const prisma = new PrismaClient()
async function main() {
    const member = await prisma.userRole.upsert({
        where: { id: 'member' },
        update: {},
        create: {
            id: 'member',
        },
    })
    const admin = await prisma.userRole.upsert({
        where: { id: 'admin' },
        update: {},
        create: {
            id: 'admin',
        },
    })
    const user_admin = await prisma.user.upsert({
        where: { id: 'admin' },
        update: {},
        create: {
            displayId: process.env.ADMIN_ID || 'admin',
            role: {
                connect: {
                    id: 'admin',
                },
            },
            password: sha256(process.env.ADMIN_PASSWORD || 'admin'),
        },
    })
    console.log({ user_admin })

    const generate_operation = await prisma.operation.upsert({
        where: { id: 'generate' },
        update: {},
        create: {
            id: 'generate',
        },
    })
    const embedding_operation = await prisma.operation.upsert({
        where: { id: 'embedding' },
        update: {},
        create: {
            id: 'embedding',
        },
    })
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })