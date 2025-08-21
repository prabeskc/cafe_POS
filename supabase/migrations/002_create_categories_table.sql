-- Add description column if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Create unique constraint on name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_category_name' 
        AND table_name = 'categories'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT unique_category_name UNIQUE (name);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Create trigger for updated_at (if not exists)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories (only if they don't exist)
INSERT INTO categories (id, name, display_name)
SELECT gen_random_uuid()::text, 'all', 'All Items'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'all');

INSERT INTO categories (id, name, display_name)
SELECT gen_random_uuid()::text, 'coffee', 'Coffee'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'coffee');

INSERT INTO categories (id, name, display_name)
SELECT gen_random_uuid()::text, 'drinks', 'Drinks'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'drinks');

INSERT INTO categories (id, name, display_name)
SELECT gen_random_uuid()::text, 'food', 'Food'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'food');

INSERT INTO categories (id, name, display_name)
SELECT gen_random_uuid()::text, 'desserts', 'Desserts'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'desserts');

-- Add foreign key constraint to menu_items table (optional, for data integrity)
-- ALTER TABLE menu_items ADD CONSTRAINT fk_menu_items_category 
--     FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE;