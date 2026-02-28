import { z } from "zod";
import { signUpProfileSchema } from "../schemas/sign-up-profile-schema";

export type SignUpProfileFormValues = z.infer<typeof signUpProfileSchema>;
