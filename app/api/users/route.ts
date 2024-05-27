import {auth} from "@/auth";
import prisma from "../../../lib/prisma";
import {sha256} from "../../../lib/crypto";
import {is_admin_or_member} from "../../../lib/authz";


export async function POST(request: Request) {
    const session = await auth()
    if (!session || !is_admin_or_member(session)) return Response.json({ error: "Unauthorized" }, { status: 403 })

    const data = await request.json()
    const res = await prisma.user.create({
        data: {
            displayId: data.id,
            password: sha256(data.password)
        }
    })
    return Response.json({
        id: res.id,
        displayId: res.displayId,
        roleId: res.roleId,
        lastAccessedAt: res.lastAccessedAt,
        createdAt: res.createdAt,
    })
}

export async function GET() {
    const session = await auth()
    if (!session || !is_admin_or_member(session)) return Response.json({ error: "Unauthorized" }, { status: 403 })

    const users = await prisma.user.findMany({
        select: {
            id: true,
            displayId: true,
            roleId: true,
            lastAccessedAt: true,
            createdAt: true,
        }
    })

    return Response.json(users)
}
