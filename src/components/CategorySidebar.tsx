import React, { useState, useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import { usePosStore } from '../store';
import { cn } from '../lib/utils';
import { DailySalesModal } from './DailySalesModal';

export function CategorySidebar() {
  const { categories, activeCategory, setActiveCategory, lastOrderCompletedAt } = usePosStore();
  const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState(false);
  const [shouldRefreshSales, setShouldRefreshSales] = useState(false);
  const lastOrderTimeRef = useRef<number | null>(null);

  // Monitor for new orders and trigger sales refresh
  useEffect(() => {
    if (lastOrderCompletedAt && lastOrderCompletedAt !== lastOrderTimeRef.current) {
      lastOrderTimeRef.current = lastOrderCompletedAt;
      setShouldRefreshSales(true);
    }
  }, [lastOrderCompletedAt]);

  const handleSalesRefresh = () => {
    setShouldRefreshSales(false);
  };

  const handleOpenSalesModal = () => {
    setIsDailySalesModalOpen(true);
    // Reset refresh flag when modal opens
    setShouldRefreshSales(false);
  };

  return (
    <aside className="w-48 md:w-48 w-full bg-white/90 backdrop-blur-md border-r border-emerald-200/50 shadow-lg flex flex-col md:flex-col flex-row md:h-auto h-auto overflow-x-auto md:overflow-x-visible">
      {/* Category List */}
      <nav className="flex-1 p-4 md:p-4 p-2">
        <ul className="space-y-2 md:space-y-2 space-x-2 md:space-x-0 flex md:flex-col flex-row md:w-auto w-max">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <li key={category.id} className="md:w-auto w-auto flex-shrink-0">
                <button
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm md:text-base whitespace-nowrap transform hover:scale-105',
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md backdrop-blur-sm'
                  )}
                >
                  {category.displayName}
                </button>
              </li>
            );
          })}
        </ul>
        
        {/* Daily Sales Button - Moved higher, after categories */}
        <div className="mt-6 md:mt-8 hidden md:block">
          <button
            onClick={handleOpenSalesModal}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-emerald-700 hover:text-white hover:bg-emerald-500 bg-white/90 backdrop-blur-sm rounded-xl transition-all duration-300 font-semibold border border-emerald-200/50 shadow-sm hover:shadow-lg transform hover:scale-105"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Daily Sales</span>
            {shouldRefreshSales && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="New data available" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Daily Sales Button */}
      <div className="md:hidden p-2 flex-shrink-0">
        <button
          onClick={handleOpenSalesModal}
          className="flex items-center space-x-2 px-4 py-3 text-emerald-700 hover:text-white hover:bg-emerald-500 bg-white/90 backdrop-blur-sm rounded-xl transition-all duration-300 font-semibold border border-emerald-200/50 shadow-sm hover:shadow-lg whitespace-nowrap relative"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales</span>
          {shouldRefreshSales && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" title="New data available" />
          )}
        </button>
      </div>

      {/* Daily Sales Modal */}
      <DailySalesModal
        isOpen={isDailySalesModalOpen}
        onClose={() => setIsDailySalesModalOpen(false)}
        onRefresh={handleSalesRefresh}
      />
    </aside>
  );
}