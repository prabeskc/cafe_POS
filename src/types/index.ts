export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
}

export type PaymentMethod = 'cash' | 'debit' | 'ewallet';

export interface AppState {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  activeCategory: string;
  searchQuery: string;
  paymentMethod: PaymentMethod;
  isAddItemModalOpen: boolean;
  isMenuManagementModalOpen: boolean;
  lastOrderCompletedAt: number | null;
}