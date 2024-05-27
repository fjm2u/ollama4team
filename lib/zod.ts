import { object, string } from "zod"

export const signInSchema = object({
    id: string({ required_error: "ID is required" })
        .min(1, "ID is required"),
    password: string({ required_error: "Password is required" })
        .min(1, "Password is required"),
})