import { generateDummyPassword } from "@/lib/db/utils";

// This constant is used for timing-safe password comparison when user not found
// Isolated from lib/constants.ts to avoid pulling bcrypt-ts into Edge Runtime
export const DUMMY_PASSWORD = generateDummyPassword();
