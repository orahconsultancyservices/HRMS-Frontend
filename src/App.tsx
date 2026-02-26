// App.tsx
import { useState } from 'react';
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
import TaskManagement from './components/employee/TaskManagement';
import EmployerTaskManagement from './components/employer/EmployerTaskManagement';
import TeamLeadTaskManagement from './components/teamlead/TeamLeadTaskManagement';
import { demoEmployees, demoLeaveRequests, demoAttendance } from './data/demoData';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
  empName: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | '';  // underscores ✓
  hours: string;
  isOnBreak: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns attendance shaped for EmployeeDashboard:
 * employeeId is a NUMBER (matches AttendanceRecord in EmployeeDashboard.tsx)
 */
const formatAttendanceForEmployee = (
  empId: string,
  empName: string
): AttendanceRecord[] => {
  const empIdNum = parseInt(empId, 10);
  return demoAttendance
    .filter((att) => att.empId.toString() === empId)
    .map((att) => ({
      id: att.id,
      employeeId: empIdNum,
      empName,
      date: att.date,
      loginTime: att.loginTime || '',
      logoutTime: att.logoutTime || '',
      // Normalize hyphens → underscores to match EmployeeDashboard's expected type
      status: (att.status as string)
        .replace('half-day', 'half_day')
        .replace('on-leave', 'on_leave') as AttendanceRecord['status'],
      hours: att.hours || '',
      isOnBreak: false,
    }));
};

const formatLeaveRequestsForEmployee = (empId: string) => {
  return demoLeaveRequests
    .filter((leave) => leave.empId.toString() === empId)
    .map((leave) => ({
      ...leave,
      empId,
      appliedDate: leave.appliedDate || new Date().toISOString().split('T')[0],
      status: leave.status as 'pending' | 'approved' | 'rejected',
    }));
};

// ── AppContent ─────────────────────────────────────────────────────────────────

function AppContent() {
  const { data: user, isLoading: isLoadingUser, refetch } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    {
      id: 1, name: 'Casual Leave', code: 'CL',
      description: 'Casual leaves', color: '#3B82F6',
      isActive: true, createdAt: '2024-01-01',
    },
    {
      id: 2, name: 'Sick Leave', code: 'SL',
      description: 'Medical leaves', color: '#F97316',
      isActive: true, createdAt: '2024-01-01',
    },
    {
      id: 3, name: 'Earned Leave', code: 'EL',
      description: 'Privilege leaves', color: '#8B5CF6',
      isActive: true, createdAt: '2024-01-01',
    },
  ]);

  const handleLoginSuccess = () => { refetch(); };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6A82]" />
      </div>
    );
  }

if (!user) {
  return <LoginPage onLogin={handleLoginSuccess} />;
}

  const empIdString = user.empId?.toString() || '1';
  const empName = user.name;

  const employeeAttendance = formatAttendanceForEmployee(empIdString, empName);
  const employeeLeaves = formatLeaveRequestsForEmployee(empIdString);

  const dummySet = () => { };

  const currentUserForTask = {
    id: user.id || 1,
    empId: user.empId || 'EMP001',
    name: user.name,
    email: user.email || '',
    department: user.department || '',
    position: user.position || '',
    status: 'active' as const,
  };

  // The employee object passed to EmployeeDashboard and MyAttendancePage.
  // Shape must satisfy EmployeeDashboardProps['employee']:
  //   { id?: number; empId: string; name: string; employeeId?: string }
  const employeeObj = {
    id: user.id,           // number | undefined  ✓
    empId: empIdString,    // string              ✓
    name: empName,         // string              ✓
    employeeId: user.employeeId || empIdString, // string | undefined ✓
  };

  // ── Route renderer ────────────────────────────────────────────────────────

  const renderContent = () => {
    // ── EMPLOYER ────────────────────────────────────────────────────────────
    if (user.role === 'employer') {
      switch (activeTab) {
        case 'dashboard':
          return <EmployerDashboard />;
        case 'employees':
          return <EmployeesPage />;
        case 'leaves':
          return <LeavesPage leaveTypes={leaveTypes} setLeaveTypes={setLeaveTypes} />;
        case 'attendance':
          return <AttendancePage />;
        case 'birthdays':
          return <BirthdaysPage />;
        case 'tasks':
          return (
            <EmployerTaskManagement
              employees={demoEmployees.map((emp) => ({
                id: emp.id,
                empId: emp.id.toString(),
                name: emp.name,
                email: emp.email,
                department: emp.department,
                position: emp.position,
                avatar: emp.avatar,
                status: 'active' as const,
              }))}
              currentUser={currentUserForTask}
            />
          );
        default:
          return null;
      }
    }

    // ── TEAM LEAD ──────────────────────────────────────────────────────────
    if (user.role === 'teamlead') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <EmployeeDashboard
              employee={employeeObj}
              attendance={employeeAttendance}
              setAttendance={dummySet}
            />
          );
        case 'tasks':
          return (
            <TeamLeadTaskManagement
              currentUser={currentUserForTask}
            />
          );
        case 'my-leaves':
          return (
            <MyLeavesPage
              employee={employeeObj}
              leaveRequests={employeeLeaves}
              setLeaveRequests={dummySet}
            />
          );
        case 'my-attendance':
          // MyAttendancePage only needs { employee } — no attendanceRecords prop
          return <MyAttendancePage employee={employeeObj} />;
        case 'birthdays':
          return <BirthdaysPage />;
        default:
          return null;
      }
    }

    // ── EMPLOYEE (default) ─────────────────────────────────────────────────
    switch (activeTab) {
      case 'dashboard':
        return (
          <EmployeeDashboard
            employee={employeeObj}
            attendance={employeeAttendance}
            setAttendance={dummySet}
          />
        );
      case 'taskmanagement':
        return (
          <TaskManagement
            employee={employeeObj}  // ✓ matches TaskManagementProps: { employee: { empId, name, id? } }
          />
        );
      case 'my-leaves':
        return (
          <MyLeavesPage
            employee={employeeObj}
            leaveRequests={employeeLeaves}
            setLeaveRequests={dummySet}
          />
        );
      case 'my-attendance':
        // MyAttendancePage only needs { employee } — no attendanceRecords prop
        return <MyAttendancePage employee={employeeObj} />;
      case 'birthdays':
        return <BirthdaysPage />;
      default:
        return null;
    }
  };

  // Sidebar fetches its own user via useCurrentUser() internally,
  // so we only pass activeTab + setActiveTab (matches SidebarProps exactly).
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}