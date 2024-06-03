import fetch from 'node-fetch';
import {check_basic_token} from "../../../lib/authz";
import {add_embeddings_log, add_forbidden_log} from "../../../lib/stats";

export async function POST(request: Request) {
    const data = await request.json()
    const user = await check_basic_token(request)
    if (user == false) {
        await add_forbidden_log('embedding')
        return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const response = await fetch(process.env.OLLAMA_URL + "/api/embeddings", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });

        await add_embeddings_log(user.id, response.status)

        if (response.status !== 200) {
            return Response.json({ error: "Model not found" }, { status: 404 })
        }
        return Response.json(await response.json())
    } catch (e) {
        console.error(e)
        await add_embeddings_log(user.id, 500)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
