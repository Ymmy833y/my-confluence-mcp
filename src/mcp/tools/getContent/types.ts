import type { z } from "zod";

import type { GetContentInputSchema, GetContentOutputSchema } from "./schema";

export type GetContentInput = z.infer<typeof GetContentInputSchema>;
export type GetContentOutput = z.infer<typeof GetContentOutputSchema>;
