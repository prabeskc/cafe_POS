import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, TrendingUp, ShoppingCart, DollarSign, RefreshCw } from 'lucide-react';
import { ordersApi } from '../services/api';

interface DailySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface SalesData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  dailySales: Array<{
    date: string;
    transactions: number;
    revenue: number;
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      revenue: number;
      category: string;
    }>;
    paymentMethods: {
      cash: number;
      debit: number;
      ewallet: number;
    };
  }>;
  topItems: Array<{
    itemId: string;
    name: string;
    quantity: number;
    revenue: number;
    category: string;
  }>;
  totalDays: number;
}

// Empty initial data structure
const emptyData: SalesData = {
  summary: {
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  },
  dailySales: [],
  topItems: [],
  totalDays: 0
};

// Simple data cache
let cachedData: SalesData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function DailySalesModal({ isOpen, onClose, onRefresh }: DailySalesModalProps) {
  const [salesData, setSalesData] = useState<SalesData>(emptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Fetch real data function
  const fetchSalesData = async () => {
    // Check cache first
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      setSalesData(cachedData);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const apiData = await ordersApi.getSalesAnalytics(dateRange.start, dateRange.end);
      
      // Cache the data
      cachedData = apiData;
      cacheTimestamp = now;
      
      setSalesData(apiData);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Sales analytics API error:', err);
      setError('Failed to fetch sales data from database. Please try refreshing.');
      setSalesData(emptyData);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch data when modal opens or date range changes
  useEffect(() => {
    if (isOpen) {
      fetchSalesData();
    }
  }, [isOpen, dateRange.start, dateRange.end]);

  // Refresh function
  const handleRefresh = () => {
    // Clear cache to force fresh data
    cachedData = null;
    cacheTimestamp = 0;
    fetchSalesData();
  };

  // Handle date range changes
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    
    // Clear cache when date range changes
    cachedData = null;
    cacheTimestamp = 0;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedDayData = selectedDate 
    ? salesData?.dailySales.find(day => day.date === selectedDate)
    : null;

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Daily Sales Analytics</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh sales data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading sales data...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Always show data (no conditional rendering to prevent flickering) */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-800">{formatCurrency(salesData.summary.totalRevenue)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-800">{salesData.summary.totalTransactions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-800">{formatCurrency(salesData.summary.averageOrderValue)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Active Days</p>
                    <p className="text-2xl font-bold text-orange-800">{salesData.totalDays}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales List */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Sales</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {salesData.dailySales.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No sales data available for the selected period.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {salesData.dailySales.map((day) => (
                        <div
                          key={day.date}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedDate === day.date ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedDate(selectedDate === day.date ? '' : day.date)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{formatDate(day.date)}</p>
                              <p className="text-sm text-gray-500">{day.transactions} transactions</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(day.revenue)}</p>
                              <div className="flex space-x-1 mt-1">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Cash: {day.paymentMethods.cash}</span>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Card: {day.paymentMethods.debit}</span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">E-wallet: {day.paymentMethods.ewallet}</span>
                              </div>
                            </div>
                          </div>
                          {selectedDate === day.date && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Items Sold:</h4>
                              <div className="space-y-2">
                                {day.items.map((item) => (
                                  <div key={item.itemId} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.name} (x{item.quantity})</span>
                                    <span className="font-medium">{formatCurrency(item.revenue)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Items */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Top Selling Items</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {salesData.topItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No item data available.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {salesData.topItems.map((item, index) => (
                        <div key={item.itemId} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                  index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {index + 1}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                              <p className="text-sm text-gray-500">{item.quantity} sold</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}