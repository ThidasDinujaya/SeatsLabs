const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const reportController = {
    // 1. DAILY BOOKING REPORT
    generateDailyBookingReport: async (req, res) => {
        try {
            const { date } = req.query;
            const reportDate = date || new Date().toISOString().split('T')[0];

            const query = `
        SELECT 
          b.booking_id,
          b.booking_reference,
          b.scheduled_date_time,
          b.booking_status,
          b.estimated_price,
          s.service_name,
          s.duration_minutes,
          v.registration_number,
          vb.vehicle_brand_name,
          vm.vehicle_model_name,
          CONCAT(cu.user_first_name, ' ', cu.user_last_name) as customer_name,
          cu.user_phone_number as customer_phone,
          CONCAT(tu.user_first_name, ' ', tu.user_last_name) as technician_name,
          ts.start_time,
          ts.end_time
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        JOIN vehicle_brands vb ON v.vehicle_brand_id = vb.vehicle_brand_id
        JOIN vehicle_models vm ON v.vehicle_model_id = vm.vehicle_model_id
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN users cu ON c.user_id = cu.user_id
        LEFT JOIN technicians t ON b.technician_id = t.technician_id
        LEFT JOIN users tu ON t.user_id = tu.user_id
        JOIN time_slots ts ON b.time_slot_id = ts.time_slot_id
        WHERE DATE(b.scheduled_date_time) = $1
        ORDER BY b.scheduled_date_time ASC
      `;

            const bookings = await pool.query(query, [reportDate]);

            // Get summary statistics
            const summaryQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN booking_status = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN booking_status = 'Pending' THEN 1 END) as pending,
          COUNT(CASE WHEN booking_status = 'In Progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN booking_status = 'Cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN booking_status = 'Completed' THEN estimated_price ELSE 0 END), 0) as total_revenue
        FROM bookings
        WHERE DATE(scheduled_date_time) = $1
      `;

            const summary = await pool.query(summaryQuery, [reportDate]);

            const doc = new PDFDocument({ margin: 50 });
            const filename = `daily-booking-report-${reportDate}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            // Pipe PDF to file
            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20).text('SeatsLabs Auto M Pvt Ltd', { align: 'center' });
            doc.fontSize(16).text('Daily Booking Report', { align: 'center' });
            doc.fontSize(12).text(`Date: ${reportDate}`, { align: 'center' });
            doc.moveDown();

            // Summary Section
            doc.fontSize(14).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Bookings: ${summary.rows[0].total_bookings}`);
            doc.text(`Completed: ${summary.rows[0].completed}`);
            doc.text(`Pending: ${summary.rows[0].pending}`);
            doc.text(`In Progress: ${summary.rows[0].in_progress}`);
            doc.text(`Cancelled: ${summary.rows[0].cancelled}`);
            doc.text(`Total Revenue: Rs. ${Number(summary.rows[0].total_revenue).toFixed(2)}`);
            doc.moveDown();

            // Bookings Table
            doc.fontSize(14).text('Bookings Details', { underline: true });
            doc.fontSize(9);

            const tableTop = doc.y;
            const tableLeft = 50;
            let currentY = tableTop + 20;

            // Table Headers
            doc.font('Helvetica-Bold');
            doc.text('Ref', tableLeft, currentY, { width: 50 });
            doc.text('Time', tableLeft + 55, currentY, { width: 50 });
            doc.text('Customer', tableLeft + 110, currentY, { width: 80 });
            doc.text('Vehicle', tableLeft + 195, currentY, { width: 80 });
            doc.text('Service', tableLeft + 280, currentY, { width: 80 });
            doc.text('Status', tableLeft + 365, currentY, { width: 60 });
            doc.text('Price', tableLeft + 430, currentY, { width: 60 });

            currentY += 15;
            doc.moveTo(tableLeft, currentY).lineTo(545, currentY).stroke();
            currentY += 5;

            // Table Data
            doc.font('Helvetica');
            bookings.rows.forEach(booking => {
                const time = booking.start_time.substring(0, 5);
                const vehicle = `${booking.vehicle_brand_name} ${booking.vehicle_model_name}`;
                const price = `Rs. ${Number(booking.estimated_price).toFixed(2)}`;

                doc.text(booking.booking_reference.substring(0, 8), tableLeft, currentY, { width: 50 });
                doc.text(time, tableLeft + 55, currentY, { width: 50 });
                doc.text(booking.customer_name, tableLeft + 110, currentY, { width: 80 });
                doc.text(vehicle, tableLeft + 195, currentY, { width: 80 });
                doc.text(booking.service_name.substring(0, 15), tableLeft + 280, currentY, { width: 80 });
                doc.text(booking.booking_status, tableLeft + 365, currentY, { width: 60 });
                doc.text(price, tableLeft + 430, currentY, { width: 60 });

                currentY += 20;

                // Page break if needed
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
            });

            // Footer
            doc.fontSize(8).text(
                `Generated on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();

            res.json({
                success: true,
                message: 'Report generated successfully',
                filename: filename,
                downloadUrl: `/api/reports/download/${filename}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. MONTHLY REVENUE REPORT
    generateMonthlyRevenueReport: async (req, res) => {
        try {
            const { month, year } = req.query;
            const reportMonth = month || new Date().getMonth() + 1;
            const reportYear = year || new Date().getFullYear();

            // Service Revenue
            const serviceRevenueQuery = `
        SELECT 
          DATE(scheduled_date_time) as date,
          COUNT(*) as bookings,
          SUM(estimated_price) as revenue
        FROM bookings
        WHERE EXTRACT(MONTH FROM scheduled_date_time) = $1
          AND EXTRACT(YEAR FROM scheduled_date_time) = $2
          AND booking_status = 'Completed'
        GROUP BY DATE(scheduled_date_time)
        ORDER BY date
      `;

            const serviceRevenue = await pool.query(serviceRevenueQuery, [reportMonth, reportYear]);

            // Advertisement Revenue
            const adRevenueQuery = `
        SELECT 
          DATE(payment_date_time) as date,
          COUNT(*) as campaigns,
          SUM(amount) as revenue
        FROM ad_payments
        WHERE EXTRACT(MONTH FROM payment_date_time) = $1
          AND EXTRACT(YEAR FROM payment_date_time) = $2
          AND payment_status = 'Completed'
        GROUP BY DATE(payment_date_time)
        ORDER BY date
      `;

            const adRevenue = await pool.query(adRevenueQuery, [reportMonth, reportYear]);

            // Total Summary
            const summaryQuery = `
        SELECT 
          (SELECT COALESCE(SUM(estimated_price), 0) FROM bookings 
           WHERE EXTRACT(MONTH FROM scheduled_date_time) = $1
           AND EXTRACT(YEAR FROM scheduled_date_time) = $2
           AND booking_status = 'Completed') as total_service_revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM ad_payments 
           WHERE EXTRACT(MONTH FROM payment_date_time) = $1
           AND EXTRACT(YEAR FROM payment_date_time) = $2
           AND payment_status = 'Completed') as total_ad_revenue,
          (SELECT COUNT(*) FROM bookings 
           WHERE EXTRACT(MONTH FROM scheduled_date_time) = $1
           AND EXTRACT(YEAR FROM scheduled_date_time) = $2
           AND booking_status = 'Completed') as total_bookings,
          (SELECT COUNT(*) FROM ad_campaigns 
           WHERE EXTRACT(MONTH FROM start_date) = $1
           AND EXTRACT(YEAR FROM start_date) = $2) as total_campaigns
      `;

            const summary = await pool.query(summaryQuery, [reportMonth, reportYear]);

            const doc = new PDFDocument({ margin: 50 });
            const filename = `monthly-revenue-report-${reportYear}-${reportMonth}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20).text('SeatsLabs Auto M Pvt Ltd', { align: 'center' });
            doc.fontSize(16).text('Monthly Revenue Report', { align: 'center' });
            doc.fontSize(12).text(`Period: ${reportMonth}/${reportYear}`, { align: 'center' });
            doc.moveDown();

            // Summary
            const totalRevenue = Number(summary.rows[0].total_service_revenue) +
                Number(summary.rows[0].total_ad_revenue);

            doc.fontSize(14).text('Revenue Summary', { underline: true });
            doc.fontSize(11);
            doc.text(`Total Service Revenue: Rs. ${Number(summary.rows[0].total_service_revenue).toFixed(2)}`);
            doc.text(`Total Advertisement Revenue: Rs. ${Number(summary.rows[0].total_ad_revenue).toFixed(2)}`);
            doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, { underline: true });
            doc.moveDown();
            doc.text(`Total Completed Bookings: ${summary.rows[0].total_bookings}`);
            doc.text(`Total Ad Campaigns: ${summary.rows[0].total_campaigns}`);
            doc.moveDown();

            // Daily Breakdown Chart (Text-based)
            doc.fontSize(14).text('Daily Revenue Breakdown', { underline: true });
            doc.fontSize(9);

            serviceRevenue.rows.forEach(day => {
                doc.text(
                    `${day.date} | Bookings: ${day.bookings} | Revenue: Rs. ${Number(day.revenue).toFixed(2)}`
                );
            });

            doc.moveDown();

            // Advertisement Revenue Breakdown
            doc.fontSize(14).text('Advertisement Revenue Breakdown', { underline: true });
            doc.fontSize(9);

            adRevenue.rows.forEach(day => {
                doc.text(
                    `${day.date} | Campaigns: ${day.campaigns} | Revenue: Rs. ${Number(day.revenue).toFixed(2)}`
                );
            });

            // Footer
            doc.fontSize(8).text(
                `Generated on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();

            res.json({
                success: true,
                message: 'Report generated successfully',
                filename: filename,
                downloadUrl: `/api/reports/download/${filename}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. TECHNICIAN PERFORMANCE REPORT
    generateTechnicianPerformanceReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            const query = `
        SELECT 
          t.technician_id,
          CONCAT(u.user_first_name, ' ', u.user_last_name) as technician_name,
          t.specialization,
          COUNT(b.booking_id) as total_jobs,
          COUNT(CASE WHEN b.booking_status = 'Completed' THEN 1 END) as completed_jobs,
          AVG(CASE 
            WHEN b.booking_status = 'Completed' 
            THEN EXTRACT(EPOCH FROM (b.actual_end_time - b.actual_start_time))/60 
          END) as avg_service_time_minutes,
          AVG(f.technician_rating) as avg_rating,
          COUNT(f.feedback_id) as total_ratings
        FROM technicians t
        JOIN users u ON t.user_id = u.user_id
        LEFT JOIN bookings b ON t.technician_id = b.technician_id
          AND DATE(b.scheduled_date_time) BETWEEN $1 AND $2
        LEFT JOIN feedbacks f ON t.technician_id = f.technician_id
          AND DATE(f.submitted_at) BETWEEN $1 AND $2
        GROUP BY t.technician_id, u.user_first_name, u.user_last_name, t.specialization
        ORDER BY completed_jobs DESC
      `;

            const technicians = await pool.query(query, [startDate, endDate]);

            const doc = new PDFDocument({ margin: 50 });
            const filename = `technician-performance-${startDate}-to-${endDate}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20).text('SeatsLabs Auto M Pvt Ltd', { align: 'center' });
            doc.fontSize(16).text('Technician Performance Report', { align: 'center' });
            doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
            doc.moveDown();

            // Performance Table
            doc.fontSize(14).text('Technician Performance Summary', { underline: true });
            doc.fontSize(9);

            const tableTop = doc.y + 10;
            let currentY = tableTop + 10;

            // Headers
            doc.font('Helvetica-Bold');
            doc.text('Technician', 50, currentY, { width: 100 });
            doc.text('Specialization', 155, currentY, { width: 80 });
            doc.text('Jobs', 240, currentY, { width: 40 });
            doc.text('Completed', 285, currentY, { width: 60 });
            doc.text('Avg Time', 350, currentY, { width: 60 });
            doc.text('Rating', 415, currentY, { width: 40 });
            doc.text('Reviews', 460, currentY, { width: 50 });

            currentY += 15;
            doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
            currentY += 5;

            // Data
            doc.font('Helvetica');
            technicians.rows.forEach(tech => {
                const avgTime = tech.avg_service_time_minutes
                    ? `${Math.round(tech.avg_service_time_minutes)} min`
                    : 'N/A';
                const rating = tech.avg_rating
                    ? Number(tech.avg_rating).toFixed(1)
                    : 'N/A';

                doc.text(tech.technician_name, 50, currentY, { width: 100 });
                doc.text(tech.specialization || 'General', 155, currentY, { width: 80 });
                doc.text(tech.total_jobs.toString(), 240, currentY, { width: 40 });
                doc.text(tech.completed_jobs.toString(), 285, currentY, { width: 60 });
                doc.text(avgTime, 350, currentY, { width: 60 });
                doc.text(rating, 415, currentY, { width: 40 });
                doc.text(tech.total_ratings.toString(), 460, currentY, { width: 50 });

                currentY += 20;

                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
            });

            // Footer
            doc.fontSize(8).text(
                `Generated on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();

            res.json({
                success: true,
                message: 'Report generated successfully',
                filename: filename,
                downloadUrl: `/api/reports/download/${filename}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. CUSTOMER SATISFACTION REPORT
    generateCustomerSatisfactionReport: async (req, res) => {
        try {
            const { month, year } = req.query;

            const query = `
        SELECT 
          DATE(f.submitted_at) as feedback_date,
          COUNT(*) as total_feedbacks,
          AVG(f.service_rating) as avg_service_rating,
          AVG(f.technician_rating) as avg_technician_rating,
          COUNT(CASE WHEN f.service_rating >= 4 THEN 1 END) as positive_service,
          COUNT(CASE WHEN f.service_rating <= 2 THEN 1 END) as negative_service,
          COUNT(CASE WHEN f.technician_rating >= 4 THEN 1 END) as positive_technician,
          COUNT(CASE WHEN f.technician_rating <= 2 THEN 1 END) as negative_technician
        FROM feedbacks f
        WHERE EXTRACT(MONTH FROM f.submitted_at) = $1
          AND EXTRACT(YEAR FROM f.submitted_at) = $2
        GROUP BY DATE(f.submitted_at)
        ORDER BY feedback_date
      `;

            const feedbacks = await pool.query(query, [month, year]);

            // Get service-wise ratings
            const serviceQuery = `
        SELECT 
          s.service_name,
          COUNT(f.feedback_id) as total_ratings,
          AVG(f.service_rating) as avg_rating
        FROM feedbacks f
        JOIN bookings b ON f.booking_id = b.booking_id
        JOIN services s ON b.service_id = s.service_id
        WHERE EXTRACT(MONTH FROM f.submitted_at) = $1
          AND EXTRACT(YEAR FROM f.submitted_at) = $2
        GROUP BY s.service_name
        ORDER BY avg_rating DESC
      `;

            const serviceRatings = await pool.query(serviceQuery, [month, year]);

            // Get overall statistics
            const overallQuery = `
        SELECT 
          COUNT(*) as total_feedbacks,
          AVG(service_rating) as overall_service_rating,
          AVG(technician_rating) as overall_technician_rating,
          (COUNT(CASE WHEN service_rating >= 4 THEN 1 END) * 100.0 / COUNT(*)) as satisfaction_rate
        FROM feedbacks
        WHERE EXTRACT(MONTH FROM submitted_at) = $1
          AND EXTRACT(YEAR FROM submitted_at) = $2
      `;

            const overall = await pool.query(overallQuery, [month, year]);

            const doc = new PDFDocument({ margin: 50 });
            const filename = `customer-satisfaction-${year}-${month}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20).text('SeatsLabs Auto M Pvt Ltd', { align: 'center' });
            doc.fontSize(16).text('Customer Satisfaction Report', { align: 'center' });
            doc.fontSize(12).text(`Period: ${month}/${year}`, { align: 'center' });
            doc.moveDown();

            // Overall Statistics
            doc.fontSize(14).text('Overall Performance', { underline: true });
            doc.fontSize(11);
            doc.text(`Total Feedbacks Received: ${overall.rows[0].total_feedbacks}`);
            doc.text(`Average Service Rating: ${Number(overall.rows[0].overall_service_rating).toFixed(2)}/5.00`);
            doc.text(`Average Technician Rating: ${Number(overall.rows[0].overall_technician_rating).toFixed(2)}/5.00`);
            doc.text(`Customer Satisfaction Rate: ${Number(overall.rows[0].satisfaction_rate).toFixed(1)}%`);
            doc.moveDown();

            // Service-wise Ratings
            doc.fontSize(14).text('Service-wise Ratings', { underline: true });
            doc.fontSize(10);

            let y = doc.y + 10;
            doc.font('Helvetica-Bold');
            doc.text('Service Name', 50, y, { width: 200 });
            doc.text('Total Ratings', 260, y, { width: 100 });
            doc.text('Average Rating', 370, y, { width: 100 });
            y += 15;
            doc.moveTo(50, y).lineTo(480, y).stroke();
            y += 5;

            doc.font('Helvetica');
            serviceRatings.rows.forEach(service => {
                doc.text(service.service_name, 50, y, { width: 200 });
                doc.text(service.total_ratings.toString(), 260, y, { width: 100 });
                doc.text(`${Number(service.avg_rating).toFixed(2)}/5.00`, 370, y, { width: 100 });
                y += 18;
            });

            doc.moveDown();

            // Daily Breakdown
            doc.addPage();
            doc.fontSize(14).text('Daily Feedback Analysis', { underline: true });
            doc.fontSize(9);

            feedbacks.rows.forEach(day => {
                doc.text(
                    `${day.feedback_date} | Feedbacks: ${day.total_feedbacks} | ` +
                    `Service: ${Number(day.avg_service_rating).toFixed(2)} | ` +
                    `Technician: ${Number(day.avg_technician_rating).toFixed(2)}`
                );
            });

            // Footer
            doc.fontSize(8).text(
                `Generated on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();

            res.json({
                success: true,
                message: 'Report generated successfully',
                filename: filename,
                downloadUrl: `/api/reports/download/${filename}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. ADVERTISEMENT PERFORMANCE REPORT
    generateAdvertisementPerformanceReport: async (req, res) => {
        try {
            const { campaignId, startDate, endDate } = req.query;

            const query = `
        SELECT 
          ac.campaign_name,
          a.ad_title,
          ad.business_name as advertiser,
          SUM(aa.impressions) as total_impressions,
          SUM(aa.clicks) as total_clicks,
          CASE 
            WHEN SUM(aa.impressions) > 0 
            THEN (SUM(aa.clicks)::decimal / SUM(aa.impressions) * 100)
            ELSE 0 
          END as ctr,
          COUNT(DISTINCT aa.analytics_date) as active_days
        FROM advertisements a
        JOIN ad_campaigns ac ON a.campaign_id = ac.campaign_id
        JOIN advertisers ad ON ac.advertiser_id = ad.advertiser_id
        LEFT JOIN ad_analytics aa ON a.advertisement_id = aa.advertisement_id
          AND aa.analytics_date BETWEEN $1 AND $2
        WHERE ($3::integer IS NULL OR ac.campaign_id = $3)
        GROUP BY ac.campaign_name, a.ad_title, ad.business_name
        ORDER BY total_impressions DESC
      `;

            const ads = await pool.query(query, [startDate, endDate, campaignId || null]);

            const doc = new PDFDocument({ margin: 50, landscape: true });
            const filename = `advertisement-performance-${startDate}-to-${endDate}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20).text('SeatsLabs Auto M Pvt Ltd', { align: 'center' });
            doc.fontSize(16).text('Advertisement Performance Report', { align: 'center' });
            doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
            doc.moveDown();

            // Performance Table
            doc.fontSize(14).text('Campaign Performance', { underline: true });
            doc.fontSize(9);

            let y = doc.y + 10;
            doc.font('Helvetica-Bold');
            doc.text('Campaign', 50, y, { width: 120 });
            doc.text('Ad Title', 175, y, { width: 120 });
            doc.text('Advertiser', 300, y, { width: 100 });
            doc.text('Impressions', 405, y, { width: 80 });
            doc.text('Clicks', 490, y, { width: 60 });
            doc.text('CTR%', 555, y, { width: 50 });
            doc.text('Days', 610, y, { width: 50 });
            y += 15;
            doc.moveTo(50, y).lineTo(670, y).stroke();
            y += 5;

            doc.font('Helvetica');
            ads.rows.forEach(ad => {
                doc.text(ad.campaign_name.substring(0, 20), 50, y, { width: 120 });
                doc.text(ad.ad_title.substring(0, 20), 175, y, { width: 120 });
                doc.text(ad.advertiser.substring(0, 15), 300, y, { width: 100 });
                doc.text(ad.total_impressions?.toString() || '0', 405, y, { width: 80 });
                doc.text(ad.total_clicks?.toString() || '0', 490, y, { width: 60 });
                doc.text(Number(ad.ctr).toFixed(2), 555, y, { width: 50 });
                doc.text(ad.active_days?.toString() || '0', 610, y, { width: 50 });
                y += 18;

                if (y > 500) {
                    doc.addPage({ landscape: true });
                    y = 50;
                }
            });

            // Footer
            doc.fontSize(8).text(
                `Generated on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();

            res.json({
                success: true,
                message: 'Report generated successfully',
                filename: filename,
                downloadUrl: `/api/reports/download/${filename}`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Download Report
    downloadReport: async (req, res) => {
        try {
            const { filename } = req.params;
            const filepath = path.join(__dirname, '../reports', filename);

            if (!fs.existsSync(filepath)) {
                return res.status(404).json({ error: 'Report not found' });
            }

            res.download(filepath, filename, (err) => {
                if (err) {
                    res.status(500).json({ error: 'Error downloading report' });
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reportController;