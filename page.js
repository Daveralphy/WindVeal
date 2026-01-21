'use client';
import { useState, useEffect, useRef } from 'react';
import intents from '../data/intents.json';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am WindVeal. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // --- LOCAL BRAIN LOGIC ---
    const lowerInput = userMsg.content.toLowerCase();
    let localResponse = null;

    // Check intents.json for a match
    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (lowerInput.includes(pattern.toLowerCase())) {
          localResponse = intent.response;
          break;
        }
      }
      if (localResponse) break;
    }

    if (localResponse) {
      // Simulate a small delay for natural feeling
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: localResponse }]);
      }, 400);
      return;
    }

    // --- CLOUD BRAIN (API) ---
    // We will connect the Gemini API here in the next step
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: "I need to use my Cloud Brain for that, but the API isn't connected yet." }]);
    }, 600);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-primary">WindVeal</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-white text-gray-800 shadow-sm rounded-bl-none border border-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message WindVeal..."
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button type="submit" className="bg-primary text-white p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-primary-dark transition shadow-md">
          <span>&uarr;</span>
        </button>
      </form>
    </main>
  );
}