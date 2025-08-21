import express, { Request, Response } from 'express';
import { supabase } from '../config/database.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: express.NextFunction) => {
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

// POST /api/orders - Create new order
router.post('/', [
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
        total: calculatedTotal, // Use calculated total for accuracy
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
router.get('/', [
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

    // Build query filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

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

// GET /api/orders/:id - Get single order
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid order ID'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get order from Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found',
            code: 'NOT_FOUND'
          }
        });
      }
      throw orderError;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch order',
        code: 'FETCH_ERROR'
      }
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', [
  param('id').isUUID().withMessage('Invalid order ID'),
  body('status')
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, completed, cancelled'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Update order status in Supabase
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found',
            code: 'NOT_FOUND'
          }
        });
      }
      throw updateError;
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update order status',
        code: 'UPDATE_ERROR'
      }
    });
  }
});

// GET /api/orders/analytics/daily - Get daily sales analytics
router.get('/analytics/daily', [
  query('startDate').optional().isISO8601().withMessage('Start date must be in ISO format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in ISO format'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Set time to start/end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get orders within date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, items, total, created_at, payment_method')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    // Get all menu items for item details
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price, category');

    if (menuError) {
      throw menuError;
    }

    // Create a map for quick menu item lookup
    const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

    // Group orders by date and calculate analytics
    const dailySales: { [date: string]: any } = {};
    let totalRevenue = 0;
    let totalTransactions = 0;
    const itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number; category: string } } = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      
      if (!dailySales[orderDate]) {
        dailySales[orderDate] = {
          date: orderDate,
          transactions: 0,
          revenue: 0,
          items: {},
          paymentMethods: { cash: 0, debit: 0, ewallet: 0 }
        };
      }

      // Update daily totals
      dailySales[orderDate].transactions += 1;
      dailySales[orderDate].revenue += order.total;
      dailySales[orderDate].paymentMethods[order.payment_method] += 1;
      
      // Update overall totals
      totalRevenue += order.total;
      totalTransactions += 1;

      // Process order items
      order.items.forEach((orderItem: any) => {
        const menuItem = menuItemMap.get(orderItem.itemId);
        if (menuItem) {
          const itemRevenue = menuItem.price * orderItem.quantity;
          
          // Update daily item sales
          if (!dailySales[orderDate].items[orderItem.itemId]) {
            dailySales[orderDate].items[orderItem.itemId] = {
              name: menuItem.name,
              quantity: 0,
              revenue: 0,
              category: menuItem.category
            };
          }
          dailySales[orderDate].items[orderItem.itemId].quantity += orderItem.quantity;
          dailySales[orderDate].items[orderItem.itemId].revenue += itemRevenue;

          // Update overall item sales
          if (!itemSales[orderItem.itemId]) {
            itemSales[orderItem.itemId] = {
              name: menuItem.name,
              quantity: 0,
              revenue: 0,
              category: menuItem.category
            };
          }
          itemSales[orderItem.itemId].quantity += orderItem.quantity;
          itemSales[orderItem.itemId].revenue += itemRevenue;
        }
      });
    });

    // Convert daily sales to array and sort by date
     const dailySalesArray = Object.values(dailySales)
       .map((day: any) => ({
         ...day,
         items: Object.entries(day.items).map(([itemId, data]) => ({
           itemId,
           ...(data as any)
         }))
       }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Convert item sales to array and sort by quantity
    const topItems = Object.entries(itemSales)
      .map(([itemId, data]) => ({
        itemId,
        ...data
      }))
      .sort((a, b) => b.quantity - a.quantity);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTransactions,
          averageOrderValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
          dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          }
        },
        dailySales: dailySalesArray,
        topItems: topItems.slice(0, 10), // Top 10 items
        totalDays: dailySalesArray.length
      }
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

export default router;