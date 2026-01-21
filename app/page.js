'use client';
import { useState, useEffect, useRef } from 'react';
import { evaluate } from 'mathjs';
import { UserCircle, LogOut, PlusCircle, Trash2, Settings as SettingsIcon } from 'lucide-react';
import intents from '../data/intents.json';
import AuthModal from '../components/AuthModal';
import Settings from '../components/Settings';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am WindVeal. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    setFontSize(savedSize);
  }, []);

  // Apply theme
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist font size
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  // Auto-save history when messages change (if logged in)
  useEffect(() => {
    if (currentUser && messages.length > 0) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, messages })
      }).catch(err => console.error("Failed to save history", err));
    }
  }, [messages, currentUser]);

  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    
    // Load history from DB
    try {
      const res = await fetch(`/api/history?userId=${user.id}`);
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        setMessages(data.history);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: `Welcome back, ${user.username}!` }]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setMessages(prev => [...prev, { role: 'bot', content: `Welcome back, ${user.username}!` }]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMessages(prev => [...prev, { role: 'bot', content: "You have been logged out." }]);
  };

  const handleNewChat = async () => {
    if (currentUser && messages.length > 1) {
      const confirmNew = window.confirm("Starting a new chat will delete your previous history. Are you sure you want to continue?");
      if (!confirmNew) return;

      // Explicitly delete old history from DB (though saving the new state would also overwrite it)
      try {
        await fetch('/api/history', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch (err) {
        console.error("Error clearing history", err);
      }
    }

    setMessages([
      { role: 'bot', content: 'Hello! I am WindVeal. How can I help you today?' }
    ]);
  };

  const handleDeleteHistory = async () => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to delete your chat history? This cannot be undone.")) {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setMessages([{ role: 'bot', content: 'History deleted. How can I help you?' }]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (messages.length >= 100) {
      alert("You have reached the 100 message limit. Please start a new chat.");
      return;
    }

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // --- LOCAL BRAIN LOGIC ---
    const lowerInput = userMsg.content.toLowerCase();
    let localResponse = null;

    // 1. Check for Math Expressions
    try {
      // Regex: Only allow numbers, spaces, and math operators (+ - * / ^ . ())
      // Also ensures there is at least one operator so we don't just echo back numbers
      if (/^[\d\s.+\-*/^()]+$/.test(userMsg.content) && /[+\-*/^]/.test(userMsg.content)) {
        const result = evaluate(userMsg.content);
        localResponse = `${userMsg.content} = ${result}`;
      }
    } catch (error) {
      // If mathjs fails to evaluate, ignore and proceed to intents
    }

    // Check intents.json for a match
    if (!localResponse) {
      for (const intent of intents) {
        for (const pattern of intent.patterns) {
          if (lowerInput.includes(pattern.toLowerCase())) {
            localResponse = intent.response;
            break;
          }
        }
        if (localResponse) break;
      }
    }

    if (localResponse) {
      // Simulate a small delay for natural feeling
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: localResponse }]);
        setIsTyping(false);
      }, 400);
      return;
    }

    // --- CLOUD BRAIN (API) ---
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMsg.content,
          history: messages 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting to the cloud." }]);
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: `Error: ${error.message || "Connection failed"}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${getFontSizeClass()}`}>
      <header className="bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary dark:text-white">WindVeal</h1>
          <button 
            onClick={handleNewChat}
            className="text-gray-400 hover:text-primary dark:hover:text-white transition-colors" 
            title="New Chat"
          >
            <PlusCircle size={24} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
            title="Settings"
          >
            <SettingsIcon size={24} />
          </button>
          {currentUser && (
            <button 
              onClick={handleDeleteHistory}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete History"
            >
              <Trash2 size={24} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2 text-gray-700">
                <UserCircle size={20} className="dark:text-gray-300" />
                <span className="font-medium dark:text-gray-200">{currentUser.username}</span>
              </div>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition" title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition shadow-sm"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm rounded-bl-none border border-gray-100 dark:border-gray-700'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 transition-colors duration-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message WindVeal..."
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button type="submit" className="bg-primary text-white p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-primary-dark transition shadow-md">
          <span>&uarr;</span>
        </button>
      </form>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />

      <Settings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
    </main>
  );
}