import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Gift, LogOut, Home,
  FileText, ChevronRight, BookCheck, Target
} from 'lucide-react';
import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  const employerTabs = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'employees', icon: Users, label: 'Employees' },
    { id: 'tasks', icon: Target, label: 'Task Management' },
    { id: 'leaves', icon: FileText, label: 'Leave Requests' },
    { id: 'attendance', icon: Clock, label: 'Attendance' },
    { id: 'birthdays', icon: Gift, label: 'Birthdays' },
  ];

  const employeeTabs = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'my-leaves', icon: FileText, label: 'My Leaves' },
    { id: 'my-attendance', icon: Clock, label: 'My Attendance' },
    { id: 'taskmanagement', icon: BookCheck, label: 'Task Management' },
    { id: 'birthdays', icon: Gift, label: 'Birthdays' },
  ];

  const tabs = user?.role === 'employer' ? employerTabs : employeeTabs;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // After logout, force a reload to go back to login page
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state
  if (isLoading || !user) {
    return (
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 bg-gradient-to-b from-[#2C3E50] via-[#34495E] to-[#1A252F] min-h-screen p-4 flex items-center justify-center"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
      className="w-64 bg-gradient-to-b from-[#2C3E50] via-[#34495E] to-[#1A252F] min-h-screen p-4 flex flex-col shadow-2xl"
    >
      {/* Logo Section */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 mb-8 px-2"
      >
        <motion.div
          whileHover={{ rotate: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6B8DA2]/20 to-[#F5A42C]/20 backdrop-blur-sm flex items-center justify-center p-2 shadow-lg border border-white/10"
        >
          <img src={logo} alt="Logo" className='w-full h-full object-contain' />
        </motion.div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-2xl tracking-tight">
            OCS
          </span>
          <span className="text-xs text-gray-400 font-medium">HR Management</span>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-1">
        <AnimatePresence>
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{
                  x: 5,
                  backgroundColor: isActive ? 'rgba(245, 164, 44, 0.9)' : 'rgba(107, 141, 162, 0.2)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-[#6B8DA2] to-[#6B8DA2] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {/* Icon with animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    rotate: isActive ? 0 : 0
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <tab.icon className="w-5 h-5" />
                </motion.div>

                {/* Label */}
                <span className="font-medium whitespace-nowrap">{tab.label}</span>

                {/* Active chevron */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* User Profile & Logout */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t border-gray-700/50 pt-4 mt-4"
      >
        {/* User Profile */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
          className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 bg-gradient-to-br from-[#6B8DA2] to-[#F5A42C] rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg"
          >
            {user.avatar || user.name.split(' ').map((n: string) => n[0]).join('')}
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <motion.p
              whileHover={{ x: 2 }}
              className="text-gray-400 text-xs capitalize bg-gray-800/50 px-2 py-1 rounded inline-block"
            >
              {user.role}
            </motion.p>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{
            x: 5,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="group w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50"
        >
          {logoutMutation.isPending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span className="font-medium">
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;