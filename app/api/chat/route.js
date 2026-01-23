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

  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.[0] || `WindVeal error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data[0]?.generated_text || "";
  
  // Extract only the assistant's response
  const assistantResponse = generatedText.split("Assistant:")?.pop()?.trim() || generatedText;
  return assistantResponse;
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
