const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const COLORS = {
    primary: '#1a56db',
    secondary: '#1e293b',
    text: '#374151',
    lightText: '#6b7280',
    border: '#e5e7eb',
    background: '#f9fafb'
};

const drawHeader = (doc, title, subtitle) => {
    doc.fillColor(COLORS.primary)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('SeatsLabs', 50, 45);

    doc.fillColor(COLORS.secondary)
        .fontSize(10)
        .font('Helvetica')
        .text('Professional Automotive Management', 50, 75);

    doc.moveTo(50, 95).lineTo(550, 95).strokeColor(COLORS.border).stroke();

    doc.fillColor(COLORS.secondary)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(title, 50, 115);

    doc.fillColor(COLORS.lightText)
        .fontSize(10)
        .font('Helvetica')
        .text(subtitle, 50, 140);

    doc.moveDown(2);
};

const drawFooter = (doc) => {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor(COLORS.lightText)
            .fontSize(8)
            .text(
                `SeatsLabs | Generated: ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
                50,
                doc.page.height - 50,
                { align: 'center', width: 500 }
            );
    }
};

const reportController = {
    generateDailyBookingReport: async (req, res) => {
        try {
            const { date } = req.query;
            const reportDate = date || new Date().toISOString().split('T')[0];

            const query = `
                SELECT 
                    b."bookingReference", ts."timeSlotStartTime",
                    CONCAT(cu."userFirstName", ' ', cu."userLastName") as customer,
                    CONCAT(vb."vehicleBrandName", ' ', vm."vehicleModelName") as vehicle,
                    s."serviceName", b."bookingStatus", b."bookingEstimatedPrice"
                FROM "Bookings" b
                JOIN "Services" s ON b."serviceId" = s."serviceId"
                JOIN "Vehicles" v ON b."vehicleId" = v."vehicleId"
                JOIN "VehicleBrands" vb ON v."vehicleBrandId" = vb."vehicleBrandId"
                JOIN "VehicleModels" vm ON v."vehicleModelId" = vm."vehicleModelId"
                JOIN "Customers" c ON b."customerId" = c."customerId"
                JOIN "Users" cu ON c."userId" = cu."userId"
                JOIN "TimeSlots" ts ON b."timeSlotId" = ts."timeSlotId"
                WHERE DATE(b."bookingScheduledDateTime") = $1
                ORDER BY ts."timeSlotStartTime" ASC`;

            const data = await pool.query(query, [reportDate]);
            const filename = `daily-${reportDate}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            doc.pipe(fs.createWriteStream(filepath));
            drawHeader(doc, 'Daily Booking Report', `Workshop Schedule for ${reportDate}`);

            // Table Header
            let y = 180;
            doc.fillColor(COLORS.secondary).font('Helvetica-Bold').fontSize(10);
            doc.text('Time', 50, y);
            doc.text('Customer / Vehicle', 100, y);
            doc.text('Service', 300, y);
            doc.text('Status', 450, y);
            doc.text('Price', 510, y);
            doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor(COLORS.border).stroke();

            y += 25;
            doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);
            data.rows.forEach(row => {
                if (y > 700) { doc.addPage(); y = 50; }
                doc.text(row.timeSlotStartTime.substring(0, 5), 50, y);
                doc.text(`${row.customer}\n${row.vehicle}`, 100, y, { width: 180 });
                doc.text(row.serviceName, 300, y, { width: 140 });
                doc.text(row.bookingStatus, 450, y);
                doc.text(Number(row.bookingEstimatedPrice).toFixed(0), 510, y);
                y += 35;
            });

            drawFooter(doc);
            doc.end();
            res.json({ success: true, filename, downloadUrl: `/api/reports/download/${filename}` });
        } catch (error) {
            console.error('Report Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    generateMonthlyRevenueReport: async (req, res) => {
        try {
            const { month, year } = req.query;
            const m = month || new Date().getMonth() + 1;
            const y_req = year || new Date().getFullYear();

            const query = `
                SELECT 
                    DATE("bookingScheduledDateTime") as date,
                    SUM("bookingEstimatedPrice") as service_rev,
                    COUNT(*) as "Bookings"
                FROM "Bookings" 
                WHERE EXTRACT(MONTH FROM "bookingScheduledDateTime") = $1 
                AND EXTRACT(YEAR FROM "bookingScheduledDateTime") = $2
                AND "bookingStatus" = 'Completed'
                GROUP BY DATE("bookingScheduledDateTime")
                ORDER BY date`;

            const data = await pool.query(query, [m, y_req]);
            const filename = `revenue-${y_req}-${m}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            doc.pipe(fs.createWriteStream(filepath));
            drawHeader(doc, 'Monthly Revenue Report', `Financial Summary for ${m}/${y_req}`);

            let total = 0;
            let y = 180;
            doc.fillColor(COLORS.secondary).font('Helvetica-Bold').fontSize(10);
            doc.text('Date', 50, y);
            doc.text('Bookings', 200, y);
            doc.text('Daily Revenue (Rs.)', 400, y);
            doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();

            y += 25;
            doc.font('Helvetica').fontSize(10);
            data.rows.forEach(row => {
                const rev = Number(row.service_rev);
                total += rev;
                doc.text(row.date.toISOString().split('T')[0], 50, y);
                doc.text(row.Bookings, 200, y);
                doc.text(rev.toLocaleString(), 400, y);
                y += 20;
            });

            y += 20;
            doc.rect(50, y, 500, 40).fill(COLORS.background);
            doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(14);
            doc.text(`TOTAL MONTHLY REVENUE: Rs. ${total.toLocaleString()}`, 70, y + 12);

            drawFooter(doc);
            doc.end();
            res.json({ success: true, filename, downloadUrl: `/api/reports/download/${filename}` });
        } catch (error) {
            console.error('Report Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    generateTechnicianPerformanceReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const query = `
                SELECT 
                    CONCAT(u."userFirstName", ' ', u."userLastName") as name,
                    t."technicianSpecialization",
                    COUNT(b."bookingId") as jobs,
                    AVG(f."feedbackTechnicianRating") as rating
                FROM "Technicians" t
                JOIN "Users" u ON t."userId" = u."userId"
                LEFT JOIN "Bookings" b ON t."technicianId" = b."technicianId"
                    ${startDate && endDate ? 'AND DATE(b."bookingScheduledDateTime") BETWEEN $1 AND $2' : ''}
                LEFT JOIN "Feedbacks" f ON b."bookingId" = f."bookingId"
                GROUP BY name, t."technicianSpecialization"
                ORDER BY jobs DESC`;

            const params = startDate && endDate ? [startDate, endDate] : [];
            const data = await pool.query(query, params);
            const filename = `tech-performance.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            doc.pipe(fs.createWriteStream(filepath));
            drawHeader(doc, 'Technician Performance', startDate && endDate ? `Performance from ${startDate} to ${endDate}` : 'Overall productivity and satisfaction metrics');

            let y = 180;
            doc.font('Helvetica-Bold').fontSize(10).text('Technician', 50, y);
            doc.text('Specialization', 200, y);
            doc.text('Jobs', 350, y);
            doc.text('Avg Rating', 450, y);
            doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();

            y += 25;
            doc.font('Helvetica').fontSize(9);
            data.rows.forEach(row => {
                doc.text(row.name, 50, y);
                doc.text(row.technicianSpecialization || 'General', 200, y);
                doc.text(row.jobs, 350, y);
                doc.text(row.rating ? Number(row.rating).toFixed(1) : 'N/A', 450, y);
                y += 25;
            });

            drawFooter(doc);
            doc.end();
            res.json({ success: true, filename, downloadUrl: `/api/reports/download/${filename}` });
        } catch (error) {
            console.error('Report Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    generateCustomerSatisfactionReport: async (req, res) => {
        try {
            const { month, year } = req.query;
            const m = month || new Date().getMonth() + 1;
            const y_req = year || new Date().getFullYear();

            const query = `
                SELECT 
                    s."serviceName",
                    COUNT(f."feedbackId") as count,
                    AVG(f."feedbackServiceRating") as rating,
                    string_agg(f."feedbackComments", ' | ') as feedback
                FROM "Feedbacks" f
                JOIN "Bookings" b ON f."feedbackBookingId" = b."bookingId"
                JOIN "Services" s ON b."bookingServiceId" = s."serviceId"
                WHERE EXTRACT(MONTH FROM f."feedbackSubmittedAt") = $1
                AND EXTRACT(YEAR FROM f."feedbackSubmittedAt") = $2
                GROUP BY s."serviceName"`;

            const data = await pool.query(query, [m, y_req]);
            const filename = `satisfaction-${y_req}-${m}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            doc.pipe(fs.createWriteStream(filepath));
            drawHeader(doc, 'Customer Satisfaction', `Quality Analysis for ${m}/${y_req}`);

            let y = 180;
            if (data.rows.length === 0) {
                doc.text("No feedback data found for this period.", 50, y);
            }

            data.rows.forEach(row => {
                if (y > 650) { doc.addPage(); y = 50; }
                const serviceName = row.serviceName || 'Unknown Service';
                const rating = Number(row.rating) || 0;
                const count = Number(row.count) || 0;
                const feedback = row.feedback || '';

                doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12).text(serviceName, 50, y);
                doc.fillColor(COLORS.secondary).font('Helvetica').fontSize(10).text(`Average Rating: ${rating.toFixed(1)} / 5.0 (${count} reviews)`, 50, y + 15);
                doc.fillColor(COLORS.lightText).fontSize(8).italic().text(`Recent Feedback: ${feedback.substring(0, 200)}...`, 50, y + 30, { width: 500 });
                y += 70;
            });

            drawFooter(doc);
            doc.end();
            res.json({ success: true, filename, downloadUrl: `/api/reports/download/${filename}` });
        } catch (error) {
            console.error('Report Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    generateAdvertisementPerformanceReport: async (req, res) => {
        try {
            const { month, year } = req.query;
            const m = month || new Date().getMonth() + 1;
            const y_req = year || new Date().getFullYear();

            const query = `
                SELECT 
                    c."adCampaignName",
                    a."advertisementTitle",
                    SUM(aa."adAnalyticsImpressions") as total_impressions,
                    SUM(aa."adAnalyticsClicks") as total_clicks
                FROM "Advertisements" a
                JOIN "AdCampaigns" c ON a."advertisementCampaignId" = c."adCampaignId"
                LEFT JOIN "AdAnalytics" aa ON a."advertisementId" = aa."adAnalyticsAdvertisementId"
                WHERE EXTRACT(MONTH FROM aa."adAnalyticsDate") = $1
                AND EXTRACT(YEAR FROM aa."adAnalyticsDate") = $2
                GROUP BY c."adCampaignName", a."advertisementTitle"
                ORDER BY total_clicks DESC`;

            const data = await pool.query(query, [m, y_req]);
            const filename = `ad-performance-${y_req}-${m}.pdf`;
            const filepath = path.join(__dirname, '../reports', filename);

            const doc = new PDFDocument({ margin: 50, bufferPages: true });
            doc.pipe(fs.createWriteStream(filepath));
            drawHeader(doc, 'Advertisement Performance', `Campaign Metrics for ${m}/${y_req}`);

            let y = 180;
            doc.fillColor(COLORS.secondary).font('Helvetica-Bold').fontSize(10);
            doc.text('Campaign', 50, y);
            doc.text('Ad Title', 200, y);
            doc.text('Impressions', 400, y);
            doc.text('Clicks', 500, y);
            doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor(COLORS.border).stroke();

            y += 25;
            doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);
            
            if (data.rows.length === 0) {
                 doc.text("No advertisement data found for this period.", 50, y);
            }

            data.rows.forEach(row => {
                if (y > 700) { doc.addPage(); y = 50; }
                doc.text(row.adCampaignName, 50, y, { width: 140 });
                doc.text(row.advertisementTitle, 200, y, { width: 180 });
                doc.text(row.total_impressions || 0, 400, y);
                doc.text(row.total_clicks || 0, 500, y);
                y += 35;
            });

            drawFooter(doc);
            doc.end();
            res.json({ success: true, filename, downloadUrl: `/api/reports/download/${filename}` });
        } catch (error) {
            console.error('Report Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    downloadReport: async (req, res) => {
        const { filename } = req.params;
        const filepath = path.join(__dirname, '../reports', filename);
        if (fs.existsSync(filepath)) { res.download(filepath); }
        else { res.status(404).send('Not Found'); }
    }
};

module.exports = reportController;