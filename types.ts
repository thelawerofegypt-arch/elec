
export interface Employee {
  id: string;
  serialNumber?: string;
  name: string;
  nationalId: string;
  gender: 'ذكر' | 'أنثى';
  workplace: string;
  grade: string;
  address?: string;
  phone?: string;
  notes?: string;
  assignmentCount: number;
  lastAssignmentDate?: string;
  isActive: boolean;
}

export interface Prosecution {
  id: string;
  name: string;
}

export interface EmployeeRole {
  employeeId: string;
  roleType: 'عليا' | 'عامة' | 'فرعية';
  subCommitteeNumber?: number;
}

export interface Assignment {
  id: string;
  date: string;
  entityName: string;
  entityType: 'نقابة' | 'نادي' | 'أخرى';
  employeeIds: string[];
  roles?: EmployeeRole[];
  isDraft?: boolean;
  // حقول المقر والملاحظات للمجموعات
  superiorLocation?: string;
  superiorNotes?: string;
  generalLocation?: string;
  generalNotes?: string;
  subLocation?: string;
  subNotes?: string;
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'مدير نظام' | 'مسؤول إدخال' | 'مدخل بيانات';
  createdAt: string;
  profilePicture?: string;
}

export type ViewType = 'DASHBOARD' | 'EMPLOYEES' | 'NEW_ASSIGNMENT' | 'HISTORY' | 'REPORTS' | 'ADMIN_MANAGEMENT' | 'PROFILE' | 'SETTINGS' | 'PROSECUTIONS_MANAGEMENT';
