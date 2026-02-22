import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMVerificationRequest, LLMVerificationResult } from './llm.types';
import { getVerificationPrompt } from './prompts';
import { mockVerify } from './llm.mock';

const isMockMode = (): boolean => process.env.LLM_MOCK_MODE === 'true';

export const verifyDocument = async (
    request: LLMVerificationRequest
): Promise<LLMVerificationResult> => {
    if (isMockMode()) {
        console.log('[LLM] Mock mode — returning deterministic result');
        return mockVerify(request);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = getVerificationPrompt(request.docType);

    const imagePart = {
        inlineData: {
            data: request.documentBuffer.toString('base64'),
            mimeType: request.mimeType,
        },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('LLM returned non-JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as LLMVerificationResult;

    // Validate and clamp confidence
    parsed.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence)));

    return parsed;
};
