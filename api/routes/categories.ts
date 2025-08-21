import express, { Request, Response } from 'express';
import { supabase } from '../config/database.js';
import { body, param, validationResult } from 'express-validator';

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

// GET /api/categories - Get all categories
router.get('/', async (req: Request, res: Response) => {
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
router.post('/', [
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

// PUT /api/categories/:id - Update category
router.put('/:id', [
  param('id').isString().withMessage('Invalid category ID'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('displayName')
    .optional()
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
    const { id } = req.params;
    const { name, displayName, description } = req.body;

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingCategory.name) {
      const { data: duplicateCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single();

      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Category with this name already exists',
            code: 'DUPLICATE_CATEGORY'
          }
        });
      }
    }

    // Update category
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.toLowerCase();
    if (displayName !== undefined) updateData.display_name = displayName;
    if (description !== undefined) updateData.description = description;

    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update category',
        code: 'UPDATE_ERROR'
      }
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', [
  param('id').isString().withMessage('Invalid category ID'),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single();

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Check if category is being used by menu items
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category', existingCategory.name)
      .limit(1);

    if (menuItems && menuItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete category that is being used by menu items',
          code: 'CATEGORY_IN_USE'
        }
      });
    }

    // Delete category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete category',
        code: 'DELETE_ERROR'
      }
    });
  }
});

export default router;