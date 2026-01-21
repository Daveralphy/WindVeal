import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import persona from "@/data/persona.json";

export async function POST(req) {
  try {
    const { message, history } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY is not set" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chatHistory = [
      {
        role: "user",
        parts: [{ text: `System Instruction: ${persona.system_instruction}` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will act as WindVeal." }],
      },
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
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Error in Chat API:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
