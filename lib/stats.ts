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

const add_forbidden_log = async (operationId: string) => {
    await prisma.accessLog.create({
        data: {
            operationId: operationId,
            statusCode: 403,
        }
    })
}

const add_embeddings_log = async (userId: string, statusCode: number, model: string) => {
    await update_last_access(userId)
    await prisma.accessLog.create({
        data: {
            operationId: 'embedding',
            model: model,
            statusCode: statusCode,
            userId: userId,
        }
    })
}

const add_generate_log = async (userId: string, statusCode: number, model: string) => {
    await update_last_access(userId)
    await prisma.accessLog.create({
        data: {
            operationId: 'generate',
            model: model,
            statusCode: statusCode,
            userId: userId,
        }
    })
}

export {add_embeddings_log, add_generate_log, add_forbidden_log}
