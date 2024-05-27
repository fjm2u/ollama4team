import {Session} from "next-auth";
import prisma from "./prisma";
import {sha256} from "./crypto";


const is_admin_or_owner = (session: Session, displayId: string) => {
    console.log(session)
    // @ts-ignore
    if (session.user.role === "admin") return true
    // @ts-ignore
    return session.user.displayId === displayId;

}


const is_admin = (session: Session) => {
    // @ts-ignore
    return session.user.role === "admin";
}


const is_admin_or_member = (session: Session) => {
    // @ts-ignore
    return session.user.role === "member" || session.user.role === "admin";
}


const check_basic_token = async (request: Request) => {
    if (!request.headers.get("Authorization")) return false
    // @ts-ignore
    const token = request.headers.get("Authorization").replace("Basic ", "")
    const user = await prisma.user.findUnique({
        where: {
            password: sha256(token)
        }
    })
    if (!user) return false
    return user
}

export {is_admin_or_owner, is_admin_or_member, is_admin, check_basic_token}