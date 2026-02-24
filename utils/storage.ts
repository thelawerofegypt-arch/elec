
import { Employee, Assignment, Admin, Prosecution } from '../types';

const EMPLOYEES_KEY = 'election_system_employees';
const ASSIGNMENTS_KEY = 'election_system_assignments';
const ADMINS_KEY = 'election_system_admins';
const PROSECUTIONS_KEY = 'election_system_prosecutions';

export const getStoredData = (): { 
  employees: Employee[], 
  assignments: Assignment[], 
  admins: Admin[],
  prosecutions: Prosecution[]
} => {
  try {
    const employeesJson = localStorage.getItem(EMPLOYEES_KEY);
    const assignmentsJson = localStorage.getItem(ASSIGNMENTS_KEY);
    const adminsJson = localStorage.getItem(ADMINS_KEY);
    const prosecutionsJson = localStorage.getItem(PROSECUTIONS_KEY);

    const defaultAdmins: Admin[] = [
      {
        id: '1',
        name: 'المدير الرئيسي',
        username: 'admin',
        password: '123',
        role: 'مدير نظام',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'مدير النظام العام',
        username: 'administrator',
        password: 'P@ssw0rd',
        role: 'مدير نظام',
        createdAt: new Date().toISOString()
      }
    ];

    return {
      employees: employeesJson ? JSON.parse(employeesJson) : [],
      assignments: assignmentsJson ? JSON.parse(assignmentsJson) : [],
      admins: (adminsJson && JSON.parse(adminsJson).length > 0) ? JSON.parse(adminsJson) : defaultAdmins,
      prosecutions: prosecutionsJson ? JSON.parse(prosecutionsJson) : []
    };
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    return { employees: [], assignments: [], admins: [], prosecutions: [] };
  }
};

export const saveStoredData = (
  employees: Employee[], 
  assignments: Assignment[], 
  admins: Admin[],
  prosecutions: Prosecution[]
) => {
  try {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
    localStorage.setItem(PROSECUTIONS_KEY, JSON.stringify(prosecutions));
  } catch (error) {
    console.error("Critical: Failed to save to localStorage. Storage might be full.", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn("LocalStorage quota exceeded!");
    }
  }
};
