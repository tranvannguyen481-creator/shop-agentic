import { z } from "zod";
import { signUpEmailSchema } from "../schemas/sign-up-email-schema";

export type SignUpEmailFormValues = z.infer<typeof signUpEmailSchema>;
