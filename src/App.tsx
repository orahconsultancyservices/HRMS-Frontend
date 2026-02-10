// App.tsx
import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { useCurrentUser } from './hooks/useAuth';
import LoginPage from './components/common/LoginPage';
import Sidebar from './components/common/Sidebar';
import EmployerDashboard from './components/employer/EmployerDashboard';
import EmployeesPage from './components/employer/EmployeesPage';
import LeavesPage from './components/employer/LeavesPage';
import AttendancePage from './components/employer/AttendancePage';
import BirthdaysPage from './components/employer/BirthdaysPage';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import MyLeavesPage from './components/employee/MyLeavesPage';
import MyAttendancePage from './components/employee/MyAttendancePage';
import AttendanceDebugger from './components/employee/AttendanceDebugger';
import TaskManagement from './components/employee/TaskManagement';
import EmployerTaskManagement from './components/employer/EmployerTaskManagement';

// Import demo data
import { demoEmployees, demoLeaveRequests, demoAttendance } from './data/demoData';

// Leave types state
interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

function AppContent() {
  const { data: user, isLoading: isLoadingUser, refetch } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Leave types state
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    { id: 1, name: 'Casual Leave', code: 'CL', description: 'Casual leaves for personal work', color: '#3B82F6', isActive: true, createdAt: '2024-01-01' },
    { id: 2, name: 'Sick Leave', code: 'SL', description: 'Medical leaves for illness', color: '#F97316', isActive: true, createdAt: '2024-01-01' },
    { id: 3, name: 'Earned Leave', code: 'EL', description: 'Privilege leaves earned over time', color: '#8B5CF6', isActive: true, createdAt: '2024-01-01' },
  ]);

  // Handle login success
  const handleLoginSuccess = () => {
    // Refetch current user data after login
    refetch();
  };

  // Show loading state while checking session
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6B8DA2] via-[#7A9DB2] to-[#F5A42C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show login if no user
  if (!user) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  // Use demo data for now
  const employeesForEmployeesPage = demoEmployees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    orgEmail: `${emp.name.toLowerCase().replace(/\s+/g, '.')}@orahhrms.com`,
    orgPassword: 'password123',
    phone: emp.phone,
    department: emp.department,
    position: emp.position,
    joinDate: emp.joinDate,
    avatar: emp.avatar,
    location: emp.location || '',
    emergencyContact: emp.emergencyContact || '',
    leaveBalance: emp.leaveBalance
  }));

  const leaveRequestsForLeavesPage = demoLeaveRequests.map(leave => ({
    ...leave,
    appliedDate: leave.appliedDate || new Date().toISOString().split('T')[0],
    status: leave.status as 'pending' | 'approved' | 'rejected'
  }));

  const attendanceForAttendancePage = demoAttendance.map(att => ({
    id: att.id,
    empId: att.empId,
    empName: att.empName,
    date: att.date,
    loginTime: att.loginTime || null,
    logoutTime: att.logoutTime || null,
    status: (att.status as 'present' | 'absent' | 'late' | 'half-day' | 'on-leave') || 'present',
    hours: att.hours
  }));

  // Extract unique departments and positions from demo data
  const uniqueDepartments = Array.from(new Set(demoEmployees
    .filter(emp => emp.department)
    .map(emp => emp.department))) as string[];

  const uniquePositions = Array.from(new Set(demoEmployees
    .filter(emp => emp.position)
    .map(emp => emp.position))) as string[];

  // For employee data (filtered by current user)
  const employeeAttendance = attendanceForAttendancePage.filter(att =>
    att.empId.toString() === user.empId
  );

  const employeeLeaveRequests = leaveRequestsForLeavesPage.filter(leave =>
    leave.empId.toString() === user.empId
  );

  // Dummy setter functions
  const dummySetEmployees = () => {
    console.log('Employee operations would be handled here');
  };

  const dummySetLeaveRequests = () => {
    console.log('Leave operations would be handled here');
  };

  const dummySetAttendance = () => {
    console.log('Attendance operations would be handled here');
  };

  // Format employees for employer task management
  const employeesForTaskManagement = employeesForEmployeesPage.map(emp => ({
    id: emp.id,
    empId: emp.id.toString(),
    name: emp.name,
    email: emp.email,
    department: emp.department,
    position: emp.position,
    avatar: emp.avatar,
    status: 'active' as const
  }));

  const renderContent = () => {
    if (user.role === 'employer') {
      switch (activeTab) {
        case 'dashboard':
          return <EmployerDashboard
            employee={{
              empId: user.id?.toString() || '1',
              name: user.name,
              employeeId: user.empId || user.employeeId || 'EMP001'
            }}
            attendance={employeeAttendance.map(att => ({
              id: att.id,
              empId: user.empId,
              empName: user.name,
              date: att.date,
              loginTime: att.loginTime || '',
              logoutTime: att.logoutTime || '',
              status: att.status,
              hours: att.hours || '',
              isOnBreak: false
            }))}
            setAttendance={dummySetAttendance}
          />;
        case 'employees':
          return <EmployeesPage />;

        case 'leaves':
          return <LeavesPage
            leaveTypes={leaveTypes}
            setLeaveTypes={setLeaveTypes}
          />;
        case 'attendance':
          return <AttendancePage />;
        case 'birthdays':
          return <BirthdaysPage />;
        case 'tasks':
          return <EmployerTaskManagement
            employees={employeesForTaskManagement}
            currentUser={{
              id: user.id || 1,
              empId: user.empId || 'EMP001',
              name: user.name,
              email: user.email || 'employer@orahhrms.com',
              department: 'Management',
              position: 'Employer',
              status: 'active'
            }}
          />;
        default: return null;
      }
    } else {
      // Employee view
      switch (activeTab) {
        case 'dashboard':
          return <EmployeeDashboard
            employee={user}
            attendance={employeeAttendance.map(att => ({
              id: att.id,
              empId: user.empId,
              empName: user.name,
              date: att.date,
              loginTime: att.loginTime || '',
              logoutTime: att.logoutTime || '',
              status: att.status,
              hours: att.hours || '',
              isOnBreak: false
            }))}
            setAttendance={dummySetAttendance}
          />;
        case 'my-leaves':
          return <MyLeavesPage
            employee={{
              ...user,
              empId: user.empId,
              id: user.id
            }}
            leaveRequests={employeeLeaveRequests}
            setLeaveRequests={dummySetLeaveRequests}
          />;
        case 'my-attendance':
          return <MyAttendancePage
            employee={user}
            attendance={employeeAttendance.map(att => ({
              id: att.id,
              empId: user.empId,
              empName: user.name,
              date: att.date,
              loginTime: att.loginTime || undefined,
              logoutTime: att.logoutTime || undefined,
              status: att.status || undefined,
              hours: att.hours || undefined
            }))}
            setAttendance={dummySetAttendance}
          />;
        case 'taskmanagement':
          return <TaskManagement
            employee={{
              empId: user.empId,
              name: user.name,
              id: user.id
            }}
          />;
        case 'birthdays':
          return <BirthdaysPage />;
        default: return null;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 bottom-0 z-50">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={user.role}
        />
      </div>
      <main className="flex-1 ml-64 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}