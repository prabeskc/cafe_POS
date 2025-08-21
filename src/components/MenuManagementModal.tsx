import React, { useState, useEffect } from 'react';
import { X, Upload, Edit2, Trash2, Plus, Search, Tag } from 'lucide-react';
import { usePosStore } from '../store';
import { Product } from '../types';

interface MenuItemFormData {
  name: string;
  price: string;
  oldPrice: string;
  category: string;
  image: string;
}

interface MenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuManagementModal({ isOpen, onClose }: MenuManagementModalProps) {
  const { products, categories, addProduct, updateProduct, removeProduct, loadProducts, loadCategories, addCategory, removeCategory, updateCategory, isLoading, error } = usePosStore();
  
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit' | 'categories'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    price: '',
    oldPrice: '',
    category: 'coffee',
    image: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Reset form when modal opens/closes and load products
  useEffect(() => {
    if (isOpen) {
      loadProducts(); // Load products from API when modal opens
      loadCategories(); // Load categories from API when modal opens
    } else {
      resetForm();
      setActiveTab('list');
      setEditingProduct(null);
      setSearchQuery('');
    }
  }, [isOpen, loadProducts, loadCategories]);

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        price: editingProduct.price.toString(),
        oldPrice: editingProduct.oldPrice?.toString() || '',
        category: editingProduct.category,
        image: editingProduct.image || '',
      });
      setImagePreview(editingProduct.image || '');
      setActiveTab('edit');
    }
  }, [editingProduct]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      oldPrice: '',
      category: 'coffee',
      image: '',
    });
    setImagePreview('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      alert('Please fill in all required fields.');
      return;
    }

    const price = parseFloat(formData.price);
    const oldPrice = formData.oldPrice ? parseFloat(formData.oldPrice) : undefined;

    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    if (oldPrice !== undefined && (isNaN(oldPrice) || oldPrice <= price)) {
      alert('Old price must be greater than current price.');
      return;
    }

    // Determine the image to use
    let imageToUse = formData.image;
    
    // If editing and no new image provided, keep the existing image
    if (activeTab === 'edit' && editingProduct && !formData.image) {
      imageToUse = editingProduct.image;
    }
    
    // If marked for default generation or no image, use default
    if (!imageToUse || imageToUse === 'GENERATE_DEFAULT') {
      imageToUse = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(formData.name + ' food item coffee shop style professional photography')}&image_size=square`;
    }

    const productData = {
      name: formData.name,
      price,
      oldPrice,
      category: formData.category,
      image: imageToUse,
    };

    try {
      console.log('🚀 Submitting product data:', productData);
      if (activeTab === 'edit' && editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setEditingProduct(null);
      } else {
        await addProduct(productData);
      }

      console.log('✅ Product saved successfully');
      resetForm();
      setActiveTab('list');
    } catch (error) {
      console.error('❌ Error saving product:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : error);
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await removeProduct(productId);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setEditingProduct(null);
    setActiveTab('list');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name.');
      return;
    }

    // Check if category already exists
    const categoryExists = categories.some(
      cat => cat.name.toLowerCase() === newCategoryName.toLowerCase().replace(/\s+/g, '-')
    );

    if (categoryExists) {
      alert('Category already exists.');
      return;
    }

    try {
      await addCategory({ 
        name: newCategoryName.toLowerCase().replace(/\s+/g, '-'), 
        displayName: newCategoryName 
      });
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (categoryId === 'all') {
      alert('Cannot delete the "All Items" category.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this category? Products in this category will remain but may need to be recategorized.')) {
      try {
        await removeCategory(categoryId);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'list' ? 'Menu Management' : 
             activeTab === 'add' ? 'Add New Item' : 'Edit Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu Items ({products.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('add');
              resetForm();
              setEditingProduct(null);
            }}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'add'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add New
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-1" />
            Categories
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'list' && (
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Menu Items List */}
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No items found matching your search.' : 'No menu items available.'}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="font-semibold text-emerald-600">₹{product.price}</span>
                          {product.oldPrice && (
                            <span className="text-sm text-gray-400 line-through">₹{product.oldPrice}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(activeTab === 'add' || activeTab === 'edit') && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter item name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Old Price (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Old Price (₹) - Optional
                </label>
                <input
                  type="number"
                  name="oldPrice"
                  value={formData.oldPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                >
                  {categories
                    .filter(cat => cat.id !== 'all')
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.displayName}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {imagePreview || (activeTab === 'edit' && editingProduct?.image) ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview || editingProduct?.image || ''}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData(prev => ({ ...prev, image: '' }));
                          // If editing and removing current image, mark for default generation
                          if (activeTab === 'edit' && !imagePreview) {
                            setFormData(prev => ({ ...prev, image: 'GENERATE_DEFAULT' }));
                          }
                        }}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        {imagePreview ? 'Remove New Image' : 'Remove Current Image'}
                      </button>
                      {!imagePreview && activeTab === 'edit' && (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload-replace"
                          />
                          <label
                            htmlFor="image-upload-replace"
                            className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm cursor-pointer hover:bg-blue-200 transition-colors mt-2"
                          >
                            Replace Image
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload product image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        Choose File
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        If no image is uploaded, a default image will be generated
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {activeTab === 'edit' ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'categories' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Categories</h3>
                
                {/* Add New Category Form */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Category</h4>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Category name (e.g., Desserts)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Existing Categories List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Current Categories</h4>
                  {categories
                    .filter(cat => cat.id !== 'all')
                    .map(category => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{category.displayName}</span>
                          <span className="text-sm text-gray-500">({category.id})</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}