import React from 'react';
import { CreditCard, Wallet, Banknote } from 'lucide-react';
import { CartItem } from './CartItem';
import { usePosStore } from '../store';
import { usePrint } from '../hooks/usePrint';
import { cn } from '../lib/utils';

export function CartSidebar() {
  const { 
    cart, 
    getCartTotal, 
    paymentMethod, 
    setPaymentMethod, 
    clearCart,
    processOrder,
    isLoading,
    error
  } = usePosStore();
  const { printReceipt } = usePrint();

  const { subtotal, tax, total } = getCartTotal();
  const orderNumber = `#${Date.now().toString().slice(-4)}`;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before placing order.');
      return;
    }

    const confirmed = window.confirm(
      `Place order ${orderNumber} for ₹${total.toFixed(2)}?`
    );
    
    if (confirmed) {
      try {
        // Process order through API
        await processOrder();
        
        // Print receipt if user wants
        const shouldPrint = window.confirm('Would you like to print the receipt?');
        if (shouldPrint) {
          printReceipt();
        }
        
        alert('Order placed successfully!');
      } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      }
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'debit', label: 'Debit Card', icon: CreditCard },
    { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
  ] as const;

  return (
    <aside className="w-80 lg:w-80 md:w-72 bg-white/80 backdrop-blur-md border-l border-white/30 shadow-lg flex flex-col">
      {/* Cart Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 md:p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-white">Cart Items</h2>
          {cart.length > 0 && (
            <span className="text-xs md:text-sm text-orange-100 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
              {cart.length} item{cart.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gradient-to-b from-white/50 to-indigo-50/30">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">🛒</div>
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      {cart.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-white/30 p-3 md:p-4 shadow-lg">
          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax(%)</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-3 md:mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Payment Method</h3>
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      'flex flex-col items-center p-2 md:p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105',
                      isSelected
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-lg shadow-indigo-500/20'
                        : 'border-white/30 bg-white/70 backdrop-blur-sm text-gray-600 hover:border-indigo-200 hover:shadow-md'
                    )}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5 mb-1" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 md:py-4 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      )}
    </aside>
  );
}