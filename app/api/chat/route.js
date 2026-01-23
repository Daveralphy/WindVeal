import { NextResponse } from "next/server";
import persona from "@/data/persona.json";

const tryWindVeal = async (message, history) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not set");

  // Build conversation context
  const conversationContext = history
    .map(msg => `${msg.role === "bot" ? "Assistant" : "User"}: ${msg.content}`)
    .join("\n");

  const fullPrompt = `${persona.system_instruction}\n\n${conversationContext}\nUser: ${message}\nAssistant:`;

  const response = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: fullPrompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[HuggingFace] Status: ${response.status}, Error: ${errorText}`);
    throw new Error(`HuggingFace error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`[HuggingFace] Response received:`, JSON.stringify(data).substring(0, 200));
  
  if (Array.isArray(data) && data[0]?.generated_text) {
    const generatedText = data[0].generated_text;
    const assistantResponse = generatedText.split("Assistant:")?.pop()?.trim() || generatedText;
    return assistantResponse;
  }
  
  throw new Error(`Unexpected HuggingFace response format: ${JSON.stringify(data)}`);
};

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    try {
      console.log(`[Chat] WindVeal Mini processing...`);
      const response = await tryWindVeal(message, history);
      console.log(`[Chat] WindVeal Mini succeeded`);
      return NextResponse.json({ response, model: "WindVeal Mini" });
    } catch (error) {
      console.error(`[Chat] WindVeal Mini failed:`, error.message);
      throw error;
    }
  } catch (error) {
    console.error("Error in Chat API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
