// Image utility functions for reliable image loading

// Category-specific placeholder images from Unsplash
const CATEGORY_PLACEHOLDERS = {
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&crop=center',
  snacks: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&crop=center',
  drinks: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&crop=center',
  default: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop&crop=center'
};

// Fallback images using Picsum (more reliable)
const PICSUM_FALLBACKS = {
  coffee: 'https://picsum.photos/400/400?random=1',
  snacks: 'https://picsum.photos/400/400?random=2', 
  drinks: 'https://picsum.photos/400/400?random=3',
  default: 'https://picsum.photos/400/400?random=4'
};

// Local fallback (solid color with category icon)
const LOCAL_FALLBACK = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE4MCIgcj0iNDAiIGZpbGw9IiM5Q0E3QjciLz4KPHJlY3QgeD0iMTcwIiB5PSIyNDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0IiByeD0iMiIgZmlsbD0iIzlDQTNCNyIvPgo8L3N2Zz4K';

export type CategoryType = 'coffee' | 'snacks' | 'drinks' | 'default';

/**
 * Get the appropriate image URL with fallback chain
 * @param originalUrl - The original image URL (can be null/undefined)
 * @param category - The product category for appropriate placeholder
 * @returns Promise that resolves to a working image URL
 */
export async function getReliableImageUrl(
  originalUrl: string | null | undefined,
  category: CategoryType = 'default'
): Promise<string> {
  // If we have an original URL, try it first
  if (originalUrl && originalUrl.trim()) {
    try {
      const isValid = await testImageUrl(originalUrl);
      if (isValid) return originalUrl;
    } catch {
      // Continue to fallbacks
    }
  }

  // Try category-specific Unsplash placeholder
  try {
    const unsplashUrl = CATEGORY_PLACEHOLDERS[category] || CATEGORY_PLACEHOLDERS.default;
    const isValid = await testImageUrl(unsplashUrl);
    if (isValid) return unsplashUrl;
  } catch {
    // Continue to next fallback
  }

  // Try Picsum fallback
  try {
    const picsumUrl = PICSUM_FALLBACKS[category] || PICSUM_FALLBACKS.default;
    const isValid = await testImageUrl(picsumUrl);
    if (isValid) return picsumUrl;
  } catch {
    // Continue to final fallback
  }

  // Return local SVG fallback as last resort
  return LOCAL_FALLBACK;
}

/**
 * Test if an image URL is accessible
 * @param url - The image URL to test
 * @returns Promise that resolves to true if image loads successfully
 */
function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 3 seconds
    setTimeout(() => resolve(false), 3000);
  });
}

/**
 * Get a direct placeholder URL for immediate use (synchronous)
 * @param category - The product category
 * @returns A reliable placeholder URL
 */
export function getPlaceholderUrl(category: CategoryType = 'default'): string {
  return CATEGORY_PLACEHOLDERS[category] || CATEGORY_PLACEHOLDERS.default;
}

/**
 * Convert category string to CategoryType
 * @param category - Category string from product
 * @returns Typed category or 'default'
 */
export function getCategoryType(category: string): CategoryType {
  const validCategories: CategoryType[] = ['coffee', 'snacks', 'drinks'];
  return validCategories.includes(category as CategoryType) 
    ? (category as CategoryType) 
    : 'default';
}