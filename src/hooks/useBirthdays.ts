import { useState, useEffect } from 'react';
import { birthdayApi } from '../services/api';

interface BirthdayEmployee {
  id: string;
  name: string;
  avatar: string;
  department: string;
  position: string;
  birthday: string;
  email: string;
  phone: string;
  joinDate: string;
  leaveBalance: {
    casual: number;
    sick: number;
    earned: number;
  };
}

export const useBirthdays = () => {
  const [employees, setEmployees] = useState<BirthdayEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const response = await birthdayApi.getAll();
      
      if (response.data.success) {
        // Transform the API data to match the expected format
        const transformedData = response.data.data.map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          avatar: emp.avatar,
          department: emp.department,
          position: emp.position,
          birthday: emp.birthday,
          email: emp.email,
          phone: emp.phone || '',
          joinDate: emp.joinDate,
          leaveBalance: {
            casual: emp.leaveBalance?.casual || 0,
            sick: emp.leaveBalance?.sick || 0,
            earned: emp.leaveBalance?.earned || 0,
          }
        }));
        
        setEmployees(transformedData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch birthdays');
      console.error('Error fetching birthdays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const refresh = () => {
    fetchBirthdays();
  };

  return { employees, loading, error, refresh };
};