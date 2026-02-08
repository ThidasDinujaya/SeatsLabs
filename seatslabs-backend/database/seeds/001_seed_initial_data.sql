-- Insert User Types
INSERT INTO "UserTypes" ("userTypeName", "userTypeDescription") VALUES
('Manager', 'System administrator and business manager'),
('Technician', 'Service technician and mechanic'),
('Customer', 'Service customer'),
('Advertiser', 'Business advertiser and partner');

-- Insert Payment Methods
INSERT INTO "PaymentMethods" ("paymentMethodName", "paymentMethodType") VALUES
('Credit Card', 'Card'),
('Debit Card', 'Card'),
('Bank Transfer', 'Transfer'),
('Cash', 'Cash');

-- Insert Vehicle Brands
INSERT INTO "VehicleBrands" ("vehicleBrandName", "vehicleBrandCountry") VALUES
('Toyota', 'Japan'),
('Honda', 'Japan'),
('Nissan', 'Japan'),
('BMW', 'Germany'),
('Mercedes-Benz', 'Germany');

-- Insert Vehicle Body Types
INSERT INTO "VehicleBodyTypes" ("vehicleBodyTypeName", "vehicleBodyTypeDescription") VALUES
('Sedan', '4-door passenger car'),
('SUV', 'Sport Utility Vehicle'),
('Hatchback', 'Compact car with rear door');

-- Insert Service Categories
INSERT INTO "ServiceCategories" ("serviceCategoryName", "serviceCategoryDescription") VALUES
('Maintenance', 'Regular vehicle maintenance services'),
('Repair', 'Vehicle repair services');

-- Insert Services
INSERT INTO "Services" ("serviceServiceCategoryId", "serviceName", "serviceDescription", "serviceDurationMinutes", "serviceBasePrice") VALUES
(1, 'Oil Change', 'Engine oil and filter replacement', 30, 2500.00),
(1, 'Full Service', 'Complete vehicle servicing', 120, 8000.00),
(2, 'Brake Repair', 'Brake system repair and replacement', 60, 5000.00);

-- Insert Advertisement Pricing Plans
INSERT INTO "AdPricingPlans" ("adPricingPlanName", "adPricingPlanType", "adPricingPlanPricePerDay", "adPricingPlanMaxImpressions", "adPricingPlanFeatures") VALUES
('Basic Banner', 'Standard', 500.00, 1000, 'Standard banner placement'),
('Premium Placement', 'Premium', 1500.00, 5000, 'Premium placement, top visibility');

-- Insert Sample Manager User
INSERT INTO "Users" ("userTypeId", "userFirstName", "userLastName", "userEmail", "userPasswordHash", "userPhoneNumber") VALUES
(1, 'Sarah', 'Manager', 'manager@seatslabs.com', '$2b$10$OkYH7gYKuCGRZHhVdMGeI.dIGfTazCKlCU3yCbaOHoA4nqXe1ivd', '0770000000');

INSERT INTO "Managers" ("managerUserId", "managerDepartment") 
SELECT "userId", 'Operations' FROM "Users" WHERE "userEmail" = 'manager@seatslabs.com';

-- Insert Sample Technician User
INSERT INTO "Users" ("userTypeId", "userFirstName", "userLastName", "userEmail", "userPasswordHash", "userPhoneNumber") VALUES
(2, 'Michael', 'Tech', 'tech@seatslabs.com', '$2b$10$OkYH7gYKuCGRZHhVdMGeI.dIGfTazCKlCU3yCbaOHoA4nqXe1ivd', '0770000001');

INSERT INTO "Technicians" ("technicianUserId", "technicianSpecialization", "technicianSkillLevel") 
SELECT "userId", 'Engine Specialist', 'Senior' FROM "Users" WHERE "userEmail" = 'tech@seatslabs.com';

-- Insert Sample Advertiser
INSERT INTO "Users" ("userTypeId", "userFirstName", "userLastName", "userEmail", "userPasswordHash", "userPhoneNumber") VALUES
(4, 'Alex', 'Advertiser', 'ad@seatslabs.com', '$2b$10$OkYH7gYKuCGRZHhVdMGeI.dIGfTazCKlCU3yCbaOHoA4nqXe1ivd', '0770000002');

INSERT INTO "Advertisers" ("advertiserUserId", "advertiserBusinessName", "advertiserBusinessType", "advertiserIsApproved")
SELECT "userId", 'Castrol Lube', 'Automotive', true FROM "Users" WHERE "userEmail" = 'ad@seatslabs.com';

-- Insert Sample Customer
INSERT INTO "Users" ("userTypeId", "userFirstName", "userLastName", "userEmail", "userPasswordHash", "userPhoneNumber") VALUES
(3, 'Chris', 'Customer', 'customer@seatslabs.com', '$2b$10$OkYH7gYKuCGRZHhVdMGeI.dIGfTazCKlCU3yCbaOHoA4nqXe1ivd', '0770000003');

INSERT INTO "Customers" ("customerUserId")
SELECT "userId" FROM "Users" WHERE "userEmail" = 'customer@seatslabs.com';