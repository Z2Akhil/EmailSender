import { z } from "zod";

export const createDomainSchema = z.object({
    domainName: z.string().min(1, "Domain name is required").regex(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
        "Invalid domain format"
    ),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
