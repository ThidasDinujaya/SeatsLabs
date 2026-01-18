const twilio = require('twilio');

let client;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
} else {
    console.warn('⚠️ Twilio credentials missing or invalid. SMS service will be simulated.');
    client = {
        messages: {
            create: async () => {
                console.log('📱 SMS Simulation (no valid credentials)');
                return { sid: 'simulated_sid' };
            }
        }
    };
}

const smsService = {
    sendSMS: async (phoneNumber, message) => {
        try {
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });
            return { success: true };
        } catch (error) {
            console.error('SMS sending failed:', error);
            throw error;
        }
    },

    sendBookingConfirmationSMS: async (phoneNumber, bookingReference, dateTime) => {
        const message = `SeatsLabs: Your booking ${bookingReference} is confirmed for ${dateTime}. We'll send you a reminder 24 hours before. Reply HELP for support.`;
        return await smsService.sendSMS(phoneNumber, message);
    },

    sendBookingReminderSMS: async (phoneNumber, bookingReference, time) => {
        const message = `SeatsLabs Reminder: Your service appointment ${bookingReference} is tomorrow at ${time}. Please arrive 10 minutes early. See you soon!`;
        return await smsService.sendSMS(phoneNumber, message);
    },

    sendStatusUpdateSMS: async (phoneNumber, bookingReference, status) => {
        const message = `SeatsLabs: Your booking ${bookingReference} status updated to: ${status}. Check the app for details.`;
        return await smsService.sendSMS(phoneNumber, message);
    }
};

module.exports = smsService;