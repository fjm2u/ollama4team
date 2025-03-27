import {auth} from "@/auth";
import {is_admin, is_admin_or_member} from "../../../lib/authz";
import fetch from "node-fetch";
import {NextRequest} from "next/server";


export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session || !is_admin(session)) return Response.json({ error: "Unauthorized" }, { status: 403 })
    const data = await request.json()

    const response = await fetch(process.env.OLLAMA_URL + "/api/pull", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: data.name,
        }),
    });
    if (response.status !== 200) {
        return Response.json({ error: "Model not found" }, { status: 404 })
    }
    return Response.json({ message: "Model added" })
}


export async function DELETE(request: NextRequest) {
    const session = await auth()
    if (!session || !is_admin(session)) return Response.json({ error: "Unauthorized" }, { status: 403 })
    const data = await request.json()

    const response = await fetch(process.env.OLLAMA_URL + "/api/delete", {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: data.name
        }),
    });
    if (response.status !== 200) {
        return Response.json({ error: "Model not found" }, { status: 404 })
    }
    return Response.json({ message: "Model added" })
}


export async function GET() {
    const session = await auth()
    if (!session || !is_admin_or_member(session)) return Response.json({ error: "Unauthorized" }, { status: 403 })
    const response = await fetch(process.env.OLLAMA_URL + "/api/tags", {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    });
    if (response.status !== 200) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
    const models = await response.json()
    return Response.json(models)
}