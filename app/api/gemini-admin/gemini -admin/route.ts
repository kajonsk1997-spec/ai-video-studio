import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productName = body?.productName;

    if (!productName) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing!");
      return NextResponse.json({ success: false, error: "API key is missing in environment variables" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // অত্যন্ত সিম্পল প্রম্পট যা সরাসরি সঠিক JSON রিটার্ন করবে
    const prompt = `Generate e-commerce product details for "${productName}". 
Respond ONLY with a valid JSON object, no markdown, no explanation.
{
  "price": 350,
  "originalPrice": 500,
  "discount": "-30%",
  "category": "OTT",
  "badge": "Best Seller",
  "imageUrl": "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text || "{}";
    rawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();

    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      rawText = rawText.substring(jsonStart, jsonEnd + 1);
    }

    const data = JSON.parse(rawText);
    return NextResponse.json({ success: true, ...data });

  } catch (error: any) {
    console.error("GEMINI API ERROR:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}