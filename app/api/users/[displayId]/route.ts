import {auth} from "@/auth";
import prisma from "../../../../lib/prisma";
import {sha256} from "../../../../lib/crypto";
import {is_admin_or_owner} from "../../../../lib/authz";


export async function DELETE(request: Request, { params }: { params: { displayId: string } }) {
    const session = await auth()
    if (!session || !is_admin_or_owner(session, params.displayId)) return Response.json({ error: "Unauthorized" }, { status: 403 })

    const user = await prisma.user.findUnique({
        where: {
            displayId: params.displayId,
        }
    })
    if (!user) return Response.json({ error: "User not found" }, { status: 404 })
    if (user.roleId === "admin") return Response.json({ error: "Cannot delete admin" }, { status: 403 })
    const res = await prisma.user.delete({
        where: {
            displayId: params.displayId,
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

// パスワードの変更処理
export async function PUT(request: Request, { params }: { params: { displayId: string } }) {
    const session = await auth()
    if (!session || !is_admin_or_owner(session, params.displayId)) return Response.json({ error: "Unauthorized" }, { status: 403 })
    const data = await request.json()
    const res = await prisma.user.update({
        where: {
            displayId: params.displayId
        },
        data: {
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