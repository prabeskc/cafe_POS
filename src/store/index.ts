import { create } from 'zustand';
import { Product, Category, CartItem, PaymentMethod, AppState } from '../types';
import { menuApi, ordersApi, categoriesApi, MenuItem, Category as ApiCategory } from '../services/api';

// Authentication types
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  admin: {
    id: string;
    username: string;
  } | null;
  authLoading: boolean;
  authError: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  clearAuthError: () => void;
}

// Default categories
const defaultCategories: Category[] = [
  { id: 'all', name: 'all', displayName: 'All Items' },
  { id: 'coffee', name: 'coffee', displayName: 'Coffee' },
  { id: 'snacks', name: 'snacks', displayName: 'Snacks' },
  { id: 'drinks', name: 'drinks', displayName: 'Cold Drinks' },
];

// Default products
const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Whipped Coffee',
    price: 45.00,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=whipped%20coffee%20in%20a%20white%20cup%20with%20cream%20swirl%20on%20top%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square',
    category: 'coffee',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Cold Coffee',
    price: 45.00,
    oldPrice: 50.00,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20cold%20coffee%20in%20tall%20glass%20with%20ice%20cubes%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square',
    category: 'coffee',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Cappuccino Coffee',
    price: 55.00,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cappuccino%20coffee%20with%20foam%20art%20in%20white%20ceramic%20cup%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square',
    category: 'coffee',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Filter Coffee',
    price: 22.00,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=filter%20coffee%20in%20traditional%20cup%20and%20saucer%2C%20dark%20roasted%20coffee%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square',
    category: 'coffee',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Bulletproof Coffee',
    price: 65.00,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bulletproof%20coffee%20with%20butter%20foam%20on%20top%20in%20modern%20mug%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square',
    category: 'coffee',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Authentic Espresso',
    price: 40.00,
    image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=authentic%20espresso%20shot%20in%20small%20white%20cup%20with%20crema%20on%20top%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square',
    category: 'coffee',
    createdAt: new Date().toISOString(),
  },
];

interface PosStore extends AppState, AuthState, AuthActions {
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Product actions
  loadProducts: (category?: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  
  // Category actions
  loadCategories: () => Promise<void>;
  addCategory: (category: { name: string; displayName: string; description?: string }) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  updateCategory: (categoryId: string, updates: { name?: string; displayName?: string; description?: string }) => Promise<void>;
  
  // Cart actions
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  processOrder: () => Promise<void>;
  
  // UI actions
  setActiveCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAddItemModalOpen: (isOpen: boolean) => void;
  setMenuManagementModalOpen: (isOpen: boolean) => void;
  
  // Sales data refresh
  triggerSalesRefresh: () => void;
  
  // Computed values
  getFilteredProducts: () => Product[];
  getCartTotal: () => { subtotal: number; tax: number; total: number };
  
  // Utility functions
  convertMenuItemToProduct: (item: MenuItem) => Product;
  convertProductToMenuItem: (product: Product) => Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
  
  // Comprehensive data refresh
  refreshAllData: () => Promise<void>;
}

export const usePosStore = create<PosStore>((set, get) => ({
  // Initial state
  products: defaultProducts,
  categories: defaultCategories,
  cart: [],
  activeCategory: 'all',
  searchQuery: '',
  paymentMethod: 'cash',
  isAddItemModalOpen: false,
  isMenuManagementModalOpen: false,
  
  // Sales data refresh trigger
  lastOrderCompletedAt: null,
  
  // Loading states
  isLoading: false,
  error: null,

  // Authentication state
  isAuthenticated: false,
  token: localStorage.getItem('noko_auth_token'),
  admin: null,
  authLoading: false,
  authError: null,

  // Utility functions
  convertMenuItemToProduct: (item: MenuItem): Product => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image_url || '',
    createdAt: item.created_at,
  }),

  convertProductToMenuItem: (product: Product) => ({
    name: product.name,
    price: product.price,
    category: product.category,
    image_url: product.image,
  }),

  // Product actions
  loadProducts: async (category?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const menuItems = await menuApi.getAll(category);
      
      if (!menuItems || menuItems.length === 0) {
        set({ products: defaultProducts, isLoading: false });
        return;
      }
      
      const products = menuItems.map(get().convertMenuItemToProduct);
      set({ products, isLoading: false });
    } catch (error) {
      // Fallback to default products if API fails
      set({ 
        products: defaultProducts,
        error: `API Error: ${error instanceof Error ? error.message : 'Failed to load products'}. Using default products.`,
        isLoading: false 
      });
    }
  },

  addProduct: async (productData) => {
    try {
      console.log('🏪 Store: Adding product with data:', productData);
      set({ isLoading: true, error: null });
      const menuItemData = get().convertProductToMenuItem({ ...productData, id: '', createdAt: '' });
      console.log('🔄 Store: Converted to menu item data:', menuItemData);
      const newMenuItem = await menuApi.create(menuItemData);
      console.log('✅ Store: API response:', newMenuItem);
      
      // Check if we got a valid response
      if (!newMenuItem || !newMenuItem.id) {
        throw new Error('Invalid response from server');
      }
      
      const newProduct = get().convertMenuItemToProduct(newMenuItem);
      
      set((state) => ({
        products: [...state.products, newProduct],
        isLoading: false,
        error: null // Clear any previous errors
      }));
      
      console.log('✅ Store: Product added successfully to store');
    } catch (error) {
      console.error('❌ Store: Error adding product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  removeProduct: async (productId) => {
    try {
      set({ isLoading: true, error: null });
      await menuApi.delete(productId);
      
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
        cart: state.cart.filter((item) => item.product.id !== productId),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove product',
        isLoading: false 
      });
      throw error;
    }
  },

  updateProduct: async (productId, updates) => {
    try {
      set({ isLoading: true, error: null });
      // Only convert the fields that are actually being updated
      const menuItemUpdates: Partial<Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>> = {};
      if (updates.name !== undefined) menuItemUpdates.name = updates.name;
      if (updates.price !== undefined) menuItemUpdates.price = updates.price;
      if (updates.category !== undefined) menuItemUpdates.category = updates.category;
      if (updates.image !== undefined) menuItemUpdates.image_url = updates.image;
      
      const updatedMenuItem = await menuApi.update(productId, menuItemUpdates);
      const updatedProduct = get().convertMenuItemToProduct(updatedMenuItem);
      
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? updatedProduct : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update product',
        isLoading: false 
      });
      throw error;
    }
  },

  // Category actions
  loadCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      const apiCategories = await categoriesApi.getAll();
      const categories: Category[] = apiCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        displayName: cat.display_name
      }));
      set({ categories, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load categories',
        isLoading: false 
      });
    }
  },

  addCategory: async (categoryData) => {
    try {
      set({ isLoading: true, error: null });
      const newApiCategory = await categoriesApi.create(categoryData);
      const newCategory: Category = {
        id: newApiCategory.id,
        name: newApiCategory.name,
        displayName: newApiCategory.display_name
      };
      
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add category',
        isLoading: false 
      });
      throw error;
    }
  },

  removeCategory: async (categoryId) => {
    // Don't allow removing the 'all' category
    if (categoryId === 'all') return;
    
    try {
      set({ isLoading: true, error: null });
      await categoriesApi.delete(categoryId);
      
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== categoryId),
        // If the active category is being removed, switch to 'all'
        activeCategory: state.activeCategory === categoryId ? 'all' : state.activeCategory,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove category',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCategory: async (categoryId, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedApiCategory = await categoriesApi.update(categoryId, updates);
      const updatedCategory: Category = {
        id: updatedApiCategory.id,
        name: updatedApiCategory.name,
        displayName: updatedApiCategory.display_name
      };
      
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === categoryId ? updatedCategory : cat
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update category',
        isLoading: false 
      });
      throw error;
    }
  },

  // Cart actions
  addToCart: (product) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        const newCartItem: CartItem = {
          id: `cart_${Date.now()}`,
          product,
          quantity: 1,
        };
        return {
          cart: [...state.cart, newCartItem],
        };
      }
    });
  },

  removeFromCart: (cartItemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== cartItemId),
    }));
  },

  updateCartItemQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  processOrder: async () => {
    try {
      const { cart, paymentMethod } = get();
      if (cart.length === 0) {
        throw new Error('Cart is empty');
      }

      set({ isLoading: true, error: null });
      
      const orderData = {
        items: cart.map(item => ({
          itemId: item.product.id,
          quantity: item.quantity
        })),
        total: get().getCartTotal().total,
        paymentMethod: paymentMethod
      };

      await ordersApi.create(orderData);
      
      // Clear cart after successful order and trigger sales refresh
      set({ cart: [], isLoading: false, lastOrderCompletedAt: Date.now() });
      
      // Trigger immediate sales data refresh
      get().triggerSalesRefresh();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to process order',
        isLoading: false 
      });
      throw error;
    }
  },

  // UI actions
  setActiveCategory: (categoryId) => {
    set({ activeCategory: categoryId });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  setAddItemModalOpen: (isOpen) => {
    set({ isAddItemModalOpen: isOpen });
  },

  setMenuManagementModalOpen: (isOpen) => {
    set({ isMenuManagementModalOpen: isOpen });
  },

  triggerSalesRefresh: () => {
    set({ lastOrderCompletedAt: Date.now() });
  },

  // Comprehensive data refresh function
  refreshAllData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Refresh products and categories in parallel
      await Promise.all([
        get().loadProducts(),
        get().loadCategories()
      ]);
      
      // Trigger sales data refresh
      get().triggerSalesRefresh();
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh data',
        isLoading: false 
      });
    }
  },

  // Computed values
  getFilteredProducts: () => {
    const { products, activeCategory, searchQuery } = get();
    let filtered = products;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  },

  getCartTotal: () => {
    const { cart } = get();
    const subtotal = cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    const tax = 0; // Set to 0 as per requirements
    const total = subtotal + tax;

    return { subtotal, tax, total };
  },

  // Authentication methods
  login: async (username: string, password: string) => {
    try {
      set({ authLoading: true, authError: null });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('noko_auth_token', data.token);
        
        set({
          isAuthenticated: true,
          token: data.token,
          admin: data.admin,
          authLoading: false,
          authError: null,
        });
        
        // Load initial data after successful login
        await get().refreshAllData();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({
        authLoading: false,
        authError: errorMessage,
        isAuthenticated: false,
        token: null,
        admin: null,
      });
      localStorage.removeItem('noko_auth_token');
      throw error;
    }
  },

  logout: () => {
    console.log('🚪 Logout function called');
    localStorage.removeItem('noko_auth_token');
    console.log('🗑️ Token removed from localStorage');
    set({
      isAuthenticated: false,
      token: null,
      admin: null,
      authError: null,
      // Clear sensitive data
      cart: [],
    });
    console.log('✅ Authentication state cleared');
    // Force a page reload to ensure clean state
    window.location.reload();
  },

  verifyToken: async () => {
    try {
      const token = get().token || localStorage.getItem('noko_auth_token');
      
      if (!token) {
        set({ isAuthenticated: false, admin: null });
        return false;
      }
      
      set({ authLoading: true });
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        set({
          isAuthenticated: true,
          token,
          admin: data.admin,
          authLoading: false,
          authError: null,
        });
        return true;
      } else {
        // Token is invalid
        localStorage.removeItem('noko_auth_token');
        set({
          isAuthenticated: false,
          token: null,
          admin: null,
          authLoading: false,
        });
        return false;
      }
    } catch (error) {
      localStorage.removeItem('noko_auth_token');
      set({
        isAuthenticated: false,
        token: null,
        admin: null,
        authLoading: false,
        authError: error instanceof Error ? error.message : 'Token verification failed',
      });
      return false;
    }
  },

  clearAuthError: () => {
    set({ authError: null });
  },

}));