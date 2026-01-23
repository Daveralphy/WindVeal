import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import persona from "@/data/persona.json";

const tryGemini = async (message, history) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chatHistory = [
    { role: "user", parts: [{ text: `System Instruction: ${persona.system_instruction}` }] },
    { role: "model", parts: [{ text: "Understood. I will act as WindVeal." }] },
  ];

  if (persona.examples) {
    persona.examples.forEach((ex) => {
      chatHistory.push({ role: "user", parts: [{ text: ex.user }] });
      chatHistory.push({ role: "model", parts: [{ text: ex.bot }] });
    });
  }

  if (history && Array.isArray(history)) {
    history.forEach((msg) => {
      const role = msg.role === "bot" ? "model" : "user";
      chatHistory.push({ role, parts: [{ text: msg.content }] });
    });
  }

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
};

const tryOpenAI = async (message, history) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const messages = [
    { role: "system", content: persona.system_instruction },
    ...history.map(msg => ({ role: msg.role === "bot" ? "assistant" : "user", content: msg.content })),
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Try models in order: Gemini  OpenAI (Grok removed due to 403 errors)
    const models = [
      { name: "Gemini", fn: tryGemini },
      { name: "OpenAI", fn: tryOpenAI },
    ];

    let lastError;
    for (const { name, fn } of models) {
      try {
        console.log(`[Chat] Trying ${name}...`);
        const response = await fn(message, history);
        console.log(`[Chat] ${name} succeeded`);
        return NextResponse.json({ response, model: name });
      } catch (error) {
        lastError = error;
        console.warn(`[Chat] ${name} failed:`, error.message);
      }
    }

    throw lastError || new Error("All models failed");
  } catch (error) {
    console.error("Error in Chat API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
