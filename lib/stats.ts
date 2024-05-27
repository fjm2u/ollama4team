import prisma from "./prisma";


const add_embeddings_log = async (userId: string, statusCode: number) => {
    await prisma.accessLog.create({
        data: {
            operationId: 'embedding',
            statusCode: statusCode,
            userId: userId,
        }
    })
}

const add_generate_log = async (userId: string, statusCode: number) => {
    await prisma.accessLog.create({
        data: {
            operationId: 'generate',
            statusCode: statusCode,
            userId: userId,
        }
    })
}

export {add_embeddings_log, add_generate_log}
