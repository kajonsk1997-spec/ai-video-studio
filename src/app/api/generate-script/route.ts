import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, duration, customMinutes } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing in environment variables" },
        { status: 500 }
      );
    }

    let sceneCount = 5;
    let durationDescription = "Standard (Approx 2 minutes)";

    if (duration === "short") {
      sceneCount = 3;
      durationDescription = "Shorts / Reels (Approx 30-40 seconds, high-paced motivational style)";
    } else if (duration === "medium") {
      sceneCount = 6;
      durationDescription = "Standard Video (Approx 2 minutes)";
    } else if (duration === "long") {
      sceneCount = 10;
      durationDescription = "Long-form Deep Dive (Approx 4-5 minutes)";
    } else if (duration === "ultra" || duration === "custom") {
      const mins = parseInt(customMinutes) || 5;
      sceneCount = Math.min(Math.max(mins * 3, 12), 25);
      durationDescription = `Ultra Long-form Documentary / Motivational Masterclass (~${mins} Minutes)`;
    }

    const prompt = `
You are an elite YouTube motivational speaker and expert video producer (like Dan Koe, David Goggins style delivery). 
Create a powerful, emotionally gripping, and complete video production kit for the topic: "${topic}".
Target Style/Duration: ${durationDescription}.

You MUST return a valid JSON object ONLY, with no markdown code blocks, no backticks, and no extra text. The JSON must match this exact structure:
{
  "title": "Deep, Catchy, Viral Motivational Title",
  "description": "Engaging video description optimized for YouTube SEO.",
  "hashtags": ["Motivation", "Discipline", "Success", "Mindset"],
  "fullScript": "The complete narrative script with deep, emotional, and powerful motivational tone.",
  "scenes": [
    {
      "sceneNumber": 1,
      "voiceover": "Powerful, deep narrative line for voiceover in this scene.",
      "visualDescription": "Cinematic visual description of dark moody gym, epic mountains, or deep focus.",
      "imagePrompt": "Cinematic 8k photorealistic dark moody aesthetic image prompt, dramatic lighting.",
      "durationInSeconds": 8
    }
  ]
}
Generate exactly ${sceneCount} continuous scenes tailored for high-retention motivational content.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      throw new Error(geminiData.error?.message || "Failed to generate content from Gemini API");
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No response received from Gemini model.");

    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let videoData;
    try {
      videoData = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error("Failed to parse AI-generated script into valid structured JSON.");
    }

    const enhancedScenes = videoData.scenes.map((scene: any) => {
      const encodedPrompt = encodeURIComponent(scene.imagePrompt || "Cinematic 8k moody motivational view");
      const encodedVoice = encodeURIComponent(scene.voiceover);
      return {
        ...scene,
        imageUrl: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720`,
        audioUrl: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedVoice}&tl=en&client=tw-ob`
      };
    });

    return NextResponse.json({
      success: true,
      data: { ...videoData, scenes: enhancedScenes }
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}