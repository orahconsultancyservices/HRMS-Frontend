import { useState, useEffect } from 'react';
import { Bug, User, Database, RefreshCw } from 'lucide-react';

const AttendanceDebugger = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceByEmployee, setAttendanceByEmployee] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadCurrentUser();
    loadEmployees();
  }, []);

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      console.log('Current logged in user:', user);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);
      const data = await response.json();
      setEmployees(data.data || []);
      
      // Auto-fetch attendance for first 5 employees
      if (data.data?.length > 0) {
        data.data.slice(0, 5).forEach(emp => {
          fetchAttendanceForEmployee(emp.id);
        });
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const fetchAttendanceForEmployee = async (employeeId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/attendance/employee/${employeeId}/today?_t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      const data = await response.json();
      
      console.log(`Attendance data for employee ${employeeId}:`, data);
      
      setAttendanceByEmployee(prev => ({
        ...prev,
        [employeeId]: data.data
      }));
    } catch (error) {
      console.error(`Error fetching attendance for ${employeeId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    setAttendanceByEmployee({});
    employees.slice(0, 5).forEach(emp => {
      fetchAttendanceForEmployee(emp.id);
    });
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Not clocked in';
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getEmployeeName = (emp) => {
    return `${emp.firstName} ${emp.lastName}`;
  };

  // Check if all employees have the same data (BUG INDICATOR)
  const checkForDuplicates = () => {
    const attendanceValues = Object.values(attendanceByEmployee).filter(Boolean);
    if (attendanceValues.length < 2) return null;
    
    const firstCheckIn = attendanceValues[0]?.checkIn;
    const firstCheckOut = attendanceValues[0]?.checkOut;
    
    const allSame = attendanceValues.every(att => 
      att?.checkIn === firstCheckIn && att?.checkOut === firstCheckOut
    );
    
    return allSame ? 'WARNING: All employees have identical attendance data!' : null;
  };

  const duplicateWarning = checkForDuplicates();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bug className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Debugger</h1>
                <p className="text-gray-600">Verify that each employee has unique attendance data</p>
              </div>
            </div>
            <button
              onClick={refreshAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh All
            </button>
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-red-800">{duplicateWarning}</p>
                  <p className="text-red-600 text-sm mt-1">
                    This means the employee ID is not being passed correctly to the API.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Currently Logged In</h2>
          </div>
          {currentUser ? (
            <div className="bg-white rounded p-4 font-mono text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-bold">ID (Database):</span> {currentUser.id || currentUser.empId}</div>
                <div><span className="font-bold">Employee Code:</span> {currentUser.employeeId}</div>
                <div><span className="font-bold">Name:</span> {currentUser.firstName} {currentUser.lastName}</div>
                <div><span className="font-bold">Email:</span> {currentUser.email}</div>
                <div><span className="font-bold">Role:</span> {currentUser.role}</div>
                <div><span className="font-bold">Department:</span> {currentUser.department}</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No user logged in</p>
          )}
        </div>

        {/* Employees Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Attendance Data Comparison</h2>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading attendance data...</p>
            </div>
          )}

          <div className="space-y-4">
            {employees.slice(0, 5).map((emp) => {
              const attendance = attendanceByEmployee[emp.id];
              const isCurrentUser = currentUser?.id === emp.id || currentUser?.empId === emp.id;

              return (
                <div
                  key={emp.id}
                  className={`border rounded-lg p-4 ${
                    isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">
                          {getEmployeeName(emp)}
                        </h3>
                        {isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        DB ID: <span className="font-mono font-bold">{emp.id}</span> | 
                        Code: <span className="font-mono">{emp.employeeId}</span> | 
                        {emp.department}
                      </p>
                    </div>
                    <button
                      onClick={() => fetchAttendanceForEmployee(emp.id)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Refresh
                    </button>
                  </div>

                  {attendance ? (
                    <div className="bg-gray-50 rounded p-3 font-mono text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check In</p>
                          <p className={`font-bold ${attendance.checkIn ? 'text-green-600' : 'text-gray-400'}`}>
                            {formatTime(attendance.checkIn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check Out</p>
                          <p className={`font-bold ${attendance.checkOut ? 'text-red-600' : 'text-gray-400'}`}>
                            {formatTime(attendance.checkOut)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="font-bold text-blue-600">
                            {attendance.status || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                          <p className="font-bold text-purple-600">
                            {attendance.totalHours?.toFixed(2) || '0.00'}h
                          </p>
                        </div>
                      </div>
                      {attendance.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Notes:</p>
                          <p className="text-xs">{attendance.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded p-3 text-center text-gray-500">
                      No attendance data for today
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">🔍 What to Check:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Each employee should have different clock in/out times</li>
              <li>If all times are identical, the employee ID is not being passed correctly</li>
              <li>The "DB ID" should match what's used in API calls</li>
              <li>Check browser console logs for API request URLs</li>
              <li>Verify Network tab shows different employee IDs in requests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDebugger;