import { Hostel, Owner, Room, Hosteler, Transaction, AppNotification, ActivityLog } from '../types';

export const mockHostels: Hostel[] = [
  {
    id: 'hostel-1',
    name: 'Green View Hostel',
    address: 'Hyderabad',
    contactNumber: '+91 98765 43210',
    floorsCount: 4,
    roomsCount: 45,
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400&auto=format&fit=crop',
    ownerName: 'Ravi Kumar', ownerEmail: 'ravi.kumar@gmail.com', ownerPhone: '9876543210',
    isActive: true,
  },
  {
    id: 'hostel-2',
    name: 'Comfort Living',
    address: 'Tirupati',
    contactNumber: '+91 98765 43211',
    floorsCount: 3,
    roomsCount: 20,
    imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=400&auto=format&fit=crop',
    ownerName: 'Ravi Kumar', ownerEmail: 'ravi.kumar@gmail.com', ownerPhone: '9876543210',
    isActive: true,
  },
  {
    id: 'hostel-3',
    name: 'Sunrise Residency',
    address: 'Vijayawada',
    contactNumber: '+91 98765 43212',
    floorsCount: 2,
    roomsCount: 32,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
    ownerName: 'Priya Sharma', ownerEmail: 'priya.sharma@hostel.com', ownerPhone: '9865432109',
    isActive: true,
  },
  {
    id: 'hostel-4',
    name: 'Royal Stay Hostel',
    address: 'Visakhapatnam',
    contactNumber: '+91 98765 43213',
    floorsCount: 5,
    roomsCount: 28,
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=400&auto=format&fit=crop',
    ownerName: 'Anil Kumar', ownerEmail: 'anil.kumar@hostel.com', ownerPhone: '9843210987',
    isActive: false, // inactive hostel example
  }
];

export const mockOwners: Owner[] = [
  {
    id: 'owner-1',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@gmail.com',
    phone: '9876543210',
    hostelsAssigned: ['hostel-1', 'hostel-2'],
    isActive: true,
    photoUrl: null,
  },
  {
    id: 'owner-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@hostel.com',
    phone: '9865432109',
    hostelsAssigned: ['hostel-3'],
    isActive: true,
    photoUrl: null,
  },
  {
    id: 'owner-3',
    name: 'Suresh Reddy',
    email: 'suresh.reddy@gmail.com',
    phone: '9854321098',
    hostelsAssigned: [],
    isActive: true,
    photoUrl: null,
  },
  {
    id: 'owner-4',
    name: 'Anil Kumar',
    email: 'anil.kumar@hostel.com',
    phone: '9843210987',
    hostelsAssigned: ['hostel-4'],
    isActive: false, // disabled access
    photoUrl: null,
  }
];

export const mockRooms: Room[] = [
  // Hostel 1
  { id: 'room-101', hostelId: 'hostel-1', roomNumber: '101', floorNumber: 1, roomType: 'single', capacity: 1, monthlyRent: 8500, occupiedCount: 1 },
  { id: 'room-102', hostelId: 'hostel-1', roomNumber: '102', floorNumber: 1, roomType: 'double', capacity: 2, monthlyRent: 6000, occupiedCount: 2 },
  { id: 'room-103', hostelId: 'hostel-1', roomNumber: '103', floorNumber: 1, roomType: 'triple', capacity: 3, monthlyRent: 4500, occupiedCount: 1 },
  { id: 'room-104', hostelId: 'hostel-1', roomNumber: '104', floorNumber: 1, roomType: 'dormitory', capacity: 6, monthlyRent: 3500, occupiedCount: 4 },
  { id: 'room-201', hostelId: 'hostel-1', roomNumber: '201', floorNumber: 2, roomType: 'single', capacity: 1, monthlyRent: 9000, occupiedCount: 0 }, // vacant
  { id: 'room-202', hostelId: 'hostel-1', roomNumber: '202', floorNumber: 2, roomType: 'double', capacity: 2, monthlyRent: 6500, occupiedCount: 2 }, // full
  { id: 'room-301', hostelId: 'hostel-1', roomNumber: '301', floorNumber: 3, roomType: 'triple', capacity: 3, monthlyRent: 4800, occupiedCount: 0 }, // vacant

  // Hostel 2
  { id: 'room-2-101', hostelId: 'hostel-2', roomNumber: '101', floorNumber: 1, roomType: 'single', capacity: 1, monthlyRent: 12000, occupiedCount: 1 },
  { id: 'room-2-102', hostelId: 'hostel-2', roomNumber: '102', floorNumber: 1, roomType: 'double', capacity: 2, monthlyRent: 8000, occupiedCount: 1 },
  { id: 'room-2-201', hostelId: 'hostel-2', roomNumber: '201', floorNumber: 2, roomType: 'double', capacity: 2, monthlyRent: 8000, occupiedCount: 0 },

  // Hostel 3
  { id: 'room-3-101', hostelId: 'hostel-3', roomNumber: '101', floorNumber: 1, roomType: 'double', capacity: 2, monthlyRent: 5500, occupiedCount: 1 }
];

export const mockHostelers: Hosteler[] = [
  // Hostel 1
  {
    id: 'hosteler-1',
    hostelId: 'hostel-1',
    roomId: 'room-101',
    name: 'Rahul Sharma',
    phone: '9876540001',
    email: 'rahul.sharma@gmail.com',
    permanentAddress: 'H.No 45, Gandhi Nagar, Patna, Bihar',
    emergencyContactName: 'M.P. Sharma (Father)',
    emergencyContactPhone: '9876540000',
    joiningDate: '2025-01-15',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-2',
    hostelId: 'hostel-1',
    roomId: 'room-102',
    name: 'Amit Kumar',
    phone: '9876540002',
    email: 'amit.kumar@gmail.com',
    permanentAddress: 'Street 4, Shastri Nagar, Jaipur, Rajasthan',
    emergencyContactName: 'Sunita Devi (Mother)',
    emergencyContactPhone: '9876540003',
    joiningDate: '2025-02-10',
    isActive: true,
    isRentOverdue: true,
    rentAmountDue: 6000,
  },
  {
    id: 'hosteler-3',
    hostelId: 'hostel-1',
    roomId: 'room-102',
    name: 'Vikram Singh',
    phone: '9876540004',
    email: 'vikram.singh@gmail.com',
    permanentAddress: 'Vill- Rampur, Dist- Kanpur, Uttar Pradesh',
    emergencyContactName: 'K.P. Singh (Father)',
    emergencyContactPhone: '9876540005',
    joiningDate: '2025-03-01',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-4',
    hostelId: 'hostel-1',
    roomId: 'room-103',
    name: 'Rohit Verma',
    phone: '9876540006',
    email: 'rohit.verma@gmail.com',
    permanentAddress: 'H.No 120, Sector 15, Faridabad, Haryana',
    emergencyContactName: 'R.K. Verma (Father)',
    emergencyContactPhone: '9876540007',
    joiningDate: '2025-04-15',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-5',
    hostelId: 'hostel-1',
    roomId: 'room-104',
    name: 'Suresh Yadav',
    phone: '9876540008',
    email: 'suresh.yadav@gmail.com',
    permanentAddress: 'H.No 12, Subhash Nagar, Bhopal, Madhya Pradesh',
    emergencyContactName: 'Devi Lal Yadav (Father)',
    emergencyContactPhone: '9876540009',
    joiningDate: '2025-05-01',
    isActive: true,
    isRentOverdue: true,
    rentAmountDue: 3500,
  },
  {
    id: 'hosteler-6',
    hostelId: 'hostel-1',
    roomId: 'room-104',
    name: 'Manish Patel',
    phone: '9876540010',
    email: 'manish.patel@gmail.com',
    permanentAddress: 'Sector 2, Gandhinagar, Gujarat',
    emergencyContactName: 'J.K. Patel (Father)',
    emergencyContactPhone: '9876540011',
    joiningDate: '2025-05-15',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-7',
    hostelId: 'hostel-1',
    roomId: 'room-104',
    name: 'Anish Gupta',
    phone: '9876540012',
    email: 'anish.gupta@gmail.com',
    permanentAddress: 'Ranchi, Jharkhand',
    emergencyContactName: 'S. Gupta (Father)',
    emergencyContactPhone: '9876540013',
    joiningDate: '2025-06-01',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-8',
    hostelId: 'hostel-1',
    roomId: 'room-104',
    name: 'Vikas Mishra',
    phone: '9876540014',
    email: 'vikas.mishra@gmail.com',
    permanentAddress: 'Varanasi, UP',
    emergencyContactName: 'A.K. Mishra (Father)',
    emergencyContactPhone: '9876540015',
    joiningDate: '2025-06-10',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-9',
    hostelId: 'hostel-1',
    roomId: 'room-202',
    name: 'Rohan Deshmukh',
    phone: '9876540016',
    email: 'rohan.desh@gmail.com',
    permanentAddress: 'Pune, Maharashtra',
    emergencyContactName: 'P. Deshmukh (Father)',
    emergencyContactPhone: '9876540017',
    joiningDate: '2025-06-15',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-10',
    hostelId: 'hostel-1',
    roomId: 'room-202',
    name: 'Devendra Joshi',
    phone: '9876540018',
    email: 'devendra.j@gmail.com',
    permanentAddress: 'Dehradun, Uttarakhand',
    emergencyContactName: 'H. Joshi (Father)',
    emergencyContactPhone: '9876540019',
    joiningDate: '2025-06-18',
    isActive: true,
    isRentOverdue: false,
  },

  // Hostel 2
  {
    id: 'hosteler-2-1',
    hostelId: 'hostel-2',
    roomId: 'room-2-101',
    name: 'Ketan Mehta',
    phone: '9876540020',
    email: 'ketan.mehta@gmail.com',
    permanentAddress: 'Ahmedabad, Gujarat',
    emergencyContactName: 'D. Mehta (Father)',
    emergencyContactPhone: '9876540021',
    joiningDate: '2025-02-01',
    isActive: true,
    isRentOverdue: false,
  },
  {
    id: 'hosteler-2-2',
    hostelId: 'hostel-2',
    roomId: 'room-2-102',
    name: 'Abhishek Roy',
    phone: '9876540022',
    email: 'abhishek.roy@gmail.com',
    permanentAddress: 'Kolkata, West Bengal',
    emergencyContactName: 'S.Roy (Father)',
    emergencyContactPhone: '9876540023',
    joiningDate: '2025-04-10',
    isActive: true,
    isRentOverdue: true,
    rentAmountDue: 8000,
  },

  // Inactive / Vacated Hostelers (Archived History)
  {
    id: 'hosteler-archived-1',
    hostelId: 'hostel-1',
    roomId: 'room-101',
    name: 'Sandip Paul',
    phone: '9876540024',
    email: 'sandip.paul@gmail.com',
    permanentAddress: 'Bhubaneswar, Odisha',
    emergencyContactName: 'B. Paul (Father)',
    emergencyContactPhone: '9876540025',
    joiningDate: '2024-06-01',
    isActive: false,
    vacateDate: '2024-12-31',
    vacateReason: 'Completed college internship',
    isRentOverdue: false,
  }
];

export const mockTransactions: Transaction[] = [
  // Income - Rent Collections
  { id: 'tx-1', hostelId: 'hostel-1', type: 'income', category: 'Rent', amount: 8500, date: '2026-07-01', paymentMode: 'upi', hostelerId: 'hosteler-1', hostelerName: 'Rahul Sharma', description: 'Rent for July 2026' },
  { id: 'tx-2', hostelId: 'hostel-1', type: 'income', category: 'Rent', amount: 4500, date: '2026-07-02', paymentMode: 'bank_transfer', hostelerId: 'hosteler-4', hostelerName: 'Rohit Verma', description: 'Rent for July 2026' },
  { id: 'tx-3', hostelId: 'hostel-1', type: 'income', category: 'Rent', amount: 6000, date: '2026-07-02', paymentMode: 'upi', hostelerId: 'hosteler-3', hostelerName: 'Vikram Singh', description: 'Rent for July 2026' },
  { id: 'tx-4', hostelId: 'hostel-2', type: 'income', category: 'Rent', amount: 12000, date: '2026-07-01', paymentMode: 'upi', hostelerId: 'hosteler-2-1', hostelerName: 'Ketan Mehta', description: 'Rent for July 2026' },

  // Expenses - Hostel 1
  { id: 'tx-5', hostelId: 'hostel-1', type: 'expense', category: 'Groceries', amount: 24500, date: '2026-07-02', description: 'Monthly vegetable & dry groceries purchase' },
  { id: 'tx-6', hostelId: 'hostel-1', type: 'expense', category: 'Salary', amount: 18000, date: '2026-07-05', description: 'Warden salary' },
  { id: 'tx-7', hostelId: 'hostel-1', type: 'expense', category: 'Utilities', amount: 12500, date: '2026-07-04', description: 'Electricity and water bills' },
  { id: 'tx-8', hostelId: 'hostel-1', type: 'expense', category: 'Repairs', amount: 3200, date: '2026-07-07', description: 'Plumbing leak repair in Room 104 bathroom' },

  // Expenses - Hostel 2
  { id: 'tx-9', hostelId: 'hostel-2', type: 'expense', category: 'Groceries', amount: 12000, date: '2026-07-03', description: 'Kitchen supplies' },
  { id: 'tx-10', hostelId: 'hostel-2', type: 'expense', category: 'Utilities', amount: 8000, date: '2026-07-05', description: 'Electricity bill' }
];

export const mockNotifications: AppNotification[] = [
  { id: 'notif-1', hostelId: 'hostel-1', title: 'Rent Due Alert', body: 'Amit Kumar (Room 102) rent is overdue by 5 days.', type: 'rent_due', date: '2026-07-06T10:00:00Z', isRead: false },
  { id: 'notif-2', hostelId: 'hostel-1', title: 'Room Full', body: 'Room 202 has reached its full occupancy of 2 beds.', type: 'occupancy', date: '2026-07-05T14:30:00Z', isRead: false },
  { id: 'notif-3', title: 'System Update', body: 'Software upgrade to Version 1.0 complete.', type: 'system', date: '2026-07-01T08:00:00Z', isRead: true },
  { id: 'notif-4', hostelId: 'hostel-1', title: 'Monthly Headcount', body: 'Monthly active hostelers count snapshot generated: 10 active.', type: 'active_hostelers', date: '2026-07-01T00:01:00Z', isRead: true }
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'log-1', userId: 'owner-1', userName: 'Ravi Kumar', action: 'Logged in to Green View Hostel', date: '2026-07-10T18:30:00Z', hostelName: 'Green View Hostel' },
  { id: 'log-2', userId: 'owner-1', userName: 'Ravi Kumar', action: 'Recorded rent payment of ₹8,500 from Rahul Sharma', date: '2026-07-10T15:20:00Z', hostelName: 'Green View Hostel' },
  { id: 'log-3', userId: 'owner-1', userName: 'Ravi Kumar', action: 'Allocated Hosteler Rohan Deshmukh to Room 202', date: '2026-07-09T11:15:00Z', hostelName: 'Green View Hostel' },
  { id: 'log-4', userId: 'super-admin', userName: 'Super Admin', action: 'Created Owner account for Priya Sharma', date: '2026-07-08T09:40:00Z' },
  { id: 'log-5', userId: 'super-admin', userName: 'Super Admin', action: 'Assigned Hostel Comfort Living to Ravi Kumar', date: '2026-07-07T16:10:00Z' },
  { id: 'log-6', userId: 'owner-2', userName: 'Priya Sharma', action: 'Added Room 101 to Sunrise Residency', date: '2026-07-06T10:05:00Z', hostelName: 'Sunrise Residency' }
];
