export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'owner';
  profilePhoto?: string;
  hostelsAssigned?: string[];
}

export interface Hostel {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  floorsCount: number;
  roomsCount: number;
  imageUrl: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  isActive: boolean;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  hostelsAssigned: string[]; // array of hostel IDs
  isActive: boolean;
  profilePhoto?: string;
  photoUrl?: string | null;
}

export interface Room {
  id: string;
  hostelId: string;
  roomNumber: string;
  floorNumber: number;
  roomType: 'single' | 'double' | 'triple' | 'dormitory';
  capacity: number;
  monthlyRent: number;
  occupiedCount: number;
}

export interface Hosteler {
  id: string;
  hostelId: string;
  roomId: string;
  name: string;
  phone: string;
  email: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  joiningDate: string;
  photoUrl?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  bedNumber?: number;
  isActive: boolean;
  vacateDate?: string;
  vacateReason?: string;
  isRentOverdue: boolean;
  rentAmountDue?: number;
}

export interface Transaction {
  id: string;
  hostelId: string;
  type: 'income' | 'expense';
  category: string; // e.g. "Rent", "Groceries", "Utilities", "Salary", "Maintenance", "Repairs"
  amount: number;
  date: string;
  paymentMode?: 'cash' | 'upi' | 'bank_transfer'; // for income
  hostelerId?: string; // for rent income
  hostelerName?: string; // for rent income
  description?: string;
  receiptUrl?: string; // for expense receipt photo
}

export interface AppNotification {
  id: string;
  hostelId?: string; // global notifications won't have a hostelId
  title: string;
  body: string;
  type: 'rent_due' | 'occupancy' | 'system' | 'active_hostelers';
  date: string;
  isRead: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  date: string;
  hostelName?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface FoodMenuEntry {
  id: string;
  hostelId: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  menuItems: string; // comma-separated list of items
}

