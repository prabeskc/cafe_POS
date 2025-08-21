const API_BASE_URL = 'http://localhost:3001/api';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Menu API functions
export const menuApi = {
  // Get all menu items
  async getAll(category?: string): Promise<MenuItem[]> {
    const url = new URL(`${API_BASE_URL}/menu`);
    if (category && category !== 'all') {
      url.searchParams.append('category', category);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch menu items: ${response.statusText}`);
    }
    
    const result: ApiResponse<MenuItem[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch menu items');
    }
    
    return result.data;
  },

  // Create new menu item
  async create(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const requestBody: any = {
      name: item.name,
      price: item.price,
      category: item.category
    };
    
    // Include imageUrl if it's provided and is either a valid HTTP URL or data URL (base64)
    if (item.image_url && item.image_url.trim() !== '') {
      const isHttpUrl = item.image_url.startsWith('http');
      const isDataUrl = item.image_url.startsWith('data:image/');
      
      if (isHttpUrl || isDataUrl) {
        requestBody.imageUrl = item.image_url;
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create menu item: ${response.statusText}`);
    }
    
    const result: ApiResponse<MenuItem> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create menu item');
    }
    
    return result.data;
  },

  // Update menu item
  async update(id: string, updates: Partial<Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>>): Promise<MenuItem> {
    const requestBody: any = {};
    
    if (updates.name !== undefined) requestBody.name = updates.name;
    if (updates.price !== undefined) requestBody.price = updates.price;
    if (updates.category !== undefined) requestBody.category = updates.category;
    
    // Include imageUrl if it's provided and is either a valid HTTP URL or data URL (base64)
    if (updates.image_url !== undefined && updates.image_url.trim() !== '') {
      const isHttpUrl = updates.image_url.startsWith('http');
      const isDataUrl = updates.image_url.startsWith('data:image/');
      
      if (isHttpUrl || isDataUrl) {
        requestBody.imageUrl = updates.image_url;
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update menu item: ${response.statusText}`);
    }
    
    const result: ApiResponse<MenuItem> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update menu item');
    }
    
    return result.data;
  },

  // Delete menu item
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete menu item: ${response.statusText}`);
    }
    
    const result: ApiResponse<MenuItem> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete menu item');
    }
  },
};

// Orders API functions
export const ordersApi = {
  // Create new order
  async create(orderData: {
    items: { itemId: string; quantity: number }[];
    total: number;
    paymentMethod: string;
  }): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: orderData.items,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }
    
    const result: ApiResponse<Order> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create order');
    }
    
    return result.data;
  },

  // Get all orders
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/orders`);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    
    const result: ApiResponse<Order[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch orders');
    }
    
    return result.data;
  },

  // Get single order
  async getById(id: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }
    
    const result: ApiResponse<Order> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch order');
    }
    
    return result.data;
  },

  // Get sales analytics
  async getSalesAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const url = new URL(`${API_BASE_URL}/orders/analytics/daily`);
    if (startDate) {
      url.searchParams.append('startDate', startDate);
    }
    if (endDate) {
      url.searchParams.append('endDate', endDate);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch sales analytics: ${response.statusText}`);
    }
    
    const result: ApiResponse<any> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch sales analytics');
    }
    
    return result.data;
  },
};

// Categories API functions
export const categoriesApi = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    
    const result: ApiResponse<Category[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch categories');
    }
    
    return result.data;
  },

  // Create new category
  async create(category: {
    name: string;
    displayName: string;
    description?: string;
  }): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create category: ${response.statusText}`);
    }
    
    const result: ApiResponse<Category> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create category');
    }
    
    return result.data;
  },

  // Update category
  async update(id: string, updates: {
    name?: string;
    displayName?: string;
    description?: string;
  }): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update category: ${response.statusText}`);
    }
    
    const result: ApiResponse<Category> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update category');
    }
    
    return result.data;
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete category: ${response.statusText}`);
    }
    
    const result: ApiResponse<any> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete category');
    }
  },
};