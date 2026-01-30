// Update the Employee interface in EmployeesPage.tsx
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  employeeId?: string; // Add this
  email: string;
  orgEmail: string;
  orgPassword: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  birthday?: string;
  leaveDate?: string | null; // Make it nullable
  avatar?: string;
  location?: string; // Add this
  emergencyContact?: string; // Add this
  skills?: string[];
  isActive?: boolean;
  leaveBalance?: {
    casual: number;
    sick: number;
    earned: number;
    maternity?: number;
    paternity?: number;
    bereavement?: number;
  };
}