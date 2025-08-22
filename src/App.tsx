import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { MenuManagementModal } from './components/MenuManagementModal';
import { Login } from './components/Login';
import { usePosStore } from './store';

function App() {
  const { 
    loadProducts, 
    loadCategories, 
    isMenuManagementModalOpen, 
    setMenuManagementModalOpen,
    // Authentication state and actions
    isAuthenticated,
    authLoading,
    authError,
    login,
    verifyToken,
    clearAuthError
  } = usePosStore();

  // Check authentication status on app start
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await verifyToken();
      if (isValid) {
        // Load initial data only if authenticated
        await loadProducts();
        await loadCategories();
      }
    };
    
    checkAuth();
  }, [verifyToken, loadProducts, loadCategories]);

  // Handle login
  const handleLogin = async (username: string, password: string) => {
    clearAuthError();
    await login(username, password);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-emerald-50 to-mint-100">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Categories */}
        <div className="hidden md:block">
          <CategorySidebar />
        </div>
        
        {/* Center - Product Grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid />
        </div>
        
        {/* Right Sidebar - Cart */}
        <div className="hidden lg:block">
          <CartSidebar />
        </div>
      </div>
      
      {/* Mobile Navigation - Categories (visible on small screens) */}
      <div className="md:hidden bg-white border-t border-gray-200 p-2">
        <CategorySidebar />
      </div>
      
      {/* Mobile Cart Toggle (visible on medium screens when cart is hidden) */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button 
          className="bg-emerald-500 text-white p-3 rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
          onClick={() => {/* TODO: Add mobile cart modal */}}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
          </svg>
        </button>
      </div>
      
      {/* Modals */}
      <MenuManagementModal 
        isOpen={isMenuManagementModalOpen} 
        onClose={() => setMenuManagementModalOpen(false)} 
      />
    </div>
  );
}

export default App;
