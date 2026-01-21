'use client';
import { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isRegisterMode && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    // Note: These endpoints need to be created in app/api/auth/
    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.user || { username: formData.username });
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isRegisterMode ? 'Join WindVeal today' : 'Please log in to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">{error}</div>}

            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input name="username" type="text" placeholder="Username" required value={formData.username} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>

            {isRegisterMode && (
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input name="email" type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {isRegisterMode && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input name="confirmPassword" type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading && <Loader2 size={20} className="animate-spin" />}
              {isRegisterMode ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }} className="text-primary font-semibold hover:underline">
              {isRegisterMode ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}