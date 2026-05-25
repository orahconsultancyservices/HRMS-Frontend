import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/api';

export type SettingsMap = Record<string, string>;

// ─── Client-side defaults (mirror of backend defaults) ────────────────────────
// Used for initial form values before the API responds.
export const SETTINGS_DEFAULTS: SettingsMap = {
  'attendance.workStartTime':           '09:00',
  'attendance.lateBufferMinutes':       '15',
  'attendance.workEndTime':             '18:00',
  'attendance.halfDayHours':            '4',
  'attendance.minimumHoursPresent':     '8',
  'attendance.workingDays':             JSON.stringify([1, 2, 3, 4, 5]),
  'attendance.overtimeThresholdHours':  '9',
  'attendance.earlyDepartureMinutes':   '30',

  'leave.casualLeaveQuota':       '12',
  'leave.sickLeaveQuota':         '8',
  'leave.earnedLeaveQuota':       '20',
  'leave.maternityLeaveDays':     '90',
  'leave.paternityLeaveDays':     '7',
  'leave.bereavementLeaveDays':   '7',
  'leave.carryForwardEnabled':    'false',
  'leave.maxCarryForwardDays':    '0',
  'leave.minNoticeDays':          '1',
  'leave.maxConsecutiveDays':     '30',
  'leave.maxAdvanceBookingDays':  '90',
  'leave.leaveYearResetMonth':    '1',
  'leave.halfDayEnabled':         'true',
  'leave.sandwichRuleEnabled':    'false',

  'employee.idPrefix':                   'EMP',
  'employee.idPadding':                  '3',
  'employee.probationMonths':            '3',
  'employee.noticePeriodDays':           '30',
  'employee.autoDeactivateOnLeaveDate':  'true',
  'employee.defaultDepartment':          '',
  'employee.defaultPosition':            '',

  'org.companyName':           'OCS',
  'org.companyWebsite':        '',
  'org.companyPhone':          '',
  'org.companyAddress':        '',
  'org.timezone':              'Asia/Kolkata',
  'org.dateFormat':            'DD/MM/YYYY',
  'org.timeFormat':            '12h',
  'org.currency':              'INR',
  'org.currencySymbol':        '₹',
  'org.fiscalYearStartMonth':  '4',
  'org.language':              'en',

  'notifications.birthdayReminders':   'true',
  'notifications.leaveApprovalAlerts': 'true',
  'notifications.attendanceAlerts':    'true',
  'notifications.newEmployeeAlert':    'true',
  'notifications.adminEmail':          '',
  'notifications.emailEnabled':        'false',

  'security.sessionTimeoutMinutes':   '60',
  'security.maxLoginAttempts':        '5',
  'security.passwordMinLength':       '8',
  'security.requireNumber':           'true',
  'security.requireSpecialChar':      'false',
  'security.requireUppercase':        'false',
  'security.lockoutDurationMinutes':  '15',
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<SettingsMap> => {
      try {
        const res = await settingsApi.getAll();
        return res.data ?? SETTINGS_DEFAULTS;
      } catch {
        return SETTINGS_DEFAULTS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SettingsMap) => {
      const res = await settingsApi.update(data);
      if (!res.success) throw new Error('Failed to save settings');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
};

export const useResetSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category?: string) => {
      const res = await settingsApi.reset(category);
      if (!res.success) throw new Error('Failed to reset settings');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
};
