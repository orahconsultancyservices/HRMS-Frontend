import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  loading?: boolean;
  trend?: number;
  description?: string;
  onClick?: () => void;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  loading = false, 
  trend, 
  description,
  onClick 
}: StatCardProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Animate value counting up
  useEffect(() => {
    if (typeof value === 'number' && !loading) {
      const duration = 1000; // 1 second
      const step = 20; // update every 20ms
      const totalSteps = duration / step;
      const increment = Number(value) / totalSteps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= Number(value)) {
          setAnimatedValue(Number(value));
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, step);
      
      return () => clearInterval(timer);
    } else {
      setAnimatedValue(typeof value === 'number' ? value : 0);
    }
  }, [value, loading]);

  // Format trend indicator
  const getTrendIndicator = () => {
    if (trend === undefined) return null;
    
    const isPositive = trend >= 0;
    const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
    
    return (
      <div className={`${bgColor} px-2 py-1 rounded-lg inline-flex items-center gap-1 mt-2`}>
        {isPositive ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        <span className={`text-xs font-medium ${trendColor}`}>
          {Math.abs(trend)}%
        </span>
      </div>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className={`
        bg-white rounded-xl p-6 shadow-sm border border-gray-100 
        hover:shadow-md transition-all cursor-pointer relative
        ${onClick ? 'hover:border-gray-300 active:scale-95' : ''}
        overflow-hidden
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/0 hover:to-gray-50/30 transition-opacity pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800">
            {typeof value === 'number' ? animatedValue.toLocaleString() : value}
          </p>
          
          {/* Trend indicator */}
          {trend !== undefined && getTrendIndicator()}
          
          {/* Optional description */}
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
        
        {/* Icon with gradient background */}
        <div className="relative">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          {/* Optional pulse effect for important stats */}
          {typeof value === 'number' && value > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-red-500 animate-ping opacity-75"></div>
          )}
        </div>
      </div>
      
      {/* Optional bottom border highlight */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color} rounded-b-xl opacity-0 hover:opacity-100 transition-opacity`} />
    </motion.div>
  );
};

export default StatCard;