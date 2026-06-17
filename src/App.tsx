// App.tsx — URL-based routing via react-router-dom
import React from 'react';
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom';
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
import UniversalTaskManagement from './components/tasks/UniversalTaskManagement';
import { demoLeaveRequests, demoAttendance } from './data/demoData';
import SalesDashboard from './components/sales/SalesDashboard';
import PerformanceLocking from './components/management/PerformanceLocking';
import TargetAdjustment from './components/teamlead/TargetAdjustment';
import OrganizationManagement from './components/management/OrganizationManagement';
import DepartmentDetailPage from './components/management/DepartmentDetailPage';
import SettingsPage from './components/management/SettingsPage';
import HRDashboard from './components/hr/HRDashboard';
import AnalyticsDashboard from './components/employer/AnalyticsDashboard';

// ─── Route map (tab-id → URL path) ───────────────────────────────────────────
// Convention: "dashboard" lives at "/" so the root URL always shows the dashboard.
// Every other tab id maps to "/<id>".

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
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | '';
  hours: string;
  isOnBreak: boolean;
}

const formatAttendanceForEmployee = (empId: string, empName: string): AttendanceRecord[] => {
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

// ─── AppContent — renders layout + page driven by current URL ────────────────

function AppContent() {
  const { data: user, isLoading: isLoadingUser, refetch } = useCurrentUser();
  const location = useLocation();

  // "/" → "dashboard", "/employees" → "employees", etc.
  const activeTab =
    location.pathname === '/' ? 'dashboard' : location.pathname.replace(/^\//, '');

  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([
    { id: 1, name: 'Casual Leave',  code: 'CL', description: 'Casual leaves',  color: '#3B82F6', isActive: true, createdAt: '2024-01-01' },
    { id: 2, name: 'Sick Leave',    code: 'SL', description: 'Medical leaves', color: '#F97316', isActive: true, createdAt: '2024-01-01' },
    { id: 3, name: 'Earned Leave',  code: 'EL', description: 'Privilege leaves', color: '#8B5CF6', isActive: true, createdAt: '2024-01-01' },
  ]);

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6A82]" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={() => refetch()} />;
  }

  const empIdString = user.empId?.toString() || '1';
  const empName = user.name;
  const employeeAttendance = formatAttendanceForEmployee(empIdString, empName);
  const employeeLeaves     = formatLeaveRequestsForEmployee(empIdString);
  const dummySet = () => {};

  const currentUserForTask = {
    id: user.id || 1,
    empId: user.empId || 'EMP001',
    employeeId: user.employeeId || user.empId || 'EMP001',
    name: user.name,
    email: user.email || '',
    department: user.department || '',
    departmentId: user.departmentId,
    position: user.position || '',
    role: user.role,
    reportTo: user.reportTo,
    managesDepartment: user.managesDepartment,
    accessPermissions: user.accessPermissions || [],
    status: 'active' as const,
  };

  const employeeObj = {
    id: user.id,
    empId: empIdString,
    name: empName,
    employeeId: user.employeeId || empIdString,
  };

  // ── Page component resolved from URL tab + role ──────────────────────────
  const renderContent = () => {

    // ── EMPLOYER (Admin) ────────────────────────────────────────────────────
    if (user.role === 'employer') {
      switch (activeTab) {
        case 'dashboard':    return <EmployerDashboard />;
        case 'employees':    return <EmployeesPage />;
        case 'leaves':       return <LeavesPage leaveTypes={leaveTypes} setLeaveTypes={setLeaveTypes} />;
        case 'attendance':   return <AttendancePage />;
        case 'birthdays':    return <BirthdaysPage />;
        case 'tasks':        return <UniversalTaskManagement currentUser={currentUserForTask} />;
        case 'analytics':    return <AnalyticsDashboard />;
        case 'sales':
          return (
            <SalesDashboard
              currentUser={{
                id: user.id,
                empId: user.employeeId ?? user.empId ?? `EMP${user.id}`,
                name: user.name,
                department: user.department ?? '',
                position: user.position ?? '',
                role: 'employer',
              }}
            />
          );
        case 'locking':
          return <PerformanceLocking currentUser={{ id: user.id, name: user.name, role: 'employer' }} />;
        case 'organization': return <OrganizationManagement />;
        case 'settings':     return <SettingsPage />;
        default: {
          const deptMatch = activeTab.match(/^organization\/dept\/(\d+)$/);
          if (deptMatch) return <DepartmentDetailPage deptId={parseInt(deptMatch[1], 10)} />;
          return null;
        }
      }
    }

    // ── HR ──────────────────────────────────────────────────────────────────
    if (user.role === 'hr') {
      switch (activeTab) {
        case 'dashboard':  return <HRDashboard />;
        case 'employees':  return <EmployeesPage />;
        case 'analytics':  return <AnalyticsDashboard currentUser={{ id: user.id, name: user.name, role: 'hr', department: user.department }} />;
        case 'attendance': return <AttendancePage />;
        case 'leaves':     return <LeavesPage leaveTypes={leaveTypes} setLeaveTypes={setLeaveTypes} />;
        case 'birthdays':  return <BirthdaysPage />;
        default: return null;
      }
    }

    // ── MANAGER ─────────────────────────────────────────────────────────────
    if (user.role === 'manager') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <EmployeeDashboard
              employee={employeeObj}
              attendance={employeeAttendance}
              setAttendance={dummySet}
            />
          );
        case 'tasks':        return <UniversalTaskManagement currentUser={currentUserForTask} />;
        case 'analytics':    return <AnalyticsDashboard currentUser={{ id: user.id, name: user.name, role: 'manager', department: user.department }} />;
        case 'employees':    return <EmployeesPage />;
        case 'leaves':       return <LeavesPage leaveTypes={leaveTypes} setLeaveTypes={setLeaveTypes} />;
        case 'attendance':   return <AttendancePage />;
        case 'locking':
          return <PerformanceLocking currentUser={{ id: user.id, name: user.name, role: 'employer' }} />;
        case 'my-leaves':
          return (
            <MyLeavesPage
              employee={employeeObj}
              leaveRequests={employeeLeaves}
              setLeaveRequests={dummySet}
            />
          );
        case 'my-attendance': return <MyAttendancePage employee={employeeObj} />;
        case 'birthdays':    return <BirthdaysPage />;
        default: return null;
      }
    }

    // ── TEAM LEAD ───────────────────────────────────────────────────────────
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
        case 'my-team':        return <EmployeesPage />;
        case 'tasks':          return <UniversalTaskManagement currentUser={currentUserForTask} />;
        case 'analytics':      return <AnalyticsDashboard currentUser={{ id: user.id, name: user.name, role: 'teamlead', department: user.department }} />;
        case 'my-leaves':
          return (
            <MyLeavesPage
              employee={employeeObj}
              leaveRequests={employeeLeaves}
              setLeaveRequests={dummySet}
            />
          );
        case 'adjust-targets':
          return <TargetAdjustment currentUser={{ id: user.id, name: user.name, role: 'teamlead' }} />;
        case 'my-attendance':  return <MyAttendancePage employee={employeeObj} />;
        case 'birthdays':      return <BirthdaysPage />;
        default: return null;
      }
    }

    // ── EMPLOYEE (default) ──────────────────────────────────────────────────
    switch (activeTab) {
      case 'dashboard':
        return (
          <EmployeeDashboard
            employee={employeeObj}
            attendance={employeeAttendance}
            setAttendance={dummySet}
          />
        );
      case 'taskmanagement': return <TaskManagement employee={employeeObj} />;
      case 'my-leaves':
        return (
          <MyLeavesPage
            employee={employeeObj}
            leaveRequests={employeeLeaves}
            setLeaveRequests={dummySet}
          />
        );
      case 'my-attendance': return <MyAttendancePage employee={employeeObj} />;
      case 'birthdays':     return <BirthdaysPage />;
      default: return null;
    }
  };

  const page = renderContent();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Unknown route → redirect to dashboard */}
        {page ?? <Navigate to="/" replace />}
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
