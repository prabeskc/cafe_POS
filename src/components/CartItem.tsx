import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { usePosStore } from '../store';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateCartItemQuantity, removeFromCart } = usePosStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item.id);
    } else {
      updateCartItemQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  const itemTotal = item.product.price * item.quantity;

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-800 text-sm leading-tight">
            {item.product.name}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            ₹{item.product.price.toFixed(2)}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium text-gray-800">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Item Total */}
        <div className="text-right">
          <span className="font-semibold text-gray-800">
            ₹{itemTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}