const { body, validationResult } = require('express-validator');

const userValidator = {
    validateRegistration: [
        body('firstName')
            .trim()
            .notEmpty()
            .withMessage('First name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be 2-50 characters'),

        body('lastName')
            .trim()
            .notEmpty()
            .withMessage('Last name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be 2-50 characters'),

        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Valid email is required')
            .normalizeEmail(),

        body('password')
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),

        body('phoneNumber')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required')
            .matches(/^[0-9]{10}$/)
            .withMessage('Phone number must be 10 digits'),

        body('dob')
            .optional()
            .isDate()
            .withMessage('Valid date of birth required'),

        body('userType')
            .isIn(['Customer', 'Advertiser'])
            .withMessage('User type must be Customer or Advertiser'),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],

    validateLogin: [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Valid email is required'),

        body('password')
            .notEmpty()
            .withMessage('Password is required'),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ]
};

module.exports = userValidator;