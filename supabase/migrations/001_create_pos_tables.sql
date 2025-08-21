-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    category TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    items JSONB NOT NULL,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit', 'ewallet')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default menu items
INSERT INTO menu_items (name, price, category, image_url) VALUES
('Whipped Coffee', 45.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=whipped%20coffee%20with%20foam%20art%20in%20white%20ceramic%20cup%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square'),
('Cold Coffee', 45.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20coffee%20with%20ice%20cubes%20in%20tall%20glass%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square'),
('Cappuccino Coffee', 55.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cappuccino%20coffee%20with%20foam%20art%20in%20white%20ceramic%20cup%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square'),
('Filter Coffee', 22.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=filter%20coffee%20in%20traditional%20cup%20and%20saucer%2C%20dark%20roasted%20coffee%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square'),
('Bulletproof Coffee', 65.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bulletproof%20coffee%20with%20butter%20and%20MCT%20oil%2C%20creamy%20texture%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square'),
('Authentic Espresso', 40.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=authentic%20espresso%20shot%20in%20small%20white%20cup%2C%20rich%20crema%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square'),
('Iced Coffee', 55.00, 'drinks', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=iced%20coffee%20drink%20with%20whipped%20cream%20and%20ice%2C%20refreshing%20cold%20beverage%2C%20coffee%20shop%20style&image_size=square'),
('Coffee Latte', 60.00, 'coffee', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20latte%20with%20beautiful%20latte%20art%20in%20ceramic%20cup%2C%20coffee%20shop%20style%2C%20professional%20food%20photography&image_size=square')
ON CONFLICT DO NOTHING;