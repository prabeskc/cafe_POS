import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { ordersApi } from '../services/api';

interface DailySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
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

// Mock data for fallback
const mockSalesData: SalesData = {
  summary: {
    totalRevenue: 1250.50,
    totalTransactions: 15,
    averageOrderValue: 83.37,
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  },
  dailySales: [
    {
      date: new Date().toISOString().split('T')[0],
      transactions: 8,
      revenue: 680.00,
      paymentMethods: { cash: 3, debit: 3, ewallet: 2 },
      items: [
        { itemId: '1', name: 'Coffee Latte', category: 'beverages', quantity: 5, revenue: 300.00 },
        { itemId: '2', name: 'French Fries', category: 'snacks', quantity: 3, revenue: 300.00 }
      ]
    },
    {
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      transactions: 7,
      revenue: 570.50,
      paymentMethods: { cash: 2, debit: 4, ewallet: 1 },
      items: [
        { itemId: '1', name: 'Coffee Latte', category: 'beverages', quantity: 4, revenue: 240.00 },
        { itemId: '3', name: 'Coke', category: 'beverages', quantity: 4, revenue: 320.00 }
      ]
    }
  ],
  topItems: [
    { itemId: '1', name: 'Coffee Latte', category: 'beverages', quantity: 9, revenue: 540.00 },
    { itemId: '2', name: 'French Fries', category: 'snacks', quantity: 3, revenue: 300.00 },
    { itemId: '3', name: 'Coke', category: 'beverages', quantity: 4, revenue: 320.00 }
  ],
  totalDays: 2
};

export function DailySalesModal({ isOpen, onClose }: DailySalesModalProps) {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [useMockData, setUseMockData] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    end: new Date().toISOString().split('T')[0]
  });

  const fetchSalesData = async (forceRetry = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (useMockData && !forceRetry) {
        // Use mock data if API failed previously
        setTimeout(() => {
          setSalesData(mockSalesData);
          setIsLoading(false);
        }, 500); // Simulate loading time
        return;
      }
      
      const data = await ordersApi.getSalesAnalytics(dateRange.start, dateRange.end);
      setSalesData(data);
      setRetryCount(0);
      setUseMockData(false);
    } catch (err) {
      console.error('Sales analytics API error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales data';
      
      if (retryCount < 2) {
        // Auto-retry up to 2 times
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchSalesData(), 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // After retries failed, offer mock data
      setError(`${errorMessage}. Showing sample data instead.`);
      setSalesData(mockSalesData);
      setUseMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSalesData();
    }
  }, [isOpen, dateRange]);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
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
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading sales data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <div className="mb-4">
                  <Package className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-700 mb-2">{error}</p>
                  {useMockData && (
                    <p className="text-sm text-gray-500">The data below is for demonstration purposes.</p>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fetchSalesData(true)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Retry API
                  </button>
                  {!useMockData && (
                    <button
                      onClick={() => {
                        setSalesData(mockSalesData);
                        setUseMockData(true);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Use Sample Data
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : salesData ? (
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
                                <p className="font-semibold text-emerald-600">{formatCurrency(day.revenue)}</p>
                                <p className="text-xs text-gray-500">
                                  Cash: {day.paymentMethods.cash} | Card: {day.paymentMethods.debit} | E-wallet: {day.paymentMethods.ewallet}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Items or Selected Day Details */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedDayData ? `Items Sold on ${formatDate(selectedDayData.date)}` : 'Top Selling Items'}
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {selectedDayData ? (
                      selectedDayData.items.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No items sold on this day.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {selectedDayData.items.map((item) => (
                            <div key={item.itemId} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">Qty: {item.quantity}</p>
                                  <p className="text-sm text-emerald-600">{formatCurrency(item.revenue)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      salesData.topItems.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No items sold in the selected period.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {salesData.topItems.map((item, index) => (
                            <div key={item.itemId} className="p-4">
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
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">Qty: {item.quantity}</p>
                                  <p className="text-sm text-emerald-600">{formatCurrency(item.revenue)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No sales data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use React Portal for better modal rendering
  return createPortal(modalContent, document.body);
}