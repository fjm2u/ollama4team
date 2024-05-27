import {is_admin_or_member} from "../../../lib/authz";
import {auth} from "@/auth";
import { type NextRequest } from 'next/server'
import prisma from "../../../lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session || !is_admin_or_member(session)) return Response.json({ error: "Unauthorized" }, { status: 403 })
    //  期間で絞り込む
    const searchParams = request.nextUrl.searchParams
    let startDate = searchParams.get('startDate')
    let endDate = searchParams.get('endDate')
    if (!startDate || !endDate) {
        // 直近2日間のログを取得する
        const now = new Date()
        endDate = endDate || now.toISOString()
        startDate = startDate || new Date(now.setDate(now.getDate() - 3)).toISOString()
    }

    const logs = await prisma.accessLog.findMany({
        where: {
            timestamp: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        },
        include: {
            user: {
                select: {
                    displayId: true
                }
            }
        }
    })
    return Response.json(logs)
}

