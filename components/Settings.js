'use client';
import { X, Moon, Sun, Type, Bell, Volume2 } from 'lucide-react';

export default function Settings({ isOpen, onClose, theme, setTheme, fontSize, setFontSize }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            Settings
          </h2>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span className="font-medium">Theme</span>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    theme === 'light' 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <Type size={20} />
                <span className="font-medium">Font Size</span>
              </div>
              <select 
                value={fontSize} 
                onChange={(e) => setFontSize(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Notifications (Placeholder) */}
            <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <Bell size={20} />
                <span className="font-medium">Notifications</span>
              </div>
              <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>

             {/* Sound (Placeholder) */}
             <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <Volume2 size={20} />
                <span className="font-medium">Sound Effects</span>
              </div>
              <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>

          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button onClick={onClose} className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}