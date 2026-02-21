import { LLMVerificationRequest, LLMVerificationResult } from './llm.types';
import { sha256 } from '../../utils/crypto';

export const mockVerify = (request: LLMVerificationRequest): LLMVerificationResult => {
    const hash = sha256(request.documentBuffer);
    // Use last hex digit to produce deterministic but varied results
    const seed = parseInt(hash.slice(-1), 16);

    const baseConfidence = 75 + (seed % 20); // 75-94
    const isValid = seed > 2; // ~87% pass rate

    const fieldsMap: Record<string, string[]> = {
        passport: ['name', 'dob', 'photo', 'id_number', 'nationality', 'expiry_date'],
        aadhaar: ['name', 'dob', 'photo', 'id_number', 'address'],
        drivers_license: ['name', 'dob', 'photo', 'id_number', 'expiry_date', 'vehicle_class'],
        national_id: ['name', 'dob', 'photo', 'id_number', 'address'],
    };

    return {
        documentValid: isValid,
        documentTypeMatches: isValid,
        ageOver18: isValid ? true : null,
        fieldsDetected: fieldsMap[request.docType] || ['name', 'photo'],
        confidence: isValid ? baseConfidence : 30 + (seed % 20),
        redFlags: isValid ? [] : ['low_resolution', 'possible_tampering'],
    };
};
