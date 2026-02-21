export interface LLMVerificationRequest {
    docType: string;
    documentBuffer: Buffer;
    mimeType: string;
}

export interface LLMVerificationResult {
    documentValid: boolean;
    documentTypeMatches: boolean;
    ageOver18: boolean | null;
    fieldsDetected: string[];
    confidence: number;   // 0-100
    redFlags: string[];
}
