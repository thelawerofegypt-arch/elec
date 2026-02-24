
import Dexie from 'dexie';
import type { Table } from 'dexie';
import { Employee, Assignment, Admin, Prosecution } from '../types';

/**
 * Custom Dexie database class for the NI Elections Application.
 * Properly extends Dexie to inherit database management capabilities.
 */
export class NIAppDB extends Dexie {
  employees!: Table<Employee, string>;
  assignments!: Table<Assignment, string>;
  admins!: Table<Admin, string>;
  prosecutions!: Table<Prosecution, string>;

  constructor() {
    super('NI_Elections_DB_Pro');
    // Fix: Using a type cast to 'any' to resolve a known TypeScript issue where 
    // the compiler confuses the 'version' property (number) with the 'version' method 
    // in Dexie class extensions.
    (this as any).version(1).stores({
      employees: '++id, serialNumber, name, nationalId, workplace, grade, assignmentCount, lastAssignmentDate, isActive',
      assignments: '++id, date, entityName, entityType',
      admins: '++id, username, name',
      prosecutions: '++id, name'
    });
  }
}

export const db = new NIAppDB();

/**
 * Initializes the default admin account if the database is empty.
 */
export const initializeDefaultAdmin = async () => {
  const count = await db.admins.count();
  if (count === 0) {
    await db.admins.add({
      id: '1',
      name: 'المدير الرئيسي',
      username: 'admin',
      password: '123',
      role: 'مدير نظام',
      createdAt: new Date().toISOString()
    });
  }
};
