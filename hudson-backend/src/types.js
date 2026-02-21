import { z } from "zod";

export const aadhaarSchema = z.object({
  number: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  isVerified: z.boolean().default(false),
});

export const panSchema = z.object({
  number: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN must match ABCDE1234F format"),
  isVerified: z.boolean().default(false),
});

export const passportSchema = z.object({
  number: z.string(),
  isVerified: z.boolean().default(false),
});

export const collegeSchema = z.object({
  studentIdNumber: z.string(),
  collegeName: z.string(),
  validUntil: z.string().datetime(),
  program: z.string(),
  degree: z.string(),
  isVerified: z.boolean().default(false),
});

export const userDataSchema = z.object({
  name: z.string(),
  dateOfBirth: z.string().datetime(),
  phoneNumber: z.string(),
  email: z.string().email(),
  relayEmail: z.string().email().optional(),
  reputationScore: z.number().default(0),
  profilePictureUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  aadhaar: aadhaarSchema,
  pan: panSchema,
  passport: passportSchema,
  college: collegeSchema,
});
