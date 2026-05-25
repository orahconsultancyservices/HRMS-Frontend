import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Calendar, Users, Building2, Bell, Shield,
  Save, RotateCcw, CheckCircle2, AlertCircle, ChevronRight,
  Info, Lock, Timer, Coffee, Sunrise, Sunset,
  UserPlus, Hash, Briefcase, Globe, DollarSign,
  Mail, BellRing, BellOff, Eye, EyeOff, Loader2,
  Settings, AlarmClock, Moon,
} from 'lucide-react';
import {
  useSettings, useUpdateSettings, useResetSettings,
  SETTINGS_DEFAULTS, type SettingsMap,
} from '../../hooks/useSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId = 'attendance' | 'leave' | 'employee' | 'organization' | 'notifications' | 'security';

interface Category {
  id: CategoryId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  color: string;        // Tailwind bg for active state
  lightColor: string;   // Tailwind bg for icon chip
  iconColor: string;    // Tailwind text for icon chip
}

const CATEGORIES: Category[] = [
  {
    id: 'attendance', icon: Clock,
    label: 'Attendance & Time', desc: 'Work hours, late buffer, overtime rules',
    color: 'bg-blue-600', lightColor: 'bg-blue-50', iconColor: 'text-blue-600',
  },
  {
    id: 'leave', icon: Calendar,
    label: 'Leave Policies', desc: 'Quotas, carry-forward, booking rules',
    color: 'bg-emerald-600', lightColor: 'bg-emerald-50', iconColor: 'text-emerald-600',
  },
  {
    id: 'employee', icon: Users,
    label: 'Employee', desc: 'ID format, probation, notice period',
    color: 'bg-violet-600', lightColor: 'bg-violet-50', iconColor: 'text-violet-600',
  },
  {
    id: 'organization', icon: Building2,
    label: 'Organization', desc: 'Company info, timezone, formats',
    color: 'bg-amber-600', lightColor: 'bg-amber-50', iconColor: 'text-amber-600',
  },
  {
    id: 'notifications', icon: Bell,
    label: 'Notifications', desc: 'Alerts, reminders, email settings',
    color: 'bg-pink-600', lightColor: 'bg-pink-50', iconColor: 'text-pink-600',
  },
  {
    id: 'security', icon: Shield,
    label: 'Security', desc: 'Session timeout, password policy',
    color: 'bg-slate-700', lightColor: 'bg-slate-100', iconColor: 'text-slate-700',
  },
];

// ─── Helper components ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, desc }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-3 mb-4 border-b border-gray-100">
      <div className="p-2 bg-gray-100 rounded-lg shrink-0">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FieldRow({ label, desc, children }: {
  label: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', prefix }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; prefix?: string;
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
      {prefix && (
        <span className="px-2.5 py-2 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-medium">{prefix}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 text-sm text-gray-800 outline-none w-40 bg-transparent"
      />
    </div>
  );
}

function NumberInput({ value, onChange, min, max, unit }: {
  value: string; onChange: (v: string) => void;
  min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
        <button
          type="button"
          onClick={() => onChange(String(Math.max(min ?? 0, parseInt(value || '0') - 1)))}
          className="px-2.5 py-2 text-gray-500 hover:bg-gray-50 transition font-bold text-base border-r border-gray-100"
        >−</button>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-16 text-center py-2 text-sm text-gray-800 outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={() => onChange(String(Math.min(max ?? 9999, parseInt(value || '0') + 1)))}
          className="px-2.5 py-2 text-gray-500 hover:bg-gray-50 transition font-bold text-base border-l border-gray-100"
        >+</button>
      </div>
      {unit && <span className="text-xs text-gray-500">{unit}</span>}
    </div>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className={`text-xs font-medium ${checked ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-gray-200'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// Working-days checkbox row
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function WorkingDaysInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let days: number[] = [];
  try { days = JSON.parse(value); } catch { days = [1, 2, 3, 4, 5]; }

  const toggle = (d: number) => {
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort();
    onChange(JSON.stringify(next));
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAY_LABELS.map((lbl, idx) => {
        const active = days.includes(idx);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => toggle(idx)}
            className={`w-10 h-10 rounded-lg text-xs font-semibold border transition-all ${
              active
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
            }`}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

// ─── Category form panels ─────────────────────────────────────────────────────

function AttendanceForm({ s, set }: { s: SettingsMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Work Hours */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={AlarmClock} title="Work Hours" desc="Define when the workday starts and ends" />
        <FieldRow label="Work Start Time" desc="Official start of working hours">
          <TimeInput value={s['attendance.workStartTime']} onChange={v => set('attendance.workStartTime', v)} />
        </FieldRow>
        <FieldRow label="Work End Time" desc="Official end of working hours">
          <TimeInput value={s['attendance.workEndTime']} onChange={v => set('attendance.workEndTime', v)} />
        </FieldRow>
        <FieldRow label="Late Buffer" desc="Minutes after start time before employee is marked late">
          <NumberInput value={s['attendance.lateBufferMinutes']} onChange={v => set('attendance.lateBufferMinutes', v)} min={0} max={120} unit="min" />
        </FieldRow>
        <FieldRow label="Early Departure Allowed" desc="Minutes before end time an employee can leave without being flagged">
          <NumberInput value={s['attendance.earlyDepartureMinutes']} onChange={v => set('attendance.earlyDepartureMinutes', v)} min={0} max={120} unit="min" />
        </FieldRow>
      </div>

      {/* Hours Rules */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Timer} title="Hours Rules" desc="Thresholds for classifying attendance" />
        <FieldRow label="Full Day Minimum" desc="Hours required to count as a full working day">
          <NumberInput value={s['attendance.minimumHoursPresent']} onChange={v => set('attendance.minimumHoursPresent', v)} min={1} max={24} unit="hrs" />
        </FieldRow>
        <FieldRow label="Half Day Cutoff" desc="Minimum hours to qualify as a half day (below = absent)">
          <NumberInput value={s['attendance.halfDayHours']} onChange={v => set('attendance.halfDayHours', v)} min={1} max={12} unit="hrs" />
        </FieldRow>
        <FieldRow label="Overtime Threshold" desc="Hours worked beyond this count as overtime">
          <NumberInput value={s['attendance.overtimeThresholdHours']} onChange={v => set('attendance.overtimeThresholdHours', v)} min={1} max={24} unit="hrs" />
        </FieldRow>
      </div>

      {/* Working Days */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Calendar} title="Working Days" desc="Select which days of the week are working days" />
        <div className="pt-1">
          <WorkingDaysInput value={s['attendance.workingDays']} onChange={v => set('attendance.workingDays', v)} />
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Weekends and non-working days are automatically excluded from attendance tracking.
          </p>
        </div>
      </div>
    </div>
  );
}

function LeaveForm({ s, set }: { s: SettingsMap; set: (k: string, v: string) => void }) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return (
    <div className="space-y-6">
      {/* Leave Quotas */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Calendar} title="Annual Leave Quotas" desc="Default number of leave days allocated per year" />
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Casual Leave">
            <NumberInput value={s['leave.casualLeaveQuota']} onChange={v => set('leave.casualLeaveQuota', v)} min={0} max={365} unit="days" />
          </FieldRow>
          <FieldRow label="Sick Leave">
            <NumberInput value={s['leave.sickLeaveQuota']} onChange={v => set('leave.sickLeaveQuota', v)} min={0} max={365} unit="days" />
          </FieldRow>
          <FieldRow label="Earned Leave">
            <NumberInput value={s['leave.earnedLeaveQuota']} onChange={v => set('leave.earnedLeaveQuota', v)} min={0} max={365} unit="days" />
          </FieldRow>
          <FieldRow label="Bereavement Leave">
            <NumberInput value={s['leave.bereavementLeaveDays']} onChange={v => set('leave.bereavementLeaveDays', v)} min={0} max={30} unit="days" />
          </FieldRow>
          <FieldRow label="Maternity Leave">
            <NumberInput value={s['leave.maternityLeaveDays']} onChange={v => set('leave.maternityLeaveDays', v)} min={0} max={365} unit="days" />
          </FieldRow>
          <FieldRow label="Paternity Leave">
            <NumberInput value={s['leave.paternityLeaveDays']} onChange={v => set('leave.paternityLeaveDays', v)} min={0} max={30} unit="days" />
          </FieldRow>
        </div>
      </div>

      {/* Leave Rules */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Info} title="Leave Rules" desc="Restrictions and policies for leave applications" />
        <FieldRow label="Minimum Notice Days" desc="Minimum days in advance an employee must apply for leave">
          <NumberInput value={s['leave.minNoticeDays']} onChange={v => set('leave.minNoticeDays', v)} min={0} max={90} unit="days" />
        </FieldRow>
        <FieldRow label="Max Consecutive Days" desc="Maximum continuous leave days allowed in one request">
          <NumberInput value={s['leave.maxConsecutiveDays']} onChange={v => set('leave.maxConsecutiveDays', v)} min={1} max={365} unit="days" />
        </FieldRow>
        <FieldRow label="Max Advance Booking" desc="How far ahead an employee can book leave">
          <NumberInput value={s['leave.maxAdvanceBookingDays']} onChange={v => set('leave.maxAdvanceBookingDays', v)} min={1} max={365} unit="days" />
        </FieldRow>
        <FieldRow label="Half Day Leave" desc="Allow employees to apply for half-day leaves">
          <Toggle checked={s['leave.halfDayEnabled'] === 'true'} onChange={v => set('leave.halfDayEnabled', String(v))} label={s['leave.halfDayEnabled'] === 'true' ? 'Enabled' : 'Disabled'} />
        </FieldRow>
        <FieldRow label="Sandwich Rule" desc="Weekends between leave days are counted as leave days">
          <Toggle checked={s['leave.sandwichRuleEnabled'] === 'true'} onChange={v => set('leave.sandwichRuleEnabled', String(v))} label={s['leave.sandwichRuleEnabled'] === 'true' ? 'Active' : 'Inactive'} />
        </FieldRow>
      </div>

      {/* Carry Forward */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Moon} title="Carry Forward" desc="Rules for carrying unused leave to the next year" />
        <FieldRow label="Allow Carry Forward" desc="Let employees carry unused leave to the following year">
          <Toggle checked={s['leave.carryForwardEnabled'] === 'true'} onChange={v => set('leave.carryForwardEnabled', String(v))} label={s['leave.carryForwardEnabled'] === 'true' ? 'Allowed' : 'Not allowed'} />
        </FieldRow>
        {s['leave.carryForwardEnabled'] === 'true' && (
          <FieldRow label="Max Carry Forward Days" desc="Maximum number of days that can be carried over">
            <NumberInput value={s['leave.maxCarryForwardDays']} onChange={v => set('leave.maxCarryForwardDays', v)} min={0} max={365} unit="days" />
          </FieldRow>
        )}
        <FieldRow label="Leave Year Resets In" desc="Month when annual leave balances are reset">
          <SelectInput
            value={s['leave.leaveYearResetMonth']}
            onChange={v => set('leave.leaveYearResetMonth', v)}
            options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))}
          />
        </FieldRow>
      </div>
    </div>
  );
}

function EmployeeForm({ s, set }: { s: SettingsMap; set: (k: string, v: string) => void }) {
  const prefix  = s['employee.idPrefix'] || 'EMP';
  const padding = parseInt(s['employee.idPadding'] || '3');
  const preview = `${prefix}${'1'.padStart(padding, '0')}`;

  return (
    <div className="space-y-6">
      {/* Employee ID */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Hash} title="Employee ID Format" desc="Configure how new employee IDs are generated" />
        <FieldRow label="ID Prefix" desc="Letters prepended to every employee ID">
          <TextInput value={s['employee.idPrefix']} onChange={v => set('employee.idPrefix', v.toUpperCase())} placeholder="EMP" />
        </FieldRow>
        <FieldRow label="Number Length" desc="How many digits in the numeric part (zero-padded)">
          <NumberInput value={s['employee.idPadding']} onChange={v => set('employee.idPadding', v)} min={1} max={8} unit="digits" />
        </FieldRow>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
          <span className="text-xs text-gray-500">Preview:</span>
          <span className="font-mono font-bold text-blue-700 text-sm bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
            {preview}
          </span>
          <span className="text-xs text-gray-400">→ {prefix}{String(2).padStart(padding, '0')}, {prefix}{String(3).padStart(padding, '0')} …</span>
        </div>
      </div>

      {/* Employment Policies */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Briefcase} title="Employment Policies" desc="Default contract and policy settings for new employees" />
        <FieldRow label="Probation Period" desc="Duration of probation for new hires">
          <NumberInput value={s['employee.probationMonths']} onChange={v => set('employee.probationMonths', v)} min={0} max={24} unit="months" />
        </FieldRow>
        <FieldRow label="Default Notice Period" desc="Notice period required for resignation or termination">
          <NumberInput value={s['employee.noticePeriodDays']} onChange={v => set('employee.noticePeriodDays', v)} min={0} max={180} unit="days" />
        </FieldRow>
        <FieldRow label="Auto-deactivate on Leave Date" desc="Automatically mark employee inactive on their last working day">
          <Toggle
            checked={s['employee.autoDeactivateOnLeaveDate'] === 'true'}
            onChange={v => set('employee.autoDeactivateOnLeaveDate', String(v))}
            label={s['employee.autoDeactivateOnLeaveDate'] === 'true' ? 'Enabled' : 'Disabled'}
          />
        </FieldRow>
      </div>

      {/* Defaults */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={UserPlus} title="New Employee Defaults" desc="Pre-fill values when creating new employees" />
        <FieldRow label="Default Department" desc="Leave blank for no default">
          <TextInput value={s['employee.defaultDepartment']} onChange={v => set('employee.defaultDepartment', v)} placeholder="e.g. Engineering" />
        </FieldRow>
        <FieldRow label="Default Position" desc="Leave blank for no default">
          <TextInput value={s['employee.defaultPosition']} onChange={v => set('employee.defaultPosition', v)} placeholder="e.g. Junior Developer" />
        </FieldRow>
      </div>
    </div>
  );
}

function OrganizationForm({ s, set }: { s: SettingsMap; set: (k: string, v: string) => void }) {
  const TIMEZONES = [
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
    'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
    'UTC',
  ];
  const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MMM D, YYYY'];
  const CURRENCIES = [
    { label: 'Indian Rupee (INR ₹)', value: 'INR' },
    { label: 'US Dollar (USD $)', value: 'USD' },
    { label: 'Euro (EUR €)', value: 'EUR' },
    { label: 'British Pound (GBP £)', value: 'GBP' },
    { label: 'UAE Dirham (AED)', value: 'AED' },
    { label: 'Singapore Dollar (SGD)', value: 'SGD' },
  ];
  const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$',
  };
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const handleCurrencyChange = (v: string) => {
    set('org.currency', v);
    set('org.currencySymbol', CURRENCY_SYMBOLS[v] || v);
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Building2} title="Company Information" desc="Basic details about your organization" />
        <FieldRow label="Company Name">
          <TextInput value={s['org.companyName']} onChange={v => set('org.companyName', v)} placeholder="e.g. OCS" />
        </FieldRow>
        <FieldRow label="Website" desc="Optional company website URL">
          <TextInput value={s['org.companyWebsite']} onChange={v => set('org.companyWebsite', v)} placeholder="https://..." />
        </FieldRow>
        <FieldRow label="Phone" desc="Company contact number">
          <TextInput value={s['org.companyPhone']} onChange={v => set('org.companyPhone', v)} placeholder="+91 98765 43210" />
        </FieldRow>
        <FieldRow label="Address" desc="Registered company address">
          <TextInput value={s['org.companyAddress']} onChange={v => set('org.companyAddress', v)} placeholder="City, Country" />
        </FieldRow>
      </div>

      {/* Locale */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Globe} title="Locale & Format" desc="Regional settings that affect how data is displayed" />
        <FieldRow label="Timezone" desc="All time-based operations use this timezone">
          <SelectInput value={s['org.timezone']} onChange={v => set('org.timezone', v)}
            options={TIMEZONES.map(t => ({ label: t, value: t }))} />
        </FieldRow>
        <FieldRow label="Date Format" desc="How dates are displayed across the system">
          <SelectInput value={s['org.dateFormat']} onChange={v => set('org.dateFormat', v)}
            options={DATE_FORMATS.map(f => ({ label: f, value: f }))} />
        </FieldRow>
        <FieldRow label="Time Format" desc="12-hour or 24-hour clock display">
          <SelectInput value={s['org.timeFormat']} onChange={v => set('org.timeFormat', v)}
            options={[{ label: '12-hour (1:30 PM)', value: '12h' }, { label: '24-hour (13:30)', value: '24h' }]} />
        </FieldRow>
        <FieldRow label="Currency">
          <SelectInput value={s['org.currency']} onChange={handleCurrencyChange} options={CURRENCIES} />
        </FieldRow>
        <FieldRow label="Fiscal Year Starts In" desc="The month your financial year begins">
          <SelectInput value={s['org.fiscalYearStartMonth']} onChange={v => set('org.fiscalYearStartMonth', v)}
            options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))} />
        </FieldRow>
      </div>
    </div>
  );
}

function NotificationsForm({ s, set }: { s: SettingsMap; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Alert Types */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={BellRing} title="In-App Alerts" desc="Controls which events trigger notifications in the dashboard" />
        <FieldRow label="Birthday Reminders" desc="Show upcoming birthday notifications for employees">
          <Toggle checked={s['notifications.birthdayReminders'] === 'true'} onChange={v => set('notifications.birthdayReminders', String(v))} label={s['notifications.birthdayReminders'] === 'true' ? 'On' : 'Off'} />
        </FieldRow>
        <FieldRow label="Leave Approval Alerts" desc="Notify when a leave request needs approval or is actioned">
          <Toggle checked={s['notifications.leaveApprovalAlerts'] === 'true'} onChange={v => set('notifications.leaveApprovalAlerts', String(v))} label={s['notifications.leaveApprovalAlerts'] === 'true' ? 'On' : 'Off'} />
        </FieldRow>
        <FieldRow label="Attendance Alerts" desc="Flag unusual attendance patterns (late, absent, etc.)">
          <Toggle checked={s['notifications.attendanceAlerts'] === 'true'} onChange={v => set('notifications.attendanceAlerts', String(v))} label={s['notifications.attendanceAlerts'] === 'true' ? 'On' : 'Off'} />
        </FieldRow>
        <FieldRow label="New Employee Alerts" desc="Alert admins when a new employee account is created">
          <Toggle checked={s['notifications.newEmployeeAlert'] === 'true'} onChange={v => set('notifications.newEmployeeAlert', String(v))} label={s['notifications.newEmployeeAlert'] === 'true' ? 'On' : 'Off'} />
        </FieldRow>
      </div>

      {/* Email */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Mail} title="Email Notifications" desc="Configure outgoing email alerts to administrators" />
        <FieldRow label="Email Notifications" desc="Send system alerts to the admin email address">
          <Toggle checked={s['notifications.emailEnabled'] === 'true'} onChange={v => set('notifications.emailEnabled', String(v))} label={s['notifications.emailEnabled'] === 'true' ? 'Enabled' : 'Disabled'} />
        </FieldRow>
        <FieldRow label="Admin Alert Email" desc="Email address that receives system notifications">
          <TextInput value={s['notifications.adminEmail']} onChange={v => set('notifications.adminEmail', v)} placeholder="admin@company.com" type="email" />
        </FieldRow>
        {s['notifications.emailEnabled'] === 'false' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-700">
            <BellOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Email notifications are disabled. Enable to start receiving alerts.
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityForm({ s, set }: { s: SettingsMap; set: (k: string, v: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);

  const rules = [
    s['security.passwordMinLength'] ? `At least ${s['security.passwordMinLength']} characters` : null,
    s['security.requireNumber'] === 'true' ? 'Must include a number' : null,
    s['security.requireSpecialChar'] === 'true' ? 'Must include a special character' : null,
    s['security.requireUppercase'] === 'true' ? 'Must include an uppercase letter' : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Session */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Timer} title="Session Management" desc="Control how long users stay logged in" />
        <FieldRow label="Session Timeout" desc="Automatically log out inactive users after this duration">
          <NumberInput value={s['security.sessionTimeoutMinutes']} onChange={v => set('security.sessionTimeoutMinutes', v)} min={5} max={1440} unit="min" />
        </FieldRow>
        <FieldRow label="Max Login Attempts" desc="Lock account after this many failed login attempts">
          <NumberInput value={s['security.maxLoginAttempts']} onChange={v => set('security.maxLoginAttempts', v)} min={1} max={20} unit="tries" />
        </FieldRow>
        <FieldRow label="Account Lockout Duration" desc="How long an account stays locked after too many failures">
          <NumberInput value={s['security.lockoutDurationMinutes']} onChange={v => set('security.lockoutDurationMinutes', v)} min={1} max={1440} unit="min" />
        </FieldRow>
      </div>

      {/* Password Policy */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <SectionHeader icon={Lock} title="Password Policy" desc="Requirements enforced when creating or changing passwords" />
        <FieldRow label="Minimum Length" desc="Shortest password accepted">
          <NumberInput value={s['security.passwordMinLength']} onChange={v => set('security.passwordMinLength', v)} min={4} max={32} unit="chars" />
        </FieldRow>
        <FieldRow label="Require Number" desc="Password must contain at least one digit">
          <Toggle checked={s['security.requireNumber'] === 'true'} onChange={v => set('security.requireNumber', String(v))} label={s['security.requireNumber'] === 'true' ? 'Required' : 'Optional'} />
        </FieldRow>
        <FieldRow label="Require Special Character" desc="Password must contain at least one special character (!@#$…)">
          <Toggle checked={s['security.requireSpecialChar'] === 'true'} onChange={v => set('security.requireSpecialChar', String(v))} label={s['security.requireSpecialChar'] === 'true' ? 'Required' : 'Optional'} />
        </FieldRow>
        <FieldRow label="Require Uppercase" desc="Password must contain at least one uppercase letter">
          <Toggle checked={s['security.requireUppercase'] === 'true'} onChange={v => set('security.requireUppercase', String(v))} label={s['security.requireUppercase'] === 'true' ? 'Required' : 'Optional'} />
        </FieldRow>

        {/* Policy summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-800"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? 'Hide' : 'Preview'} policy summary
          </button>
          <AnimatePresence>
            {showPreview && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {rules.length === 0 && (
                  <li className="text-xs text-gray-400">No restrictions set.</li>
                )}
                {rules.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    {r}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const { data: remoteSettings, isLoading } = useSettings();
  const updateMutation  = useUpdateSettings();
  const resetMutation   = useResetSettings();

  const [activeCategory, setActiveCategory] = useState<CategoryId>('attendance');
  const [local, setLocal] = useState<SettingsMap>(SETTINGS_DEFAULTS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync remote → local when API responds
  useEffect(() => {
    if (remoteSettings) setLocal({ ...SETTINGS_DEFAULTS, ...remoteSettings });
  }, [remoteSettings]);

  // Detect unsaved changes in active category
  const base = remoteSettings ?? SETTINGS_DEFAULTS;
  const isDirty = Object.keys(local).some(k => {
    if (!k.startsWith(activeCategory === 'organization' ? 'org.' : `${activeCategory}.`)) return false;
    return local[k] !== (base[k] ?? SETTINGS_DEFAULTS[k]);
  });

  const set = useCallback((key: string, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    if (saveStatus === 'saved') setSaveStatus('idle');
  }, [saveStatus]);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMsg('');
    try {
      // Only save keys for the active category (plus any others that changed)
      await updateMutation.mutateAsync(local);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e: unknown) {
      setSaveStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const handleReset = async () => {
    setResetConfirm(false);
    try {
      const catKey = activeCategory === 'organization' ? 'org' : activeCategory;
      await resetMutation.mutateAsync(catKey);
    } catch {
      // ignore
    }
  };

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;

  const renderForm = () => {
    const props = { s: local, set };
    switch (activeCategory) {
      case 'attendance':    return <AttendanceForm    {...props} />;
      case 'leave':         return <LeaveForm         {...props} />;
      case 'employee':      return <EmployeeForm      {...props} />;
      case 'organization':  return <OrganizationForm  {...props} />;
      case 'notifications': return <NotificationsForm {...props} />;
      case 'security':      return <SecurityForm      {...props} />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-md">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">Full control of every system parameter</p>
          </div>
        </div>

        {/* Save status */}
        <AnimatePresence mode="wait">
          {saveStatus === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              {errorMsg || 'Failed to save'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left: Category Nav ─────────────────────────────────────────── */}
        <div className="w-64 shrink-0 space-y-1.5 sticky top-6">
          {CATEGORIES.map(cat => {
            const isActive = cat.id === activeCategory;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                  isActive
                    ? `${cat.color} text-white shadow-lg`
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20' : cat.lightColor}`}>
                  <cat.icon className={`w-4 h-4 ${isActive ? 'text-white' : cat.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                    {cat.label}
                  </p>
                  <p className={`text-[11px] truncate ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                    {cat.desc}
                  </p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* ── Right: Settings Form ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Category header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${activeCat.lightColor} rounded-xl`}>
                <activeCat.icon className={`w-5 h-5 ${activeCat.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{activeCat.label}</h2>
                <p className="text-xs text-gray-500">{activeCat.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset button */}
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  disabled={resetMutation.isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl transition bg-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl"
                >
                  <span className="text-xs font-medium text-red-700">Reset to defaults?</span>
                  <button onClick={handleReset} className="text-xs font-bold text-red-600 hover:text-red-800 underline">Yes</button>
                  <button onClick={() => setResetConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </motion.div>
              )}

              {/* Save button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saveStatus === 'saving' || updateMutation.isPending}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition shadow-sm ${
                  isDirty
                    ? `${activeCat.color} text-white hover:opacity-90`
                    : 'bg-gray-100 text-gray-400 cursor-default'
                } disabled:opacity-50`}
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
              </motion.button>
            </div>
          </div>

          {/* Unsaved indicator */}
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              You have unsaved changes in this section.
            </motion.div>
          )}

          {/* Form content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {renderForm()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
