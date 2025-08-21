import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  itemId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  items: IOrderItem[];
  total: number;
  paymentMethod: 'cash' | 'debit' | 'ewallet';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Item ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  items: {
    type: [orderItemSchema],
    required: [true, 'Items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'debit', 'ewallet'],
      message: 'Payment method must be one of: cash, debit, ewallet'
    },
    lowercase: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'cancelled'],
      message: 'Status must be one of: pending, completed, cancelled'
    },
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.itemId': 1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;