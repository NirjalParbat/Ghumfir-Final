import mongoose from 'mongoose';
import { sanitizeText, sanitizeStringArray } from '../utils/sanitizeText.js';

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  accommodation: { type: String, default: '' },
  meals: { type: String, default: '' },
});

itinerarySchema.pre('validate', function (next) {
  if (typeof this.title === 'string') this.title = sanitizeText(this.title, { maxLength: 120 });
  if (typeof this.description === 'string') this.description = sanitizeText(this.description, { maxLength: 1200 });
  if (typeof this.accommodation === 'string') this.accommodation = sanitizeText(this.accommodation, { maxLength: 200 });
  if (typeof this.meals === 'string') this.meals = sanitizeText(this.meals, { maxLength: 200 });
  next();
});

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Package title is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Adventure', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Heritage', 'Pilgrimage'],
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'NPR',
    },
    duration: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: 1,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    itinerary: [itinerarySchema],
    availableDates: [
      {
        type: Date,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    highlights: [String],
    includes: [String],
    excludes: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

packageSchema.pre('validate', function (next) {
  if (typeof this.title === 'string') this.title = sanitizeText(this.title, { maxLength: 120 });
  if (typeof this.destination === 'string') this.destination = sanitizeText(this.destination, { maxLength: 120 });
  if (typeof this.country === 'string') this.country = sanitizeText(this.country, { maxLength: 80 });
  if (typeof this.description === 'string') this.description = sanitizeText(this.description, { maxLength: 4000 });
  if (typeof this.currency === 'string') this.currency = sanitizeText(this.currency, { maxLength: 10 });

  this.highlights = sanitizeStringArray(this.highlights, { maxLength: 200 });
  this.includes = sanitizeStringArray(this.includes, { maxLength: 200 });
  this.excludes = sanitizeStringArray(this.excludes, { maxLength: 200 });

  next();
});

export default mongoose.model('Package', packageSchema);
