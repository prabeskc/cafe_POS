import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { usePosStore } from '../store';
import { cn } from '../lib/utils';
import { getReliableImageUrl, getPlaceholderUrl, getCategoryType } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
}

export function ProductCard({ product, isSelected = false }: ProductCardProps) {
  const { addToCart } = usePosStore();
  const [imageUrl, setImageUrl] = useState<string>(getPlaceholderUrl(getCategoryType(product.category)));
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setImageLoading(true);
      try {
        const reliableUrl = await getReliableImageUrl(product.image, getCategoryType(product.category));
        setImageUrl(reliableUrl);
      } catch (error) {
        console.warn('Failed to load image for product:', product.name, error);
        setImageUrl(getPlaceholderUrl(getCategoryType(product.category)));
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [product.image, product.category, product.name]);

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleImageError = () => {
    // Fallback to category placeholder if current image fails
    setImageUrl(getPlaceholderUrl(getCategoryType(product.category)));
  };

  return (
    <div
      className={cn(
        'bg-white/95 backdrop-blur-sm rounded-2xl border border-emerald-200/50 p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1 flex flex-col w-full max-w-sm mx-auto h-72',
        isSelected ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-emerald-100 hover:border-emerald-300'
      )}
    >
      {/* Product Image */}
      <div className="aspect-[4/3] mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 relative shadow-inner">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-500 hover:scale-110",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          loading="lazy"
          onError={handleImageError}
          onLoad={() => setImageLoading(false)}
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-grow space-y-2">
        <h3 className="font-bold text-gray-900 text-sm leading-tight tracking-tight h-8 overflow-hidden text-center flex items-center justify-center">
          <span className="line-clamp-2">{product.name}</span>
        </h3>
        
        {/* Price Section - Centered */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-emerald-600">
              ₹{product.price.toFixed(2)}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-gray-400 line-through font-medium">
                ₹{product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full mt-auto bg-emerald-500 text-white py-2 px-3 rounded-xl hover:bg-emerald-600 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="text-center">Add to Cart</span>
        </button>
      </div>
    </div>
  );
}