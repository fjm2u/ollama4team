import prisma from "./prisma";


const update_last_access = async (userId: string) => {
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            lastAccessedAt: new Date()
        }
    })
}

const add_embeddings_log = async (userId: string, statusCode: number) => {
    await update_last_access(userId)
    await prisma.accessLog.create({
        data: {
            operationId: 'embedding',
            statusCode: statusCode,
            userId: userId,
        }
    })
}

const add_generate_log = async (userId: string, statusCode: number) => {
    await update_last_access(userId)
    await prisma.accessLog.create({
        data: {
            operationId: 'generate',
            statusCode: statusCode,
            userId: userId,
        }
    })
}

export {add_embeddings_log, add_generate_log}
