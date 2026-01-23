import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  try {
    const { message, history, model } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let responseText;

    // For now, 'windveal' and 'gemini' will use the same logic.
    // This can be expanded later.
    if (model === 'gemini' || model === 'windveal') {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'Google API Key is not configured on the server.' }, { status: 500 });
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      // Explicitly use 'gemini-pro' to avoid 404 errors with default models like 'gemini-1.5-flash'
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = geminiModel.startChat({
        history: history?.map(msg => ({
          role: msg.role === 'bot' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })) || [],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      responseText = response.text();

    } else {
      // Placeholder for other models like chatGPT, deepseek, etc.
      responseText = `The model '${model}' is not implemented yet. Please add its logic in /api/chat/route.js.`;
    }

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error("Error in Chat API:", error);
    const errorMessage = error.message || 'An unknown error occurred.';
    return NextResponse.json({ error: `API Error: ${errorMessage}` }, { status: 500 });
  }
}