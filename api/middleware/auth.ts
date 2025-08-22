import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { JWTPayload, AuthRequest } from '../models/Admin';

// JWT Secret - should match the one in auth routes
const JWT_SECRET = process.env.JWT_SECRET || 'noko-cafe-secret-key-2024';

// Authentication middleware
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
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

    // Add admin info to request object
    req.admin = {
      id: admin.id,
      username: admin.username
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional middleware for routes that can work with or without authentication
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('id, username, is_active')
        .eq('id', decoded.adminId)
        .eq('is_active', true)
        .single();

      if (!error && admin) {
        req.admin = {
          id: admin.id,
          username: admin.username
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};