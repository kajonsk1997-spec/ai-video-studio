import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { topic, duration, customMinutes } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { NextResponse: 400 });
    }

    // Clean up topic string to prevent prompt injection or messy titles
    const cleanTopic = topic.replace(/[#*_[\]()]/g, "").trim();

    const prompt = `Create a professional YouTube video production package for the topic: "${cleanTopic}".
    Duration style: ${duration}.
    
    You must return a valid JSON object ONLY, with no markdown code blocks, matching this exact structure:
    {
      "title": "A catchy, clean viral title without markdown symbols",
      "fullScript": "A brief summary script of the video",
      "scenes": [
        {
          "sceneNumber": 1,
          "durationInSeconds": 10,
          "voiceover": "Engaging voiceover text for scene 1",
          "imagePrompt": "Cinematic visual description for scene 1, 8k",
          "audioUrl": "https://actions.google.com/sounds/v1/ambiences/wind_howl.ogg"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let rawText = response.text || "{}";
    // Clean markdown code blocks if Gemini added them
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedData = JSON.parse(rawText);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate script" },
      { status: 500 }
    );
  }
}