-- Insert User Types
INSERT INTO user_types (user_type_name, description) VALUES
('Manager', 'System administrator and business manager'),
('Technician', 'Service technician and mechanic'),
('Customer', 'Service customer'),
('Advertiser', 'Business advertiser and partner');

-- Insert Payment Methods
INSERT INTO payment_methods (method_name, method_type) VALUES
('Credit Card', 'Card'),
('Debit Card', 'Card'),
('Bank Transfer', 'Transfer'),
('Cash', 'Cash');

-- Insert Vehicle Brands
INSERT INTO vehicle_brands (vehicle_brand_name, country) VALUES
('Toyota', 'Japan'),
('Honda', 'Japan'),
('Nissan', 'Japan'),
('BMW', 'Germany'),
('Mercedes-Benz', 'Germany');

-- Insert Vehicle Body Types
INSERT INTO vehicle_body_types (vehicle_body_type_name, description) VALUES
('Sedan', '4-door passenger car'),
('SUV', 'Sport Utility Vehicle'),
('Hatchback', 'Compact car with rear door');

-- Insert Service Categories
INSERT INTO service_categories (service_category_name, service_category_description) VALUES
('Maintenance', 'Regular vehicle maintenance services'),
('Repair', 'Vehicle repair services');

-- Insert Services
INSERT INTO services (service_category_id, service_name, service_description, duration_minutes, base_price) VALUES
(1, 'Oil Change', 'Engine oil and filter replacement', 30, 2500.00),
(1, 'Full Service', 'Complete vehicle servicing', 120, 8000.00),
(2, 'Brake Repair', 'Brake system repair and replacement', 60, 5000.00);

-- Insert Advertisement Pricing Plans
INSERT INTO ad_pricing_plans (plan_name, plan_type, price_per_day, max_impressions, features) VALUES
('Basic Banner', 'Standard', 500.00, 1000, 'Standard banner placement'),
('Premium Placement', 'Premium', 1500.00, 5000, 'Premium placement, top visibility');