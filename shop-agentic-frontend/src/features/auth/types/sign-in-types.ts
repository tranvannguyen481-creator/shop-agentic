import { z } from "zod";
import { signInSchema } from "../schemas/sign-in-schema";

export type SignInFormValues = z.infer<typeof signInSchema>;
