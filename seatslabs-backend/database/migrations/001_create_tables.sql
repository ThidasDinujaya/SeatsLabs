-- User Management Tables
CREATE TABLE user_types (
    user_type_id SERIAL PRIMARY KEY,
    user_type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_type_id INTEGER REFERENCES user_types(user_type_id),
    user_first_name VARCHAR(100) NOT NULL,
    user_middle_name VARCHAR(100),
    user_last_name VARCHAR(100) NOT NULL,
    user_dob DATE,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_password_hash VARCHAR(255) NOT NULL,
    user_phone_number VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE managers (
    manager_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    department VARCHAR(100),
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE technicians (
    technician_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    specialization VARCHAR(100),
    skill_level VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    performance_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    preferred_contact_method VARCHAR(20) DEFAULT 'email',
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE advertisers (
    advertiser_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    tax_id VARCHAR(50) UNIQUE,
    contact_person VARCHAR(255),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Management Tables
CREATE TABLE vehicle_brands (
    vehicle_brand_id SERIAL PRIMARY KEY,
    vehicle_brand_name VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_models (
    vehicle_model_id SERIAL PRIMARY KEY,
    vehicle_brand_id INTEGER REFERENCES vehicle_brands(vehicle_brand_id),
    vehicle_model_name VARCHAR(100) NOT NULL,
    year_introduced INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_body_types (
    vehicle_body_type_id SERIAL PRIMARY KEY,
    vehicle_body_type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id) ON DELETE CASCADE,
    vehicle_brand_id INTEGER REFERENCES vehicle_brands(vehicle_brand_id),
    vehicle_model_id INTEGER REFERENCES vehicle_models(vehicle_model_id),
    vehicle_body_type_id INTEGER REFERENCES vehicle_body_types(vehicle_body_type_id),
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    manufacture_year INTEGER,
    color VARCHAR(50),
    mileage INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Management Tables
CREATE TABLE service_categories (
    service_category_id SERIAL PRIMARY KEY,
    service_category_name VARCHAR(100) UNIQUE NOT NULL,
    service_category_description TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_category_id INTEGER REFERENCES service_categories(service_category_id),
    service_name VARCHAR(100) UNIQUE NOT NULL,
    service_description TEXT,
    duration_minutes INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Slot Management
CREATE TABLE time_slots (
    time_slot_id SERIAL PRIMARY KEY,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    max_capacity INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slot_date, start_time)
);

-- Booking Management
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    vehicle_id INTEGER REFERENCES vehicles(vehicle_id),
    service_id INTEGER REFERENCES services(service_id),
    time_slot_id INTEGER REFERENCES time_slots(time_slot_id),
    technician_id INTEGER REFERENCES technicians(technician_id),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    scheduled_date_time TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    booking_status VARCHAR(50) DEFAULT 'Pending',
    special_notes TEXT,
    estimated_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_statuses (
    status_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    status_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    updated_by_user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Tables
CREATE TABLE payment_methods (
    payment_method_id SERIAL PRIMARY KEY,
    method_name VARCHAR(50) UNIQUE NOT NULL,
    method_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id),
    payment_method_id INTEGER REFERENCES payment_methods(payment_method_id),
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    transaction_id VARCHAR(100) UNIQUE,
    payment_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advertisement Tables
CREATE TABLE ad_pricing_plans (
    pricing_plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(50) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    max_impressions INTEGER,
    features TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ad_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    advertiser_id INTEGER REFERENCES advertisers(advertiser_id),
    pricing_plan_id INTEGER REFERENCES ad_pricing_plans(pricing_plan_id),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    budget DECIMAL(10,2),
    target_audience TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE advertisements (
    advertisement_id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES ad_campaigns(campaign_id) ON DELETE CASCADE,
    ad_title VARCHAR(255) NOT NULL,
    ad_content TEXT,
    media_type VARCHAR(50),
    media_url TEXT,
    target_service_type TEXT,
    display_priority INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMP,
    approved_by_user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Tables
CREATE TABLE notification_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    variables TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    template_id INTEGER REFERENCES notification_templates(template_id),
    booking_id INTEGER REFERENCES bookings(booking_id),
    notification_type VARCHAR(50) NOT NULL,
    notification_title VARCHAR(255),
    notification_message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    scheduled_time TIMESTAMP,
    sent_time TIMESTAMP,
    delivery_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Tables
CREATE TABLE feedbacks (
    feedback_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(customer_id),
    technician_id INTEGER REFERENCES technicians(technician_id),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    technician_rating INTEGER CHECK (technician_rating >= 1 AND technician_rating <= 5),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    complaint_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id),
    customer_id INTEGER REFERENCES customers(customer_id),
    complaint_type VARCHAR(100),
    complaint_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    resolution TEXT,
    resolved_by_user_id INTEGER REFERENCES users(user_id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(user_email);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date_time);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_time_slots_date ON time_slots(slot_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);