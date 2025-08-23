/**
 * This is a consolidated API server for Vercel deployment
 * All routes are inline to minimize serverless functions
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, param, query, validationResult } from 'express-validator';
import testConnection from './config/database.js';
import { supabase } from './config/database.js';
import { Admin, AdminLoginRequest, AdminLoginResponse, JWTPayload } from './models/Admin.js';

// Test Supabase connection
testConnection();

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'noko-cafe-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

const app: express.Application = express();

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    (req as any).admin = decoded;
    next();
  });
};

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Allow any Vercel deployment
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * API Routes - All consolidated inline
 */

// AUTH ROUTES
// POST /api/auth/login - Admin login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: AdminLoginRequest = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin user in database
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Update last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate JWT token
    const payload: JWTPayload = {
      adminId: admin.id,
      username: admin.username
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return success response
    const response: AdminLoginResponse = {
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        last_login: admin.last_login
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/verify - Verify token
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if admin still exists and is active
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, is_active')
      .eq('id', decoded.adminId)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// POST /api/auth/logout - Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// CATEGORIES ROUTES
// GET /api/categories - Get all categories
app.get('/api/categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch categories',
        code: 'FETCH_ERROR'
      }
    });
  }
});

// POST /api/categories - Create new category
app.post('/api/categories', [
  authenticateToken,
  body('name')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('displayName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { name, displayName, description } = req.body;

    // Check if category with same name already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .single();

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Category with this name already exists',
          code: 'DUPLICATE_CATEGORY'
        }
      });
    }

    // Create new category
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name: name.toLowerCase(),
        display_name: displayName,
        description: description || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create category',
        code: 'CREATE_ERROR'
      }
    });
  }
});

// MENU ROUTES
// GET /api/menu - Get all menu items
app.get('/api/menu', [
  authenticateToken,
  query('category').optional().isString().withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { category, limit = '50', page = '1' } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Build Supabase query
    let query = supabase
      .from('menu_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limitNum - 1);

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: items, error, count: total } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: items,
      count: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch menu items',
        code: 'FETCH_ERROR'
      }
    });
  }
});

// POST /api/menu - Create new menu item
app.post('/api/menu', [
  authenticateToken,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  body('category')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Category is required'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      const isHttpUrl = /^https?:\/\/.+/.test(value);
      const isDataUrl = /^data:image\/.+/.test(value);
      if (!isHttpUrl && !isDataUrl) {
        throw new Error('Image must be a valid HTTP URL or data URL');
      }
      return true;
    }),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { name, price, category, imageUrl } = req.body;

    // Check if item with same name already exists
    const { data: existingItems, error: checkError } = await supabase
      .from('menu_items')
      .select('id')
      .ilike('name', name)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingItems && existingItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Menu item with this name already exists',
          code: 'DUPLICATE_NAME'
        }
      });
    }

    // Insert new menu item
    const { data: savedItem, error: insertError } = await supabase
      .from('menu_items')
      .insert({
        name,
        price,
        category: category,
        image_url: imageUrl
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      success: true,
      data: savedItem,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create menu item',
        code: 'CREATE_ERROR'
      }
    });
  }
});

// ORDERS ROUTES
// POST /api/orders - Create new order
app.post('/api/orders', [
  authenticateToken,
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.itemId')
    .isUUID()
    .withMessage('Invalid item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('total')
    .isFloat({ min: 0 })
    .withMessage('Total must be a positive number'),
  body('paymentMethod')
    .isIn(['cash', 'debit', 'ewallet'])
    .withMessage('Payment method must be one of: cash, debit, ewallet'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { items, total, paymentMethod } = req.body;

    // Validate that all items exist in the database
    const itemIds = items.map((item: any) => item.itemId);
    const { data: existingItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .in('id', itemIds);
    
    if (itemsError) {
      throw itemsError;
    }
    
    if (!existingItems || existingItems.length !== itemIds.length) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'One or more menu items not found',
          code: 'INVALID_ITEMS'
        }
      });
    }

    // Calculate expected total to verify client calculation
    let calculatedTotal = 0;
    for (const orderItem of items) {
      const menuItem = existingItems.find(item => item.id === orderItem.itemId);
      if (menuItem) {
        calculatedTotal += menuItem.price * orderItem.quantity;
      }
    }

    // Allow small floating point differences (within 0.01)
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Total mismatch. Expected: ${calculatedTotal.toFixed(2)}, Received: ${total.toFixed(2)}`,
          code: 'TOTAL_MISMATCH'
        }
      });
    }

    // Create order in Supabase
    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        items: items.map((item: any) => ({
          itemId: item.itemId,
          quantity: item.quantity
        })),
        total: calculatedTotal,
        payment_method: paymentMethod.toLowerCase()
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }
    
    // Get the order with menu item details
    const populatedOrder = {
      ...savedOrder,
      items: items.map((item: any) => {
        const menuItem = existingItems.find(mi => mi.id === item.itemId);
        return {
          itemId: item.itemId,
          quantity: item.quantity,
          menuItem
        };
      })
    };

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create order',
        code: 'CREATE_ERROR'
      }
    });
  }
});

// GET /api/orders - Get all orders
app.get('/api/orders', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('status').optional().isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { limit = '20', page = '1', status } = req.query;
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Build Supabase query for orders
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limitNum - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count: total } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: orders,
      count: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders',
        code: 'FETCH_ERROR'
      }
    });
  }
});

// GET /api/orders/analytics/daily - Get daily sales analytics
app.get('/api/orders/analytics/daily', [
  authenticateToken,
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set default date range (last 7 days) if not provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const start = startDate ? new Date(startDate as string) : defaultStartDate;
    const end = endDate ? new Date(endDate as string) : defaultEndDate;
    
    // Ensure end date is end of day
    end.setHours(23, 59, 59, 999);
    
    // Query orders from Supabase within date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Get menu items for item details
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*');
    
    if (menuError) {
      throw menuError;
    }
    
    // Process orders to calculate analytics
    const dailySalesMap = new Map();
    const itemStatsMap = new Map();
    let totalRevenue = 0;
    let totalTransactions = orders?.length || 0;
    
    orders?.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      totalRevenue += order.total;
      
      // Initialize daily sales entry
      if (!dailySalesMap.has(orderDate)) {
        dailySalesMap.set(orderDate, {
          date: orderDate,
          transactions: 0,
          revenue: 0,
          items: [],
          paymentMethods: { cash: 0, debit: 0, ewallet: 0 }
        });
      }
      
      const dayData = dailySalesMap.get(orderDate);
      dayData.transactions += 1;
      dayData.revenue += order.total;
      
      // Count payment methods
      const paymentMethod = order.payment_method || 'cash';
      if (dayData.paymentMethods[paymentMethod] !== undefined) {
        dayData.paymentMethods[paymentMethod] += 1;
      } else {
        dayData.paymentMethods.cash += 1; // Default to cash for unknown methods
      }
      
      // Process order items
      order.items?.forEach((orderItem: any) => {
        const menuItem = menuItems?.find(mi => mi.id === orderItem.itemId);
        if (menuItem) {
          const itemRevenue = menuItem.price * orderItem.quantity;
          
          // Add to daily items
          const existingDayItem = dayData.items.find((item: any) => item.itemId === orderItem.itemId);
          if (existingDayItem) {
            existingDayItem.quantity += orderItem.quantity;
            existingDayItem.revenue += itemRevenue;
          } else {
            dayData.items.push({
              itemId: orderItem.itemId,
              name: menuItem.name,
              quantity: orderItem.quantity,
              revenue: itemRevenue,
              category: menuItem.category
            });
          }
          
          // Add to overall item stats
          const itemKey = orderItem.itemId;
          if (!itemStatsMap.has(itemKey)) {
            itemStatsMap.set(itemKey, {
              itemId: orderItem.itemId,
              name: menuItem.name,
              quantity: 0,
              revenue: 0,
              category: menuItem.category
            });
          }
          
          const itemStats = itemStatsMap.get(itemKey);
          itemStats.quantity += orderItem.quantity;
          itemStats.revenue += itemRevenue;
        }
      });
    });
    
    // Convert maps to arrays and sort
    const dailySales = Array.from(dailySalesMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const topItems = Array.from(itemStatsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 items
    
    // Calculate average order value
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Calculate total days with sales
    const totalDays = dailySales.length;
    
    const analyticsData = {
      summary: {
        totalRevenue,
        totalTransactions,
        averageOrderValue,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        }
      },
      dailySales,
      topItems,
      totalDays
    };
    
    res.status(200).json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch sales analytics',
        code: 'ANALYTICS_ERROR'
      }
    });
  }
});

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error instanceof Error && 'errors' in error ? Object.values((error as any).errors || {}).map((err: any) => err.message) : []
      }
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid ID format',
        code: 'INVALID_ID'
      }
    });
  }
  
  // MongoDB duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Duplicate entry found',
        code: 'DUPLICATE_ERROR'
      }
    });
  }
  
  // Default server error
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    }
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;