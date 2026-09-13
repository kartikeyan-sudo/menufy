import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIMenuExtractionResult } from '@/types/database';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Free tier Gemini models in order of priority (100% free via Google AI Studio API key)
const FREE_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'];

/**
 * Fast Native Vision OCR & Menu Structuring Engine (Gemini Flash Multimodal)
 * Directly parses menu images/PDFs in ~1.5 seconds without node worker crashes.
 */
export async function extractMenuFromImages(
  imageBase64List: { inlineData: { data: string; mimeType: string } }[]
): Promise<AIMenuExtractionResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const prompt = `
  You are an expert OCR & Vision assistant for restaurant menu digitization.
  Analyze the provided menu image(s) or PDF page(s) carefully.
  Perform native OCR text reading to extract all categories, item names, descriptions, and prices.
  
  CRITICAL RULES:
  1. DO NOT invent or hallucinate information.
  2. If a price cannot be determined with high confidence, return null for price and mark confidence as 'low'.
  3. Return strictly VALID JSON with the following structure:
  {
    "categories": [
      {
        "name": "Category Name",
        "items": [
          {
            "name": "Item Name",
            "description": "Item description or ingredients if available, else empty string",
            "price": 199.00,
            "confidence": "high"
          }
        ]
      }
    ]
  }
  `;

  const contents = [prompt, ...imageBase64List];

  let lastError: any = null;

  // Try free tier models with fallback
  for (const modelName of FREE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(contents);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
      const cleanedJson = (jsonMatch[1] || responseText).trim();

      const parsedData = JSON.parse(cleanedJson) as AIMenuExtractionResult;
      return parsedData;
    } catch (error: any) {
      console.warn(`Model ${modelName} failed or hit rate limit:`, error.message);
      lastError = error;
    }
  }

  console.error('All free-tier Gemini models failed:', lastError);
  throw new Error(`AI menu extraction failed: ${lastError?.message || 'Free model processing error'}`);
}
