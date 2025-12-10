import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const users = {
  employer: { 
    email: 'admin@orah.com', 
    password: 'admin123', 
    role: 'employer',
    name: 'Admin User'
  },
  employee: { 
    email: 'aman@orah.com', 
    password: 'emp123', 
    role: 'employee',
    name: 'Aman Hussain',
    empId: 'EMP001'
  }
};

const LoginPage = ({ onLogin }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for saved session on component mount
useEffect(() => {
  const savedSession = localStorage.getItem('hrms_session');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      onLogin(session);
    } catch (error) {
      localStorage.removeItem('hrms_session');
    }
  }
  
  const rememberedEmail = localStorage.getItem('remembered_email');
  if (rememberedEmail) {
    setEmail(rememberedEmail);
    setRememberMe(true);
  }
}, [onLogin]);

  const handleLogin = () => {
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      let user = null;
      
      if (email === users.employer.email && password === users.employer.password) {
        user = users.employer;
      } else if (email === users.employee.email && password === users.employee.password) {
        user = users.employee;
      }

      if (user) {
  const sessionData = {
    ...user,
    loginTime: new Date().toISOString(),
  };
  
  // Use ONLY localStorage for persistence
  localStorage.setItem('hrms_session', JSON.stringify(sessionData));
  
  if (rememberMe) {
    localStorage.setItem('remembered_email', email);
  } else {
    localStorage.removeItem('remembered_email');
  }
  
  onLogin(user);
} else {
        setError('Invalid email or password');
        sessionStorage.removeItem('hrms_session');
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleClearSession = () => {
    sessionStorage.removeItem('hrms_session');
    sessionStorage.removeItem('remembered_email');
    setEmail('');
    setPassword('');
    setError('Session cleared. Please login again.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-[#6B8DA2] via-[#7A9DB2] to-[#F5A42C] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-20 h-20 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <span className="text-4xl font-bold text-white">O</span>
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] bg-clip-text text-transparent">
            ORAH HRMS
          </h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </motion.div>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B8DA2] focus:border-transparent transition-all"
              placeholder="Enter email" 
            />
          </div>
          
          <div>
            <label className="text-gray-700 text-sm font-medium">Password</label>
            <div className="relative mt-1">
              <input 
                type={showPassword ? "text" : "password"}
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B8DA2] focus:border-transparent transition-all"
                placeholder="Enter password" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6B8DA2] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-50 border border-gray-300 text-[#6B8DA2] focus:ring-[#6B8DA2]"
              />
              <span className="ml-2 text-gray-600 text-sm">Remember me</span>
            </label>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearSession}
              className="text-gray-500 text-sm hover:text-[#6B8DA2] transition-colors cursor-pointer"
            >
              Clear Session
            </motion.button>
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200"
            >
              {error}
            </motion.p>
          )}
          
          <motion.button 
            onClick={handleLogin}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full cursor-pointer py-3 bg-gradient-to-r from-[#6B8DA2] to-[#F5A42C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
              />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </span>
            )}
            
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.button>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-gradient-to-r from-[#6B8DA2]/10 to-[#F5A42C]/10 rounded-lg border border-[#6B8DA2]/20"
        >
          <p className="text-gray-600 text-xs mb-2 font-semibold">Demo Credentials:</p>
          <div className="space-y-1">
            <p className="text-gray-700 text-xs">
              <span className="text-[#6B8DA2] font-semibold">Employer:</span> admin@orah.com / admin123
            </p>
            <p className="text-gray-700 text-xs">
              <span className="text-[#F5A42C] font-semibold">Employee:</span> aman@orah.com / emp123
            </p>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-gray-500 text-xs">
              Session will be saved until logout
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;