'use client';
import { useState, useEffect, useRef } from 'react';
import { evaluate } from 'mathjs';
import { UserCircle, LogOut, PlusCircle, Trash2, Menu, X, Copy, ThumbsUp, ThumbsDown, MoreVertical, Check, Plus, Image as ImageIcon, FileText, Music, Video, Square, Mic, Share2, Moon, Sun, Type, Facebook, Twitter, Linkedin, MessageCircle, HelpCircle, ChevronDown, Bell, Volume2, Info } from 'lucide-react';
import intents from '../data/intents.json';
import AuthModal from '../components/AuthModal';
import Settings from '../components/Settings';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am WindVeal. How can I help you today?', feedback: null }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const fileMenuRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [openModelMenu, setOpenModelMenu] = useState(null);
  const [currentModel, setCurrentModel] = useState('gemini');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle click outside for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setIsFileMenuOpen(false);
      }
      if (openModelMenu !== null && !event.target.closest('.model-menu-container')) {
        setOpenModelMenu(null);
      }
      if (isShareOpen && !event.target.closest('.share-menu-container')) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openModelMenu]);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    setFontSize(savedSize);
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    const savedSound = localStorage.getItem('sound');
    if (savedSound !== null) setSound(savedSound === 'true');
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

  useEffect(() => {
    localStorage.setItem('notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sound', sound);
  }, [sound]);

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
        setMessages(data.history.map(m => ({ ...m, feedback: m.feedback || null })));
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: `Welcome back, ${user.username}!`, feedback: null }]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setMessages(prev => [...prev, { role: 'bot', content: `Welcome back, ${user.username}!`, feedback: null }]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMessages(prev => [...prev, { role: 'bot', content: "You have been logged out.", feedback: null }]);
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
      { role: 'bot', content: 'Hello! I am WindVeal. How can I help you today?', feedback: null }
    ]);
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
    setOpenModelMenu(null); // Close menu after selection
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
      const delay = words[i].trim() === '' ? 5 : 30;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    if (messages.length >= 100) {
      alert("You have reached the 100 message limit. Please start a new chat.");
      return;
    }

    const userMsg = { role: 'user', content: input };
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
        }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();

      if (response.ok) {
        await animateResponse(data.response);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting to the cloud.", feedback: null }]);
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
      <div className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl text-primary dark:text-white">WindVeal</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
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

              {/* Notifications */}
              <div className="overflow-hidden rounded-lg transition-all">
                <button 
                  onClick={() => toggleSetting('notifications')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bell size={20} /> <span>Notifications</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${activeSetting === 'notifications' ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeSetting === 'notifications' ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mx-4 mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable Notifications</span>
                    <button onClick={() => setNotifications(!notifications)} className={`w-10 h-5 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-gray-400'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${notifications ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sound */}
              <div className="overflow-hidden rounded-lg transition-all">
                <button 
                  onClick={() => toggleSetting('sound')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Volume2 size={20} /> <span>Sound</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${activeSetting === 'sound' ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeSetting === 'sound' ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mx-4 mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable Sound Effects</span>
                    <button onClick={() => setSound(!sound)} className={`w-10 h-5 rounded-full transition-colors relative ${sound ? 'bg-primary' : 'bg-gray-400'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${sound ? 'left-6' : 'left-1'}`} />
                    </button>
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
          <div className="flex items-center gap-3">
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

      <header className="bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          {/* Logo / Hamburger Toggle */}
          <div 
            className="relative w-10 h-10 cursor-pointer group z-20"
            onClick={() => setIsSidebarOpen(true)}
          >
            {/* Logo Image (Visible by default, hidden on hover) */}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-100 group-hover:opacity-0">
               <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            {/* Hamburger Icon (Hidden by default, visible on hover) */}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100 text-primary dark:text-white">
              <Menu size={32} />
            </div>
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-4 relative share-menu-container">
          <h1 className="text-xl font-bold text-primary dark:text-white">WindVeal</h1>
          <button 
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors"
            title="Share"
          >
            <Share2 size={24} />
          </button>

          {/* Share Modal/Dropdown */}
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
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {messages.map((msg, idx) => (
              msg.role === 'user' ? (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[80%] p-3 rounded-lg bg-primary text-white rounded-br-none shadow-md">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-[80%] flex flex-col items-start gap-2">
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
                      <div className="relative model-menu-container">
                        <button onClick={() => setOpenModelMenu(openModelMenu === idx ? null : idx)} className="hover:text-primary" title="Change model">
                          <MoreVertical size={16} />
                        </button>
                        {openModelMenu === idx && (
                          <div className={`absolute ${idx < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-10 p-2`}>
                            <p className="text-xs text-gray-400 px-2 pb-1">MODELS</p>
                            <ul>
                              {['gemini', 'chatGPT', 'deepseek', 'grok'].map(model => (
                                <li key={model}>
                                  <button 
                                    onClick={() => handleModelChange(model)}
                                    className="w-full text-left flex justify-between items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                                  >
                                    <span className="capitalize">{model}</span>
                                    {currentModel === model && <Check size={16} className="text-primary" />}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
          
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

      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2 transition-colors duration-200">
        <div className="w-full max-w-3xl mx-auto flex gap-2 items-end relative">
          <div className="flex-1 flex flex-col gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 relative transition-all">
            
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
              <div className="relative pb-1" ref={fileMenuRef}>
                <button 
                  type="button" 
                  onClick={() => setIsFileMenuOpen(!isFileMenuOpen)} 
                  className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
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
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-2 py-2 resize-none max-h-48 overflow-y-auto"
              />
            </div>
          </div>
          
          <button type="button" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition shadow-md shrink-0 mb-1">
            <Mic size={20} />
          </button>
          
          {isTyping ? (
            <button type="button" onClick={handleStop} className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 p-3 rounded-full w-12 h-12 flex items-center justify-center hover:opacity-80 transition shadow-md shrink-0 mb-1">
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button type="submit" className="bg-primary text-white p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-primary-dark transition shadow-md shrink-0 mb-1">
              <span>&uarr;</span>
            </button>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">WindVeal may give answers that are wrong, so confirm from trusted sources</p>
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