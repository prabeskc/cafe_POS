# POS System Backend API

A complete RESTful backend API for the Point of Sale (POS) system built with **Node.js**, **Express.js**, and **MongoDB** using **Mongoose**.

## 🚀 Features

- **Menu Management**: Full CRUD operations for menu items
- **Order Processing**: Create and manage customer orders
- **Data Validation**: Comprehensive input validation using express-validator
- **Error Handling**: Standardized error responses with proper HTTP status codes
- **CORS Support**: Configured for React frontend integration
- **MongoDB Integration**: Mongoose ODM with schema validation
- **TypeScript Support**: Full TypeScript implementation

## 📁 Project Structure

```
api/
├── config/
│   └── database.ts          # MongoDB connection configuration
├── models/
│   ├── MenuItem.ts           # Menu item schema and model
│   └── Order.ts              # Order schema and model
├── routes/
│   ├── auth.ts               # Authentication routes (existing)
│   ├── menu.ts               # Menu management endpoints
│   └── orders.ts             # Order management endpoints
├── test/
│   └── test-api.ps1          # PowerShell test script
├── app.ts                    # Express application setup
├── index.ts                  # Vercel deployment entry
└── server.ts                 # Local development server
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local installation or MongoDB Atlas)
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pos_system

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Start MongoDB
```bash
# For local MongoDB installation
mongod

# Or use MongoDB Atlas cloud database
# Update MONGODB_URI in .env with your Atlas connection string
```

### 4. Start the Server
```bash
# Development mode (with auto-restart)
npm run server:dev

# Or start both frontend and backend
npm run dev
```

The API server will be available at `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "success": true,
  "message": "ok"
}
```

---

## 🍽️ Menu Management API

### Get All Menu Items
```http
GET /api/menu
```

**Query Parameters:**
- `category` (optional): Filter by category (`coffee`, `snacks`, `drinks`)
- `limit` (optional): Number of items per page (default: 50, max: 100)
- `page` (optional): Page number (default: 1)

**Example:**
```http
GET /api/menu?category=coffee&limit=10&page=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Cappuccino",
      "price": 4.50,
      "category": "coffee",
      "imageUrl": "https://example.com/cappuccino.jpg",
      "createdAt": "2023-09-06T10:30:00.000Z",
      "updatedAt": "2023-09-06T10:30:00.000Z"
    }
  ],
  "count": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Create Menu Item
```http
POST /api/menu
```

**Request Body:**
```json
{
  "name": "Espresso",
  "price": 3.50,
  "category": "coffee",
  "imageUrl": "https://example.com/espresso.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Espresso",
    "price": 3.50,
    "category": "coffee",
    "imageUrl": "https://example.com/espresso.jpg",
    "createdAt": "2023-09-06T10:35:00.000Z",
    "updatedAt": "2023-09-06T10:35:00.000Z"
  },
  "message": "Menu item created successfully"
}
```

### Update Menu Item
```http
PUT /api/menu/:id
```

**Request Body:** (all fields optional)
```json
{
  "name": "Double Espresso",
  "price": 4.00
}
```

### Delete Menu Item
```http
DELETE /api/menu/:id
```

---

## 🛒 Order Management API

### Create Order
```http
POST /api/orders
```

**Request Body:**
```json
{
  "items": [
    {
      "itemId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "quantity": 2
    },
    {
      "itemId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "quantity": 1
    }
  ],
  "total": 12.50,
  "paymentMethod": "cash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "items": [
      {
        "itemId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "Cappuccino",
          "price": 4.50,
          "category": "coffee"
        },
        "quantity": 2
      }
    ],
    "total": 12.50,
    "paymentMethod": "cash",
    "status": "pending",
    "createdAt": "2023-09-06T10:40:00.000Z"
  },
  "message": "Order created successfully"
}
```

### Get All Orders
```http
GET /api/orders
```

**Query Parameters:**
- `limit` (optional): Number of orders per page (default: 20, max: 100)
- `page` (optional): Page number (default: 1)
- `status` (optional): Filter by status (`pending`, `completed`, `cancelled`)

### Get Single Order
```http
GET /api/orders/:id
```

### Update Order Status
```http
PUT /api/orders/:id/status
```

**Request Body:**
```json
{
  "status": "completed"
}
```

---

## 🗄️ Database Models

### MenuItem Schema
```typescript
{
  name: string;           // Required, 2-100 characters
  price: number;          // Required, minimum 0.01
  category: string;       // Required, enum: ['coffee', 'snacks', 'drinks']
  imageUrl?: string;      // Optional, valid URL format
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

### Order Schema
```typescript
{
  items: [{
    itemId: ObjectId;     // Reference to MenuItem
    quantity: number;     // Minimum 1
  }];
  total: number;          // Required, minimum 0
  paymentMethod: string;  // Required, enum: ['cash', 'debit', 'ewallet']
  status: string;         // enum: ['pending', 'completed', 'cancelled']
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

### HTTP Status Codes
- `200`: Success (GET, PUT)
- `201`: Created (POST)
- `400`: Bad Request (validation errors)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `DUPLICATE_NAME`: Menu item name already exists
- `INVALID_ITEMS`: One or more menu items not found in order
- `TOTAL_MISMATCH`: Order total doesn't match calculated total
- `FETCH_ERROR`: Database query failed
- `CREATE_ERROR`: Failed to create resource
- `UPDATE_ERROR`: Failed to update resource
- `DELETE_ERROR`: Failed to delete resource

---

## 🧪 Testing

### Manual Testing
Use the provided PowerShell test script:
```bash
powershell -ExecutionPolicy Bypass -File api/test/test-api.ps1
```

### API Testing Tools
- **Postman**: Import the API endpoints for comprehensive testing
- **curl**: Use curl commands for quick endpoint testing
- **Thunder Client**: VS Code extension for API testing

### Example curl Commands
```bash
# Health check
curl -X GET http://localhost:3001/api/health

# Get all menu items
curl -X GET http://localhost:3001/api/menu

# Create menu item
curl -X POST http://localhost:3001/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Coffee","price":4.50,"category":"coffee"}'

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"itemId":"MENU_ITEM_ID","quantity":1}],"total":4.50,"paymentMethod":"cash"}'
```

---

## 🚀 Deployment

### Vercel Deployment
The API is configured for Vercel deployment with the included `vercel.json` configuration.

### Environment Variables for Production
```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pos_system
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 🔧 Development Notes

### Without MongoDB
The server will start and run without MongoDB, but database-dependent endpoints will return errors. This is useful for:
- Testing server startup
- Frontend development
- CI/CD pipeline testing

### With MongoDB
For full functionality, install and start MongoDB:
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### CORS Configuration
The API is configured to accept requests from `http://localhost:5173` (React dev server). Update `CORS_ORIGIN` in `.env` for different frontend URLs.

---

## 📝 Integration with React Frontend

The API is designed to work seamlessly with the React POS frontend. Key integration points:

1. **Menu Items**: Sync with frontend product state
2. **Orders**: Process cart data from frontend
3. **CORS**: Configured for localhost:5173
4. **Error Handling**: Consistent error format for frontend consumption

### Frontend API Client Example
```javascript
// api/client.js
const API_BASE_URL = 'http://localhost:3001/api';

export const menuAPI = {
  getAll: () => fetch(`${API_BASE_URL}/menu`).then(res => res.json()),
  create: (item) => fetch(`${API_BASE_URL}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).then(res => res.json())
};

export const orderAPI = {
  create: (order) => fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }).then(res => res.json())
};
```

---

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add proper error handling for new endpoints
3. Include input validation using express-validator
4. Update this README for new features
5. Test endpoints before committing

---

## 📄 License

This project is part of the POS system implementation for educational and commercial use.

---

**🎉 Your POS Backend API is ready to serve your React frontend!**