export interface Event {
  id: string;
  name: string;
  address: string;
  dateTime: string;
  poc: string;
  description: string;
  expectedAttendees: number;
  expenses: Expenses;
  activities: Activities;
  products: Product[];
  editLog: EditLogEntry[];
  createdBy?: string;
  createdAt?: string;
}

export interface EditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  changes: string;
}

export interface Expenses {
  transpo: number;
  mealAllowance: number;
  customExpenses: CustomExpense[];
}

export interface CustomExpense {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Activities {
  giveaway: string;
  selling: string;
  boothItems: string;
  sample: string;
  eventFlow: string;
}

export interface Product {
  id: string;
  price: number;
  product: string;
  variant: string;
  size: string;
  qty: number;
  image: string;
  sold: boolean;
  soldQty: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
