import { body, param, query, validationResult } from 'express-validator';

/**
 * Removes HTML tags from string input to prevent XSS attacks
 * @param {any} value - Input value to sanitize
 * @returns {any} Sanitized string or original value if not a string
 */
const stripTags = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
};

/**
 * Express middleware to handle validation errors from express-validator
 * Returns 400 with error details if validation fails
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

export const mongoIdParam = (name = 'id') => [
  param(name).isMongoId().withMessage(`${name} must be a valid id`),
  handleValidationErrors,
];

/**
 * Validates user registration input
 * Rules: name (2-80 chars), email (valid email), password (8+ chars, letters, numbers), phone (optional, max 30)
 */
export const registerValidation = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters').customSanitizer(stripTags),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain letters')
    .matches(/\d/)
    .withMessage('Password must contain numbers'),
  body('phone').optional({ values: 'falsy' }).isString().isLength({ max: 30 }).withMessage('Phone number too long').customSanitizer(stripTags),
  handleValidationErrors,
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isString().isLength({ min: 1, max: 128 }).withMessage('Password is required'),
  handleValidationErrors,
];

export const tokenValidation = [
  body('token').isString().isLength({ min: 20, max: 512 }).withMessage('Token is invalid'),
  handleValidationErrors,
];

export const emailValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

/**
 * Validates password reset input
 * Rules: token (20-512 chars hex string), newPassword (8+ chars, letters, numbers)
 */
export const resetPasswordValidation = [
  body('token').isString().isLength({ min: 20, max: 512 }).withMessage('Token is invalid'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain letters')
    .matches(/\d/)
    .withMessage('Password must contain numbers'),
  handleValidationErrors,
];

export const updateProfileValidation = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters').customSanitizer(stripTags),
  body('phone').optional({ values: 'falsy' }).isString().isLength({ max: 30 }).withMessage('Phone number too long').customSanitizer(stripTags),
  body('avatar').optional({ values: 'falsy' }).isURL().withMessage('Avatar must be a valid URL'),
  handleValidationErrors,
];

export const changePasswordValidation = [
  body('currentPassword').isString().isLength({ min: 1, max: 128 }).withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain letters')
    .matches(/\d/)
    .withMessage('Password must contain numbers'),
  handleValidationErrors,
];

export const createBookingValidation = [
  body('packageId').isMongoId().withMessage('packageId must be valid'),
  body('travelDate').isISO8601().withMessage('travelDate must be a valid date'),
  body('numberOfPeople').isInt({ min: 1, max: 20 }).withMessage('numberOfPeople must be between 1 and 20').toInt(),
  body('paymentMethod').isIn(['khalti', 'card', 'cash']).withMessage('Invalid payment method'),
  body('specialRequests').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }).withMessage('specialRequests too long').customSanitizer(stripTags),
  body('contactPhone').optional({ values: 'falsy' }).isString().isLength({ max: 30 }).withMessage('contactPhone too long').customSanitizer(stripTags),
  handleValidationErrors,
];

export const bookingListValidation = [
  query('page').optional().isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  handleValidationErrors,
];

export const bookingStatusValidation = [
  body('bookingStatus').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
  handleValidationErrors,
];

export const createReviewValidation = [
  body('packageId').isMongoId().withMessage('packageId must be valid'),
  body('bookingId').isMongoId().withMessage('bookingId must be valid'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5').toInt(),
  body('comment').isString().trim().isLength({ min: 3, max: 1200 }).withMessage('comment must be 3-1200 chars').customSanitizer(stripTags),
  handleValidationErrors,
];

export const paymentValidation = [
  body('bookingId').isMongoId().withMessage('bookingId must be valid'),
  handleValidationErrors,
];

export const khaltiValidation = [
  body('token').isString().isLength({ min: 8, max: 512 }).withMessage('token is invalid'),
  body('amount').isInt({ min: 1 }).withMessage('amount must be a positive integer').toInt(),
  ...paymentValidation,
];

export const cardSimulationValidation = [
  body('cardNumber').isString().trim().matches(/^\d{16}$/).withMessage('Card number must be 16 digits'),
  ...paymentValidation,
];

export const packageFilterValidation = [
  query('search').optional().isString().isLength({ max: 80 }).customSanitizer(stripTags),
  query('category').optional().isIn(['Adventure', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Heritage', 'Pilgrimage']),
  query('country').optional().isString().isLength({ max: 60 }).customSanitizer(stripTags),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('minDuration').optional().isInt({ min: 1 }).toInt(),
  query('maxDuration').optional().isInt({ min: 1 }).toInt(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).toFloat(),
  query('featured').optional().isIn(['true', 'false']),
  query('sort').optional().isIn(['-createdAt', 'createdAt', 'price', '-price', 'rating', '-rating', 'duration', '-duration']),
  query('sortPrice').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors,
];

const validTextRegex = /^[A-Za-z][A-Za-z0-9\s\-',()]*$/;

export const createPackageValidation = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Package title must be 2-120 characters')
    .matches(validTextRegex)
    .withMessage('Title must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses')
    .customSanitizer(stripTags),
  body('destination')
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Destination must be 2-120 characters')
    .matches(validTextRegex)
    .withMessage('Destination must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses')
    .customSanitizer(stripTags),
  body('country').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Country must be 2-80 characters').matches(validTextRegex).withMessage('Country must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses').customSanitizer(stripTags),
  body('category').isIn(['Adventure', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Heritage', 'Pilgrimage']).withMessage('Invalid category'),
  body('description').isString().trim().isLength({ min: 20, max: 4000 }).withMessage('Description must be 20-4000 characters').matches(validTextRegex).withMessage('Description must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses').customSanitizer(stripTags),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day').toInt(),
  body('currency').optional({ values: 'falsy' }).isString().isLength({ max: 10 }).withMessage('Currency is invalid').customSanitizer(stripTags),
  body('featured').optional().isBoolean().withMessage('featured must be true/false').toBoolean(),
  body('isActive').optional().isBoolean().withMessage('isActive must be true/false').toBoolean(),
  handleValidationErrors,
];

export const updatePackageValidation = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Package title must be 2-120 characters')
    .matches(validTextRegex)
    .withMessage('Title must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses')
    .customSanitizer(stripTags),
  body('destination')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Destination must be 2-120 characters')
    .matches(validTextRegex)
    .withMessage('Destination must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses')
    .customSanitizer(stripTags),
  body('country').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Country must be 2-80 characters').matches(validTextRegex).withMessage('Country must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses').customSanitizer(stripTags),
  body('category').optional().isIn(['Adventure', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Heritage', 'Pilgrimage']).withMessage('Invalid category'),
  body('description').optional().isString().trim().isLength({ min: 20, max: 4000 }).withMessage('Description must be 20-4000 characters').matches(validTextRegex).withMessage('Description must start with a letter and contain only letters, numbers, spaces, hyphens, apostrophes, commas, or parentheses').customSanitizer(stripTags),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 day').toInt(),
  body('currency').optional({ values: 'falsy' }).isString().isLength({ max: 10 }).withMessage('Currency is invalid').customSanitizer(stripTags),
  body('featured').optional().isBoolean().withMessage('featured must be true/false').toBoolean(),
  body('isActive').optional().isBoolean().withMessage('isActive must be true/false').toBoolean(),
  handleValidationErrors,
];
