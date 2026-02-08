-- Database Creation
DROP DATABASE IF EXISTS "SeatsLabsDB";
CREATE DATABASE "SeatsLabsDB";

-- Connect to database (For psql command line tool)
\c "SeatsLabsDB";

-- User Management Tables
CREATE TABLE "UserTypes" (
    "userTypeId" SERIAL PRIMARY KEY,
    "userTypeName" VARCHAR(50) UNIQUE NOT NULL,
    "userTypeDescription" TEXT,
    "userTypeCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Users" (
    "userId" SERIAL PRIMARY KEY,
    "userTypeId" INTEGER REFERENCES "UserTypes"("userTypeId"),
    "userFirstName" VARCHAR(100) NOT NULL,
    "userMiddleName" VARCHAR(100),
    "userLastName" VARCHAR(100) NOT NULL,
    "userDob" DATE,
    "userEmail" VARCHAR(255) UNIQUE NOT NULL,
    "userPasswordHash" VARCHAR(255) NOT NULL,
    "userPhoneNumber" VARCHAR(20) UNIQUE NOT NULL,
    "userIsActive" BOOLEAN DEFAULT true,
    "userCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "userUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Managers" (
    "managerId" SERIAL PRIMARY KEY,
    "managerUserId" INTEGER UNIQUE REFERENCES "Users"("userId") ON DELETE CASCADE,
    "managerDepartment" VARCHAR(100),
    "managerJoinDate" DATE DEFAULT CURRENT_DATE,
    "managerCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Technicians" (
    "technicianId" SERIAL PRIMARY KEY,
    "technicianUserId" INTEGER UNIQUE REFERENCES "Users"("userId") ON DELETE CASCADE,
    "technicianSpecialization" VARCHAR(100),
    "technicianSkillLevel" VARCHAR(50),
    "technicianIsAvailable" BOOLEAN DEFAULT true,
    "technicianPerformanceRating" DECIMAL(3,2) DEFAULT 0.00,
    "technicianCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Customers" (
    "customerId" SERIAL PRIMARY KEY,
    "customerUserId" INTEGER UNIQUE REFERENCES "Users"("userId") ON DELETE CASCADE,
    "customerPreferredContactMethod" VARCHAR(20) DEFAULT 'email',
    "customerLoyaltyPoints" INTEGER DEFAULT 0,
    "customerCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Advertisers" (
    "advertiserId" SERIAL PRIMARY KEY,
    "advertiserUserId" INTEGER UNIQUE REFERENCES "Users"("userId") ON DELETE CASCADE,
    "advertiserBusinessName" VARCHAR(255) NOT NULL,
    "advertiserBusinessType" VARCHAR(100),
    "advertiserTaxId" VARCHAR(50) UNIQUE,
    "advertiserContactPerson" VARCHAR(255),
    "advertiserIsApproved" BOOLEAN DEFAULT false,
    "advertiserCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Management Tables
CREATE TABLE "VehicleBrands" (
    "vehicleBrandId" SERIAL PRIMARY KEY,
    "vehicleBrandName" VARCHAR(100) UNIQUE NOT NULL,
    "vehicleBrandCountry" VARCHAR(100),
    "vehicleBrandCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "VehicleModels" (
    "vehicleModelId" SERIAL PRIMARY KEY,
    "vehicleModelVehicleBrandId" INTEGER REFERENCES "VehicleBrands"("vehicleBrandId"),
    "vehicleModelName" VARCHAR(100) NOT NULL,
    "vehicleModelYearIntroduced" INTEGER,
    "vehicleModelCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "VehicleBodyTypes" (
    "vehicleBodyTypeId" SERIAL PRIMARY KEY,
    "vehicleBodyTypeName" VARCHAR(50) UNIQUE NOT NULL,
    "vehicleBodyTypeDescription" TEXT,
    "vehicleBodyTypeCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vehicles" (
    "vehicleId" SERIAL PRIMARY KEY,
    "vehicleCustomerId" INTEGER REFERENCES "Customers"("customerId") ON DELETE CASCADE,
    "vehicleVehicleBrandId" INTEGER REFERENCES "VehicleBrands"("vehicleBrandId"),
    "vehicleVehicleModelId" INTEGER REFERENCES "VehicleModels"("vehicleModelId"),
    "vehicleVehicleBodyTypeId" INTEGER REFERENCES "VehicleBodyTypes"("vehicleBodyTypeId"),
    "vehicleRegistrationNumber" VARCHAR(20) UNIQUE NOT NULL,
    "vehicleManufactureYear" INTEGER,
    "vehicleColor" VARCHAR(50),
    "vehicleMileage" INTEGER,
    "vehicleCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "vehicleUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Management Tables
CREATE TABLE "ServiceCategories" (
    "serviceCategoryId" SERIAL PRIMARY KEY,
    "serviceCategoryName" VARCHAR(100) UNIQUE NOT NULL,
    "serviceCategoryDescription" TEXT,
    "serviceCategoryIsAvailable" BOOLEAN DEFAULT true,
    "serviceCategoryCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "serviceCategoryUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Services" (
    "serviceId" SERIAL PRIMARY KEY,
    "serviceServiceCategoryId" INTEGER REFERENCES "ServiceCategories"("serviceCategoryId"),
    "serviceName" VARCHAR(100) UNIQUE NOT NULL,
    "serviceDescription" TEXT,
    "serviceDurationMinutes" INTEGER NOT NULL,
    "serviceBasePrice" DECIMAL(10,2) NOT NULL,
    "serviceIsAvailable" BOOLEAN DEFAULT true,
    "serviceRequirements" TEXT,
    "serviceCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "serviceUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Slot Management
CREATE TABLE "TimeSlots" (
    "timeSlotId" SERIAL PRIMARY KEY,
    "timeSlotDate" DATE NOT NULL,
    "timeSlotStartTime" TIME NOT NULL,
    "timeSlotEndTime" TIME NOT NULL,
    "timeSlotIsAvailable" BOOLEAN DEFAULT true,
    "timeSlotMaxCapacity" INTEGER DEFAULT 1,
    "timeSlotCurrentBookings" INTEGER DEFAULT 0,
    "timeSlotCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("timeSlotDate", "timeSlotStartTime")
);

-- Booking Management
CREATE TABLE "Bookings" (
    "bookingId" SERIAL PRIMARY KEY,
    "bookingCustomerId" INTEGER REFERENCES "Customers"("customerId"),
    "bookingVehicleId" INTEGER REFERENCES "Vehicles"("vehicleId"),
    "bookingServiceId" INTEGER REFERENCES "Services"("serviceId"),
    "bookingTimeSlotId" INTEGER REFERENCES "TimeSlots"("timeSlotId"),
    "bookingTechnicianId" INTEGER REFERENCES "Technicians"("technicianId"),
    "bookingReference" VARCHAR(20) UNIQUE NOT NULL,
    "bookingScheduledDateTime" TIMESTAMP NOT NULL,
    "bookingActualStartTime" TIMESTAMP,
    "bookingActualEndTime" TIMESTAMP,
    "bookingStatus" VARCHAR(50) DEFAULT 'Pending',
    "bookingSpecialNotes" TEXT,
    "bookingEstimatedPrice" DECIMAL(10,2),
    "bookingActualPrice" DECIMAL(10,2),
    "bookingCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "bookingUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BookingStatuses" (
    "bookingStatusId" SERIAL PRIMARY KEY,
    "bookingStatusBookingId" INTEGER REFERENCES "Bookings"("bookingId") ON DELETE CASCADE,
    "bookingStatusStatus" VARCHAR(50) NOT NULL,
    "bookingStatusDateTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "bookingStatusNotes" TEXT,
    "bookingStatusUpdatedByUserId" INTEGER REFERENCES "Users"("userId"),
    "bookingStatusCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Tables
CREATE TABLE "PaymentMethods" (
    "paymentMethodId" SERIAL PRIMARY KEY,
    "paymentMethodName" VARCHAR(50) UNIQUE NOT NULL,
    "paymentMethodType" VARCHAR(50) NOT NULL,
    "paymentMethodIsActive" BOOLEAN DEFAULT true,
    "paymentMethodCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Payments" (
    "paymentId" SERIAL PRIMARY KEY,
    "paymentBookingId" INTEGER REFERENCES "Bookings"("bookingId"),
    "paymentPaymentMethodId" INTEGER REFERENCES "PaymentMethods"("paymentMethodId"),
    "paymentAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" VARCHAR(50) DEFAULT 'Pending',
    "paymentTransactionId" VARCHAR(100) UNIQUE,
    "paymentDateTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "paymentGatewayResponse" TEXT,
    "paymentCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advertisement Tables
CREATE TABLE "AdPricingPlans" (
    "adPricingPlanId" SERIAL PRIMARY KEY,
    "adPricingPlanName" VARCHAR(50) UNIQUE NOT NULL,
    "adPricingPlanType" VARCHAR(50) NOT NULL,
    "adPricingPlanPricePerDay" DECIMAL(10,2) NOT NULL,
    "adPricingPlanMaxImpressions" INTEGER,
    "adPricingPlanFeatures" TEXT,
    "adPricingPlanIsActive" BOOLEAN DEFAULT true,
    "adPricingPlanCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AdCampaigns" (
    "adCampaignId" SERIAL PRIMARY KEY,
    "adCampaignAdvertiserId" INTEGER REFERENCES "Advertisers"("advertiserId"),
    "adCampaignPricingPlanId" INTEGER REFERENCES "AdPricingPlans"("adPricingPlanId"),
    "adCampaignName" VARCHAR(255) NOT NULL,
    "adCampaignType" VARCHAR(50),
    "adCampaignStartDate" DATE NOT NULL,
    "adCampaignEndDate" DATE NOT NULL,
    "adCampaignStatus" VARCHAR(50) DEFAULT 'Draft',
    "adCampaignBudget" DECIMAL(10,2),
    "adCampaignTargetAudience" TEXT,
    "adCampaignCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "adCampaignUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Advertisements" (
    "advertisementId" SERIAL PRIMARY KEY,
    "advertisementCampaignId" INTEGER REFERENCES "AdCampaigns"("adCampaignId") ON DELETE CASCADE,
    "advertisementTitle" VARCHAR(255) NOT NULL,
    "advertisementContent" TEXT,
    "advertisementMediaType" VARCHAR(50),
    "advertisementMediaUrl" TEXT,
    "advertisementTargetServiceType" TEXT,
    "advertisementDisplayPriority" INTEGER DEFAULT 0,
    "advertisementIsApproved" BOOLEAN DEFAULT false,
    "advertisementApprovedAt" TIMESTAMP,
    "advertisementApprovedByUserId" INTEGER REFERENCES "Users"("userId"),
    "advertisementCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "advertisementUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Tables
CREATE TABLE "NotificationTemplates" (
    "notificationTemplateId" SERIAL PRIMARY KEY,
    "notificationTemplateName" VARCHAR(100) UNIQUE NOT NULL,
    "notificationTemplateType" VARCHAR(50) NOT NULL,
    "notificationTemplateSubject" VARCHAR(255),
    "notificationTemplateMessageBody" TEXT NOT NULL,
    "notificationTemplateVariables" TEXT,
    "notificationTemplateCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "notificationTemplateUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notifications" (
    "notificationId" SERIAL PRIMARY KEY,
    "notificationUserId" INTEGER REFERENCES "Users"("userId"),
    "notificationTemplateId" INTEGER REFERENCES "NotificationTemplates"("notificationTemplateId"),
    "notificationBookingId" INTEGER REFERENCES "Bookings"("bookingId"),
    "notificationType" VARCHAR(50) NOT NULL,
    "notificationTitle" VARCHAR(255),
    "notificationMessage" TEXT NOT NULL,
    "notificationIsRead" BOOLEAN DEFAULT false,
    "notificationScheduledTime" TIMESTAMP,
    "notificationSentTime" TIMESTAMP,
    "notificationDeliveryStatus" VARCHAR(50) DEFAULT 'Pending',
    "notificationCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Tables
CREATE TABLE "Feedbacks" (
    "feedbackId" SERIAL PRIMARY KEY,
    "feedbackBookingId" INTEGER REFERENCES "Bookings"("bookingId") ON DELETE CASCADE,
    "feedbackCustomerId" INTEGER REFERENCES "Customers"("customerId"),
    "feedbackTechnicianId" INTEGER REFERENCES "Technicians"("technicianId"),
    "feedbackServiceRating" INTEGER CHECK ("feedbackServiceRating" >= 1 AND "feedbackServiceRating" <= 5),
    "feedbackTechnicianRating" INTEGER CHECK ("feedbackTechnicianRating" >= 1 AND "feedbackTechnicianRating" <= 5),
    "feedbackComments" TEXT,
    "feedbackSubmittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Complaints" (
    "complaintId" SERIAL PRIMARY KEY,
    "complaintBookingId" INTEGER REFERENCES "Bookings"("bookingId"),
    "complaintCustomerId" INTEGER REFERENCES "Customers"("customerId"),
    "complaintType" VARCHAR(100),
    "complaintDescription" TEXT NOT NULL,
    "complaintStatus" VARCHAR(50) DEFAULT 'Open',
    "complaintResolution" TEXT,
    "complaintResolvedByUserId" INTEGER REFERENCES "Users"("userId"),
    "complaintSubmittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "complaintResolvedAt" TIMESTAMP
);

-- Indexes for Performance (Updated indices to match new attribute names)
CREATE INDEX idx_users_email ON "Users"("userEmail");
CREATE INDEX idx_bookings_customer ON "Bookings"("bookingCustomerId");
CREATE INDEX idx_bookings_date ON "Bookings"("bookingScheduledDateTime");
CREATE INDEX idx_bookings_status ON "Bookings"("bookingStatus");
CREATE INDEX idx_time_slots_date ON "TimeSlots"("timeSlotDate");
CREATE INDEX idx_notifications_user ON "Notifications"("notificationUserId");

-- missing tables for ads and payments
CREATE TABLE "AdPayments" (
    "adPaymentId" SERIAL PRIMARY KEY,
    "adPaymentCampaignId" INTEGER REFERENCES "AdCampaigns"("adCampaignId"),
    "adPaymentAmount" DECIMAL(10,2) NOT NULL,
    "adPaymentStatus" VARCHAR(50) DEFAULT 'Pending',
    "adPaymentTransactionId" VARCHAR(100) UNIQUE,
    "adPaymentDateTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "adPaymentCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AdAnalytics" (
    "adAnalyticsId" SERIAL PRIMARY KEY,
    "adAnalyticsAdvertisementId" INTEGER REFERENCES "Advertisements"("advertisementId") ON DELETE CASCADE,
    "adAnalyticsDate" DATE DEFAULT CURRENT_DATE,
    "adAnalyticsImpressions" INTEGER DEFAULT 0,
    "adAnalyticsClicks" INTEGER DEFAULT 0,
    "adAnalyticsCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("adAnalyticsAdvertisementId", "adAnalyticsDate")
);
