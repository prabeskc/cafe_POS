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

// GET /api/menu - Get all menu items
router.get('/', [
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

    // Build query filter
    const filter: any = {};
    if (category) {
      filter.category = category;
    }

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
router.post('/', [
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
    .withMessage('Category is required')
    .custom(async (value) => {
      // Check if category exists in categories table
      const { data: category, error } = await supabase
        .from('categories')
        .select('id')
        .eq('id', value)
        .single();
      
      if (error || !category) {
        throw new Error('Category does not exist');
      }
      return true;
    }),
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
    console.log('📝 POST /api/menu - Request body:', JSON.stringify(req.body, null, 2));
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
      console.error('❌ Supabase insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Menu item created successfully:', savedItem);
    res.status(201).json({
      success: true,
      data: savedItem,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating menu item:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create menu item',
        code: 'CREATE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// PUT /api/menu/:id - Update menu item
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid menu item ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  body('category')
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage('Category must be a valid string')
    .custom(async (value) => {
      if (!value) return true; // Skip validation if optional and not provided
      // Check if category exists in categories table
      const { data: category, error } = await supabase
        .from('categories')
        .select('id')
        .eq('id', value)
        .single();
      
      if (error || !category) {
        throw new Error('Category does not exist');
      }
      return true;
    }),
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
    const { id } = req.params;
    const updates = req.body;

    // Prepare update object with correct field names
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.price) updateData.price = updates.price;
    if (updates.category) updateData.category = updates.category;
    if (updates.imageUrl) updateData.image_url = updates.imageUrl;

    // Update menu item in Supabase
    const { data: updatedItem, error: updateError } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Menu item not found',
            code: 'NOT_FOUND'
          }
        });
      }
      throw updateError;
    }

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update menu item',
        code: 'UPDATE_ERROR'
      }
    });
  }
});

// DELETE /api/menu/:id - Delete menu item
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid menu item ID'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete menu item from Supabase
    const { data: deletedItem, error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Menu item not found',
            code: 'NOT_FOUND'
          }
        });
      }
      throw deleteError;
    }

    res.status(200).json({
      success: true,
      data: deletedItem,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete menu item',
        code: 'DELETE_ERROR'
      }
    });
  }
});

export default router;