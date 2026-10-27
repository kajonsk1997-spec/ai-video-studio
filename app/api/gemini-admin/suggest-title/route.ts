import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inputTitle = body?.inputTitle;

    if (!inputTitle) {
      return NextResponse.json({ success: false, error: "Input title is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Suggest 3 professional, catchy, and SEO-friendly e-commerce product titles based on input: "${inputTitle}".
Respond ONLY with a raw JSON array of 3 strings. No markdown formatting.
Example format:
["Title 1", "Title 2", "Title 3"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text || "[]";
    rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();

    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      rawText = rawText.substring(jsonStart, jsonEnd + 1);
    }

    const suggestions = JSON.parse(rawText);
    return NextResponse.json({ success: true, suggestions });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}