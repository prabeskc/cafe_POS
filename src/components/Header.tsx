import React from 'react';
import { Search, Settings, Printer, RotateCcw, LogOut } from 'lucide-react';
import { usePosStore } from '../store';
import { usePrint } from '../hooks/usePrint';
import nokoLogo from '../assets/noko-logo.svg';

export function Header() {
  const { searchQuery, setSearchQuery, setMenuManagementModalOpen, clearCart, logout, admin } = usePosStore();
  const { printReceipt } = usePrint();

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      clearCart();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="bg-emerald-500 backdrop-blur-md border-b border-emerald-600/20 shadow-lg px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <img 
            src={nokoLogo} 
            alt="NOKO Café Logo" 
            className="w-12 h-12"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">
              NOKO <span className="text-emerald-200 text-lg font-normal">café</span>
            </h1>
            {admin && (
              <p className="text-emerald-200 text-sm">
                Welcome, {admin.username}
              </p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none transition-all duration-300 shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClearCart}
            className="flex items-center space-x-2 px-4 py-2 text-emerald-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 bg-white/90 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            title="Clear Cart"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Clear Cart</span>
          </button>

          <button
            onClick={() => setMenuManagementModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Edit Menu</span>
          </button>

          <button
            onClick={printReceipt}
            className="flex items-center space-x-2 px-4 py-2 text-emerald-600 hover:text-white hover:bg-emerald-600 bg-white/90 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            title="Print Receipt"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Print</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-white hover:text-emerald-600 hover:bg-white bg-red-500/90 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}