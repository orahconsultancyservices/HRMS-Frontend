import { Users, Check, FileText, Gift } from 'lucide-react';
import StatCard from '../common/StatCard';
import UpcomingBirthdays from '../common/UpcomingBirthdays';

const EmployerDashboard = ({ employees, leaveRequests, attendance }:any) => {
  const presentToday = attendance.filter((a:any) => a.status === 'present').length;
  const pendingLeaves = leaveRequests.filter((l:any) => l.status === 'pending').length;
  
  return (
    <div className="space-y-6">
      {/* Changed h2 to h1 - this should be the main page heading */}
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Employees" value={employees.length} color="bg-blue-500" />
        <StatCard icon={Check} label="Present Today" value={presentToday} color="bg-green-500" />
        <StatCard icon={FileText} label="Pending Leaves" value={pendingLeaves} color="bg-orange-500" />
        <StatCard icon={Gift} label="This Month Birthdays" value="3" color="bg-pink-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Changed h3 to h2 to maintain proper hierarchy */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Leave Requests</h2>
          <div className="space-y-3">
            {leaveRequests.slice(0, 3).map((leave:any) => (
              <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{leave.empName}</p>
                  {/* Changed text-gray-500 to text-gray-600 for better contrast (4.5:1 ratio) */}
                  <p className="text-gray-600 text-sm">{leave.type} Leave • {leave.days} day(s)</p>
                </div>
                {/* Changed text colors from 700 to 800 for better contrast */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  leave.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : leave.status === 'rejected' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-900'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <UpcomingBirthdays employees={employees} />
      </div>
    </div>
  );
};

export default EmployerDashboard;