import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import persona from "@/data/persona.json";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

const tryWindVeal = async (message, history) => {
  if (!process.env.HF_TOKEN) throw new Error("HF_TOKEN not set");

  const messages = [
    { role: "system", content: persona.system_instruction },
    ...history.map(msg => ({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  const chatCompletion = await client.chat.completions.create({
    model: "HuggingFaceH4/zephyr-7b-beta:featherless-ai",
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  console.log(`[WindVeal] Response received from Zephyr-7B-Beta`);
  return chatCompletion.choices[0].message.content;
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
