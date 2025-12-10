import { useState } from 'react';
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
import { demoEmployees, demoLeaveRequests, demoAttendance } from './data/demoData';

// Update User type to include empId and match component expectations
type User = {
  id: string;
  empId: string;
  name: string;
  email: string;
  role: 'employer' | 'employee';
  department?: string;
  position?: string;
}

// Type for EmployeeDashboard component
type EmployeeDashboardAttendance = {
  empId: string;
  loginTime: string;
  logoutTime: string;
  status: string;
  hours: string;
  // Optional fields from demo data
  id?: number;
  empName?: string;
  date?: string;
}

// Type for MyAttendancePage component
type MyAttendancePageAttendance = {
  empId: string;
  loginTime?: string;
  logoutTime?: string;
  status?: string;
  hours?: string;
  date?: string;
  id?: number;
  empName?: string;
}

// Type for demoLeaveRequests to match component expectations
type LeaveRequest = {
  id: number;
  empId: string;
  empName: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate?: string;
}

// Type for attendance records based on your demo data
type DemoAttendanceRecord = {
  id: number;
  empId: number;
  empName: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  status: string;
  hours: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState(demoEmployees);
  
  // Convert demo data to match expected types
  const convertedLeaveRequests: LeaveRequest[] = demoLeaveRequests.map(leave => ({
    ...leave,
    empId: leave.empId.toString(),
    status: leave.status as 'pending' | 'approved' | 'rejected'
  }));
  
  // Convert attendance data with proper null handling for EmployeeDashboard
  const convertedAttendanceForEmployeeDashboard: EmployeeDashboardAttendance[] = demoAttendance.map(att => ({
    ...att,
    empId: att.empId.toString(),
    loginTime: att.loginTime || '',
    logoutTime: att.logoutTime || '',
    status: att.status || '',
    hours: att.hours || ''
  }));
  
  // Convert attendance data for MyAttendancePage - make sure empId is string
  const convertAttendanceForMyAttendancePage = (attendance: DemoAttendanceRecord[]): MyAttendancePageAttendance[] => {
    return attendance.map(att => {
      // Create a properly formatted attendance object
      const convertedAtt: MyAttendancePageAttendance = {
        id: att.id,
        empId: att.empId.toString(), // Convert to string
        empName: att.empName,
        date: att.date,
        loginTime: att.loginTime || undefined,
        logoutTime: att.logoutTime || undefined,
        status: att.status || undefined,
        hours: att.hours || undefined
      };
      return convertedAtt;
    });
  };
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(convertedLeaveRequests);
  
  // Convert attendance data properly
  const [attendanceForEmployeeDashboard, setAttendanceForEmployeeDashboard] = useState<EmployeeDashboardAttendance[]>(convertedAttendanceForEmployeeDashboard);
  const [attendanceForMyAttendancePage, setAttendanceForMyAttendancePage] = useState<MyAttendancePageAttendance[]>(
    convertAttendanceForMyAttendancePage(demoAttendance)
  );

  // Handle login
  const handleLogin = (userData: User) => {
    setUser(userData);
    // If it's employee, we might need to filter attendance data
    if (userData.role === 'employee') {
      // Filter attendance for this specific employee
      const filteredAttendance = demoAttendance.filter(att => 
        att.empId.toString() === userData.empId
      );
      const convertedFilteredAttendance = convertAttendanceForMyAttendancePage(filteredAttendance);
      setAttendanceForMyAttendancePage(convertedFilteredAttendance);
    }
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderContent = () => {
    if (user.role === 'employer') {
      switch (activeTab) {
        case 'dashboard': 
          return <EmployerDashboard 
            employees={employees} 
            leaveRequests={leaveRequests} 
            attendance={attendanceForMyAttendancePage} 
          />;
        case 'employees': 
          return <EmployeesPage 
            employees={employees} 
            setEmployees={setEmployees} 
          />;
        case 'leaves': 
          return <LeavesPage 
            leaveRequests={leaveRequests} 
            setLeaveRequests={setLeaveRequests} 
          />;
        case 'attendance': 
          return <AttendancePage 
            attendance={attendanceForMyAttendancePage} 
          />;
        case 'birthdays': 
          return <BirthdaysPage 
            employees={employees} 
          />;
        default: return null;
      }
    } else {
      // For employee, filter their own data
      const employeeAttendance = attendanceForMyAttendancePage.filter(att => 
        att.empId === user.empId
      );
      
      const employeeLeaveRequests = leaveRequests.filter(leave => 
        leave.empId === user.empId
      );
      
      switch (activeTab) {
        case 'dashboard': 
          return <EmployeeDashboard
            employee={user} 
            attendance={attendanceForEmployeeDashboard.filter(att => att.empId === user.empId)} 
          />;
        case 'my-leaves': 
          return <MyLeavesPage 
            employee={user} 
            leaveRequests={employeeLeaveRequests} 
            setLeaveRequests={setLeaveRequests} 
          />;
        case 'my-attendance': 
          return <MyAttendancePage 
            employee={user} 
            attendance={employeeAttendance} 
            setAttendance={setAttendanceForMyAttendancePage} 
          />;
        case 'birthdays': 
          return <BirthdaysPage 
            employees={employees} 
          />;
        default: return null;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 bottom-0 z-50">
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={() => { 
            setUser(null); 
            setActiveTab('dashboard'); 
          }} 
        />
      </div>
      <main className="flex-1 ml-64 p-8 overflow-auto">{renderContent()}</main>
    </div>
  );
}