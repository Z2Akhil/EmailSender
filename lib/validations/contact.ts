import { z } from "zod";

export const createListSchema = z.object({
    name: z.string().min(1, "List name is required").max(50, "List name is too long"),
});

export const updateListSchema = z.object({
    name: z.string().min(1, "List name is required").max(50, "List name is too long"),
});

export const createContactSchema = z.object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    whatsappNumber: z.string().optional().nullable(),
    listId: z.string().min(1, "List ID is required"),
});
