import { z } from 'zod';

export const DocTypeSchema = z.enum(['passport', 'aadhaar', 'drivers_license', 'national_id']);

export const AttestRequestSchema = z.object({
    userId: z.string().uuid(),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    docType: DocTypeSchema,
});

export const RevokeRequestSchema = z.object({
    attestationHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid attestation hash'),
});

export type DocType = z.infer<typeof DocTypeSchema>;
