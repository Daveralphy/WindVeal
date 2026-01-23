'use client';
import { useState, useEffect, useRef } from 'react';
import { evaluate } from 'mathjs';
import { UserCircle, LogOut, PlusCircle, Trash2, Menu, X, Copy, ThumbsUp, ThumbsDown, Check, Plus, Image as ImageIcon, FileText, Music, Video, Square, Mic, Share2, Moon, Sun, Type, Facebook, Twitter, Linkedin, MessageCircle, HelpCircle, ChevronDown, Bell, Volume2, Info, Send, PanelLeft, CreditCard, Sliders, Upload } from 'lucide-react';
import intents from '@/data/intents.json';
import suggestions from '@/app/suggestions.json';
import AuthModal from '../components/AuthModal';
import Settings from '../components/Settings';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const fileMenuRef = useRef(null);
  const abortControllerRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentModel, setCurrentModel] = useState('WindVeal Mini');
  const [isHeaderModelMenuOpen, setIsHeaderModelMenuOpen] = useState(false);
  const [shuffledSuggestions, setShuffledSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    setShuffledSuggestions(shuffled);
  }, []);

  // Handle click outside for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setIsFileMenuOpen(false);
      }
      if (isShareOpen && !event.target.closest('.share-menu-container')) {
        setIsShareOpen(false);
      }
      if (isProfileOpen && !event.target.closest('.profile-menu-container')) {
        setIsProfileOpen(false);
      }
      if (isHeaderModelMenuOpen && !event.target.closest('.header-model-menu-container')) {
        setIsHeaderModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShareOpen, isProfileOpen, isFileMenuOpen, isHeaderModelMenuOpen]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('windvealUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        // Load history for this user
        fetch(`/api/history?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.history && data.history.length > 0) {
              setMessages(data.history.map(m => ({ ...m, feedback: m.feedback || null })));
            } else {
              setMessages([]);
            }
          })
          .catch(err => console.error("Error loading history:", err));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem('windvealUser');
      }
    }
  }, []);

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
      case 'small': return 'text-xs md:text-sm';
      case 'large': return 'text-base md:text-lg';
      default: return 'text-sm md:text-base';
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
    localStorage.setItem('windvealUser', JSON.stringify(user)); // Persist user
    setIsAuthModalOpen(false);
    
    // Load history from DB
    try {
      const res = await fetch(`/api/history?userId=${user.id}`);
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        setMessages(data.history.map(m => ({ ...m, feedback: m.feedback || null })));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setMessages([]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('windvealUser'); // Clear persisted user
    setMessages([{ role: 'bot', content: "You have been logged out.", feedback: null }]);
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

    setMessages([]);
    setIsSidebarOpen(false);
    setActiveSetting(null);
  };

  const handleDeleteHistory = async () => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to delete your chat history? This cannot be undone.")) {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setMessages([{ role: 'bot', content: 'History deleted. How can I help you?', feedback: null }]);
    }
  };

  const getHistorySummary = () => {
    if (messages.length <= 1) return null;
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      return firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
    }
    return "Current Conversation";
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(idx);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleFeedback = (messageIndex, feedbackType) => {
    setMessages(prevMessages => {
      return prevMessages.map((msg, idx) => {
        if (idx === messageIndex && msg.role === 'bot') {
          const currentFeedback = msg.feedback;
          return { ...msg, feedback: currentFeedback === feedbackType ? null : feedbackType };
        }
        return msg;
      });
    });
  };

  const handleModelChange = (model) => {
    setCurrentModel(model);
  };

  const handleFileSelect = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
    setIsFileMenuOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const toggleSetting = (setting) => {
    setActiveSetting(activeSetting === setting ? null : setting);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'bot', content: 'Response cancelled.', feedback: null }]);
  };

  const playRecordingSound = (isStart) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const frequency = isStart ? 600 : 400;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        playRecordingSound(true);
      };
      recognition.onend = () => {
        setIsRecording(false);
        playRecordingSound(false);
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out WindVeal AI Assistant!");
    let shareUrl = "";

    switch (platform) {
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
      case 'whatsapp': shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
    }

    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsShareOpen(false);
  };

  const animateResponse = async (text) => {
    // Add empty bot message
    setMessages(prev => [...prev, { role: 'bot', content: '', feedback: null }]);
    
    const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters to preserve formatting
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      if (abortControllerRef.current?.signal.aborted) return;

      currentText += words[i];
      
      setMessages(prev => {
        const newArr = [...prev];
        const lastMsg = newArr[newArr.length - 1];
        if (lastMsg && lastMsg.role === 'bot') {
          lastMsg.content = currentText;
        }
        return newArr;
      });

      // Small delay for typing effect (faster for whitespace)
      const delay = words[i].trim() === '' ? 20 : 60;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const handleSend = async (e, textOverride) => {
    e?.preventDefault();
    const text = typeof textOverride === 'string' ? textOverride : input;
    if (!text.trim()) return;

    if (messages.length >= 100) {
      alert("You have reached the 100 message limit. Please start a new chat.");
      return;
    }

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height
    
    setIsTyping(true);
    abortControllerRef.current = new AbortController();

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

    // Check suggestions.json for a match
    if (!localResponse) {
      const suggestionMatch = suggestions.find(s => s.prompt.toLowerCase() === lowerInput);
      if (suggestionMatch) {
        const responses = suggestionMatch.responses;
        localResponse = responses[Math.floor(Math.random() * responses.length)];
      }
    }

    if (localResponse) {
      await animateResponse(localResponse);
      setIsTyping(false);
      abortControllerRef.current = null;
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
        , model: currentModel }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();

      if (response.ok) {
        await animateResponse(data.response);
      } else {
        const errorMessage = data.error || "I'm having trouble connecting to the cloud.";
        setMessages(prev => [...prev, { role: 'bot', content: errorMessage, feedback: null }]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Chat API Error:", error);
        setMessages(prev => [...prev, { role: 'bot', content: `Error: ${error.message || "Connection failed"}`, feedback: null }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleInputResize = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`; // Cap at 200px
    setInput(target.value);
  };

  const handleKeyDown = (e) => {
    // Desktop: Enter sends, Shift+Enter new line
    // Mobile: Enter new line (default), Send button to send
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    if (!isMobile && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <main className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${getFontSizeClass()} relative`}>
      
      {/* Sidebar Overlay (Blur Effect) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div className={`fixed top-0 left-0 w-64 md:w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-auto max-h-[90vh] md:h-full md:max-h-full rounded-b-2xl md:rounded-none overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <PanelLeft size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* User Section */}
          <div className="space-y-2">
            {currentUser ? (
              <>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                  <UserCircle size={20} /> Profile
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setIsAuthModalOpen(true); setIsSidebarOpen(false); }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2"
                >
                  <UserCircle size={20} /> Login
                </button>
              </>
            )}
          </div>

          {/* Settings Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Settings</h3>
            <div className="space-y-4">
              {/* Theme */}
              <div className="overflow-hidden rounded-lg transition-all">
                <button 
                  onClick={() => toggleSetting('theme')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Moon size={20} /> <span>Appearance</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${activeSetting === 'theme' ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeSetting === 'theme' ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mx-4 mb-2">
                    <button onClick={() => setTheme('light')} className={`flex-1 py-1.5 text-sm rounded-md transition-all ${theme === 'light' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Light</button>
                    <button onClick={() => setTheme('dark')} className={`flex-1 py-1.5 text-sm rounded-md transition-all ${theme === 'dark' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Dark</button>
                  </div>
                </div>
              </div>
              
              {/* Font Size */}
              <div className="overflow-hidden rounded-lg transition-all">
                <button 
                  onClick={() => toggleSetting('font')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Type size={20} /> <span>Font Size</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${activeSetting === 'font' ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeSetting === 'font' ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mx-4 mb-2">
                     {['small', 'medium', 'large'].map(size => (
                       <button key={size} onClick={() => setFontSize(size)} className={`flex-1 py-1.5 text-sm rounded-md capitalize transition-all ${fontSize === size ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>{size}</button>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <a 
              href="mailto:support@windveal.com"
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2"
            >
              <HelpCircle size={20} /> Contact Support
            </a>
          </div>

          {/* About */}
          <div>
            <button onClick={() => setIsAboutModalOpen(true)} className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
              <Info size={20} /> About
            </button>
          </div>

          {/* History Section (Only if logged in) */}
          {currentUser && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">History</h3>
              <div className="space-y-2">
                <button 
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <PlusCircle size={18} />
                  <span>New Chat</span>
                </button>
                
                {getHistorySummary() && (
                  <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border-l-2 border-primary pl-3 ml-1 truncate">
                    {getHistorySummary()}
                  </div>
                )}
                <button 
                  onClick={handleDeleteHistory}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Clear Chat</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {/* Mobile Footer: Logo & Version */}
          <div className="md:hidden flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <img src="/images/logo.png" alt="Logo" className="w-6 h-6 object-contain opacity-70" />
            <span className="text-sm font-medium">WindVeal V2.0</span>
          </div>

          {/* Desktop Footer: User Info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
               {currentUser ? (
                 <UserCircle size={32} className="text-gray-500 dark:text-gray-400" />
               ) : (
                 <UserCircle size={32} className="text-gray-400 dark:text-gray-500" />
               )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser ? currentUser.username : 'Guest'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Free
              </p>
            </div>
            {currentUser && (
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <header className="bg-gray-50 dark:bg-gray-900 z-10 transition-colors duration-200 relative shadow-sm md:shadow-none">
        
        {/* Mobile Header Layout (Single Row) */}
        <div className="md:hidden flex w-full justify-between items-center p-3">
          <div className="flex items-center gap-3">
            {/* Menu Drawer */}
            <button 
              className="text-primary dark:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft size={24} />
            </button>
            {/* Title after Menu */}
            <div className="relative header-model-menu-container">
              <button 
                onClick={() => setIsHeaderModelMenuOpen(!isHeaderModelMenuOpen)}
                className="flex items-center gap-1 text-lg font-bold text-primary dark:text-white"
              >
                WindVeal <ChevronDown size={16} />
              </button>
              {isHeaderModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="p-2 space-y-1">
                    {['WindVeal Mini', 'WindVeal Pro', 'WindVeal Premium'].map(model => (
                      <button key={model} onClick={() => { handleModelChange(model); setIsHeaderModelMenuOpen(false); }} className="w-full text-left flex justify-between items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
                        <span>{model}</span>
                        {currentModel === model && <Check size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 relative share-menu-container">
            {/* Share Button (Mobile) */}
            <button 
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Share"
            >
              <Upload size={20} />
            </button>

            {isShareOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                <div className="p-2 space-y-1">
                  <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Facebook size={18} className="text-blue-600" /> Facebook
                  </button>
                  <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <MessageCircle size={18} className="text-green-500" /> WhatsApp
                  </button>
                  <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Twitter size={18} className="text-sky-500" /> Twitter
                  </button>
                  <button onClick={() => handleShare('linkedin')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Linkedin size={18} className="text-blue-700" /> LinkedIn
                  </button>
                </div>
              </div>
            )}

            {/* Right: Profile Avatar */}
            <div className="relative profile-menu-container z-20">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600"
              >
                {currentUser ? (
                   <UserCircle size={24} className="text-gray-500 dark:text-gray-400" />
                 ) : (
                   <UserCircle size={24} className="text-gray-400 dark:text-gray-500" />
                 )}
              </button>

              {/* Mobile Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{currentUser ? currentUser.username : 'Guest'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Free Tier</p>
                  </div>
                  
                  <div className="p-1">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left">
                      <CreditCard size={14} />
                      Subscription
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left">
                      <Sliders size={14} />
                      Personalization
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Header Layout (Hidden on mobile) */}
        <div className="hidden md:flex justify-between items-center p-4 h-auto">
          <div className="flex items-center gap-3 z-20">
            <button 
              className="text-primary dark:text-white hover:opacity-80 transition-opacity"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft size={32} />
            </button>

            {/* Title/Model Selector (Desktop) */}
            <div className="relative header-model-menu-container">
              <button 
                onClick={() => setIsHeaderModelMenuOpen(!isHeaderModelMenuOpen)}
                className="flex items-center gap-1 text-xl font-bold text-primary dark:text-white hover:opacity-80 transition-opacity"
              >
                WindVeal <ChevronDown size={20} />
              </button>
              {isHeaderModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="p-2 space-y-1">
                    {['WindVeal Mini', 'WindVeal Pro', 'WindVeal Premium'].map(model => (
                      <button key={model} onClick={() => { handleModelChange(model); setIsHeaderModelMenuOpen(false); }} className="w-full text-left flex justify-between items-center px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
                        <span>{model}</span>
                        {currentModel === model && <Check size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative share-menu-container">
            <button 
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Share"
            >
              <Upload size={24} />
            </button>

            {isShareOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                <div className="p-2 space-y-1">
                  <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Facebook size={18} className="text-blue-600" /> Facebook
                  </button>
                  <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <MessageCircle size={18} className="text-green-500" /> WhatsApp
                  </button>
                  <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Twitter size={18} className="text-sky-500" /> Twitter
                  </button>
                  <button onClick={() => handleShare('linkedin')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Linkedin size={18} className="text-blue-700" /> LinkedIn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] opacity-80 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-primary dark:text-white mb-2">WindVeal</h2>
              <p className="text-gray-500 dark:text-gray-400">How can I help you today?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md mt-8 px-4">
                {shuffledSuggestions.map((s, i) => (
                  <button key={i} onClick={() => setInput(s.prompt)} className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left shadow-sm">
                    {s.prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg, idx) => (
              msg.role === 'user' ? (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[85%] md:max-w-[80%] p-2 md:p-3 rounded-lg bg-primary text-white rounded-br-none shadow-md">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-[90%] md:max-w-[80%] flex flex-col items-start gap-2">
                    <div className="text-gray-800 dark:text-gray-100 text-left">
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <div className="relative">
                        <button onClick={() => handleCopy(msg.content, idx)} className="hover:text-primary flex items-center gap-1" title="Copy">
                          <Copy size={16} />
                        </button>
                        {copiedMessageId === idx && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded shadow-sm whitespace-nowrap z-10 animate-in fade-in zoom-in duration-200">Copied!</span>
                        )}
                      </div>
                      <button onClick={() => handleFeedback(idx, 'up')} className="hover:text-primary" title="Good response">
                        <ThumbsUp size={16} className={msg.feedback === 'up' ? 'text-primary' : ''} />
                      </button>
                      <button onClick={() => handleFeedback(idx, 'down')} className="hover:text-red-500" title="Bad response">
                        <ThumbsDown size={16} className={msg.feedback === 'down' ? 'text-red-500' : ''} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))}
            </div>
          )}
          
          {isTyping && (
            <div className="flex justify-start mt-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="p-1 md:p-4 bg-gray-50 dark:bg-gray-900 flex flex-col gap-2 transition-colors duration-200">
        <div className="w-full max-w-3xl mx-auto flex gap-2 items-end relative">
          <div className="flex-1 min-w-0 flex flex-col gap-2 p-1 md:p-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 relative transition-all pr-2">
            
            {/* File Preview */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-600/50 rounded-xl mx-1 mt-1 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={20} className="text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-primary dark:text-blue-400">File selected</p>
                </div>
                <button type="button" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 w-full">
              {/* Plus Button & File Menu */}
              <div className="relative" ref={fileMenuRef}>
                <button 
                  type="button" 
                  onClick={() => setIsFileMenuOpen(!isFileMenuOpen)} 
                  className="p-1.5 md:p-3 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
                
                {isFileMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-4 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <button type="button" onClick={handleFileSelect} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <ImageIcon size={18} className="text-blue-500"/> Photos & Videos
                    </button>
                    <button type="button" onClick={handleFileSelect} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <FileText size={18} className="text-orange-500"/> Documents
                    </button>
                    <button type="button" onClick={handleFileSelect} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors">
                      <Music size={18} className="text-purple-500"/> Audio
                    </button>
                  </div>
                )}
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputResize}
                onKeyDown={handleKeyDown}
                placeholder="Message WindVeal..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-2 py-2 md:py-3 resize-none max-h-48 overflow-y-auto text-xs md:text-base"
              />

              {/* Send/Mic Button Inside Input */}
              {isTyping ? (
                <button type="button" onClick={handleStop} className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 p-1.5 md:p-3 rounded-full w-8 h-8 md:w-12 md:h-12 flex items-center justify-center hover:opacity-80 transition shadow-sm shrink-0">
                  <Square size={20} fill="currentColor" />
                </button>
              ) : (
                <button 
                  type={input.trim() ? "submit" : "button"} 
                  onClick={input.trim() ? undefined : handleMicClick}
                  className={`${input.trim() ? 'bg-primary text-white hover:bg-primary-dark' : isRecording ? 'bg-red-500 text-white hover:bg-red-600 animate-recording' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'} p-1.5 md:p-3 rounded-full w-8 h-8 md:w-12 md:h-12 flex items-center justify-center transition shadow-sm shrink-0`}
                >
                  {input.trim() ? <Send size={20} /> : <Mic size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] md:text-xs text-gray-400 dark:text-gray-500 px-2">WindVeal may give answers that are wrong, so confirm from trusted sources</p>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
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

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAboutModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsAboutModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <img src="/images/logo.png" alt="WindVeal Logo" className="w-20 h-20 object-contain mb-4" />
              <h2 className="text-2xl font-bold text-primary dark:text-white">WindVeal</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Version 2.0.0</p>
            </div>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-center">
              <p>
                WindVeal is a hybrid AI assistant designed to provide fast, accurate, and helpful responses. 
                It combines a local brain for quick tasks with a powerful cloud brain for complex reasoning.
              </p>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} WindVeal AI. All rights reserved.
                </p>
                <div className="mt-2 flex justify-center gap-4">
                  <a href="#" className="text-xs text-primary hover:underline">Terms of Service</a>
                  <a href="#" className="text-xs text-primary hover:underline">Privacy Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}