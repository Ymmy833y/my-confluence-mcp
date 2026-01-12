import type { z } from "zod";

import type { SearchInputSchema, SearchOutputSchema } from "./schema";

export type SearchToolInput = z.infer<typeof SearchInputSchema>;
export type SearchToolOutput = z.infer<typeof SearchOutputSchema>;
