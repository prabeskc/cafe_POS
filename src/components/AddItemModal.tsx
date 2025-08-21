import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { usePosStore } from '../store';

interface AddItemFormData {
  name: string;
  price: string;
  oldPrice: string;
  category: string;
  image: string;
}

export function AddItemModal() {
  const { isAddItemModalOpen, setAddItemModalOpen, addProduct, categories } = usePosStore();
  
  const [formData, setFormData] = useState<AddItemFormData>({
    name: '',
    price: '',
    oldPrice: '',
    category: 'coffee',
    image: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');

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

    try {
      console.log('🎯 Modal: Starting product creation...');
      
      // Use a default image if none provided
      const defaultImage = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(formData.name + ' food item coffee shop style professional photography')}&image_size=square`;

      const productData = {
        name: formData.name,
        price,
        oldPrice,
        category: formData.category,
        image: formData.image || defaultImage,
      };
      
      console.log('🎯 Modal: Product data to send:', productData);
      
      await addProduct(productData);

      console.log('🎯 Modal: Product created successfully!');
      
      // Show success message
      alert('Item added successfully!');
      
      // Reset form and close modal only on success
      setFormData({
        name: '',
        price: '',
        oldPrice: '',
        category: 'coffee',
        image: '',
      });
      setImagePreview('');
      setAddItemModalOpen(false);
    } catch (error) {
      // Only handle actual errors, don't close modal on error
      console.error('🎯 Modal: Error adding item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      alert(`Error: ${errorMessage}`);
      
      // Don't close modal on error so user can retry
      // Only reset the form if they want to start over
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      price: '',
      oldPrice: '',
      category: 'coffee',
      image: '',
    });
    setImagePreview('');
    setAddItemModalOpen(false);
  };

  if (!isAddItemModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
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
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData(prev => ({ ...prev, image: '' }));
                    }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove Image
                  </button>
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
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}