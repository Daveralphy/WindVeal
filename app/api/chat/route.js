import { NextResponse } from "next/server";
import persona from "@/data/persona.json";

const tryWindVeal = async (message, history) => {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error("HF_API_KEY not set");

  // Format messages for OpenAI-compatible endpoint
  const messages = [
    { role: "system", content: persona.system_instruction },
    ...history.map(msg => ({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "microsoft/phi-3-mini-4k-instruct",
      messages,
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[HuggingFace] Status: ${response.status}, Error: ${errorText}`);
    throw new Error(`HuggingFace error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`[HuggingFace] Response received`);
  
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
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
