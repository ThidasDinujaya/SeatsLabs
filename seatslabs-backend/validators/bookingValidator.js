const { body, validationResult } = require('express-validator');

const bookingValidator = {
    validateBooking: [
        body('vehicleId')
            .isInt()
            .withMessage('Valid vehicle ID is required'),

        body('serviceId')
            .isInt()
            .withMessage('Valid service ID is required'),

        body('timeSlotId')
            .isInt()
            .withMessage('Valid time slot ID is required'),

        body('specialNotes')
            .optional()
            .isString()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Special notes must be less than 500 characters'),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ]
};

module.exports = bookingValidator;