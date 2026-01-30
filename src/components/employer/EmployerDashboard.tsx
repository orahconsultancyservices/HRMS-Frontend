import { useState, useEffect } from 'react';
import { Users, Check, FileText, Gift } from 'lucide-react';
import StatCard from '../common/StatCard';
import UpcomingBirthdays from '../common/UpcomingBirthdays';
import { employeeApi, leaveApi, attendanceApi } from '../../services/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  isActive: boolean;
  avatar?: string;
  birthday?: string;
}

interface LeaveRequest {
  id: string;
  empId: string;
  empName: string;
  type: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  from: string;
  to: string;
}

interface Attendance {
  id: string;
  empId: string;
  empName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  checkIn?: string;
  checkOut?: string;
}

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  thisMonthBirthdays: number;
}

const EmployerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    thisMonthBirthdays: 0
  });
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    employees: true,
    leaves: true
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch all data for dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading({ stats: true, employees: true, leaves: true });
        
        // Fetch all data in parallel
        const [employeesRes, leavesRes, attendanceRes] = await Promise.all([
          employeeApi.getAll(),
          leaveApi.getAll(),
          attendanceApi.getAll({ date: new Date().toISOString().split('T')[0] })
        ]);

        // Process employees data
        const employeesData = employeesRes.data.data || employeesRes.data;
        const activeEmployees = Array.isArray(employeesData) 
          ? employeesData.filter((emp: any) => emp.isActive !== false)
          : [];
        
        setEmployees(activeEmployees.map((emp: any) => ({
          id: emp.id.toString(),
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          isActive: emp.isActive,
          avatar: emp.avatar || `${emp.firstName?.charAt(0)}${emp.lastName?.charAt(0)}`,
          birthday: emp.birthday
        })));

        // Process leave requests
        const leavesData = leavesRes.data.data || leavesRes.data;
        const pendingLeavesData = Array.isArray(leavesData)
          ? leavesData.filter((leave: any) => leave.status === 'pending')
          : [];
        
        const formattedLeaves = leavesData.map((leave: any) => ({
          id: leave.id.toString(),
          empId: leave.empId?.toString() || leave.employeeId?.toString(),
          empName: leave.employee?.name || `${leave.employee?.firstName} ${leave.employee?.lastName}` || 'Unknown',
          type: leave.type,
          days: leave.days,
          status: leave.status,
          from: leave.from,
          to: leave.to
        }));
        
        setLeaveRequests(formattedLeaves);
        setRecentLeaves(formattedLeaves.slice(0, 3));

        // Calculate stats
        const presentToday = attendanceRes.data.data 
          ? attendanceRes.data.data.filter((att: any) => att.status === 'present').length
          : 0;

        // Calculate birthdays this month
        const currentMonth = new Date().getMonth();
        const birthdaysThisMonth = activeEmployees.filter((emp: any) => {
          if (!emp.birthday) return false;
          const birthDate = new Date(emp.birthday);
          return birthDate.getMonth() === currentMonth;
        }).length;

        setStats({
          totalEmployees: activeEmployees.length,
          presentToday,
          pendingLeaves: pendingLeavesData.length,
          thisMonthBirthdays: birthdaysThisMonth
        });

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading({ stats: false, employees: false, leaves: false });
      }
    };

    fetchDashboardData();
  }, []);

  // Refresh function
  const refreshData = () => {
    setError(null);
    setLoading({ stats: true, employees: true, leaves: true });
    fetchDashboardData();
  };

  // Loading state
  if (loading.stats || loading.employees || loading.leaves) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-[#4A6A82] text-white rounded-lg hover:bg-[#5A7A8F] transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          label="Total Employees" 
          value={stats.totalEmployees} 
          color="bg-blue-500" 
          loading={loading.stats}
        />
        <StatCard 
          icon={Check} 
          label="Present Today" 
          value={stats.presentToday} 
          color="bg-green-500" 
          loading={loading.stats}
        />
        <StatCard 
          icon={FileText} 
          label="Pending Leaves" 
          value={stats.pendingLeaves} 
          color="bg-orange-500" 
          loading={loading.stats}
        />
        <StatCard 
          icon={Gift} 
          label="This Month Birthdays" 
          value={stats.thisMonthBirthdays} 
          color="bg-pink-500" 
          loading={loading.stats}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Leave Requests</h2>
            <span className="text-sm text-gray-600">
              {leaveRequests.length} total
            </span>
          </div>
          
          {recentLeaves.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No leave requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{leave.empName}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{leave.type}</span>
                      <span>•</span>
                      <span>{leave.days} day(s)</span>
                      <span>•</span>
                      <span className="text-xs">
                        {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                    leave.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : leave.status === 'rejected' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-900'
                  }`}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </span>
                </div>
              ))}
              
              {leaveRequests.length > 3 && (
                <div className="pt-3 border-t border-gray-200">
                  <a 
                    href="/#/leaves" // Update with your routing
                    className="text-[#4A6A82] hover:text-[#5A7A8F] text-sm font-medium flex items-center justify-center gap-1"
                  >
                    View all {leaveRequests.length} requests
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        <UpcomingBirthdays employees={employees} />
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Department Distribution</h2>
          {employees.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(
                employees.reduce((acc: Record<string, number>, emp) => {
                  acc[emp.department] = (acc[emp.department] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-gray-700">{dept}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#4A6A82] rounded-full"
                          style={{ width: `${(count / employees.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-800 font-medium">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No department data available</p>
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Today</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              <div className="text-sm text-green-800">Present</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {Math.max(0, stats.totalEmployees - stats.presentToday)}
              </div>
              <div className="text-sm text-red-800">Absent</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-yellow-800">Late</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {leaveRequests.filter(l => l.status === 'approved').length}
              </div>
              <div className="text-sm text-blue-800">On Leave</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;