import fetch from 'node-fetch';
import { StreamingTextResponse } from "ai"
import {check_basic_token} from "../../../lib/authz";
import {add_forbidden_log, add_generate_log} from "../../../lib/stats";

export async function POST(request: Request) {
    const data = await request.json()
    const user = await check_basic_token(request)
    if (user === false) {
        await add_forbidden_log('generate')
        return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const response = await fetch(process.env.OLLAMA_URL + "/api/generate", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });
        await add_generate_log(user.id, response.status, data.model)

        if (response.status !== 200) {
            if (response.status === 404) {
                return Response.json({ error: "Model not found" }, { status: 404 })
            }
            return Response.json({ error: "Internal Server Error" }, { status: 500 })
        }
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response.body as any) {
                    controller.enqueue(chunk)
                }
                controller.close()
            },
        })
        return new StreamingTextResponse(stream, {
            headers: {
                "Content-Type": "application/json"
            }
        })
    } catch (e) {
        console.error(e)
        await add_generate_log(user.id, 500, data.model)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

