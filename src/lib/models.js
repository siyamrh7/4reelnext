/**
 * Mongoose models — single source of truth for what the booking system knows.
 *
 * Three collections:
 *  - bookings        — every confirmed meeting
 *  - questions       — every "stel een vraag" submission (no calendar)
 *  - availabilityRules — recurring weekly schedule + blackout dates (set by admin)
 *
 * The admin platform CRUDs availabilityRules + reads bookings/questions.
 * The public website ONLY reads computed slots (via /api/booking/slots).
 */
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

// --------------------------------------------------------------------------
//  BOOKING — a confirmed intake meeting
// --------------------------------------------------------------------------
const BookingSchema = new Schema({
  // Customer details
  name:    { type: String, required: true, trim: true, maxLength: 120 },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, default: '', trim: true },
  company: { type: String, default: '', trim: true },
  message: { type: String, default: '', maxLength: 2000 },

  // When
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD in studio timezone
  time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },       // HH:mm in studio timezone
  durationMinutes: { type: Number, default: 30, min: 15, max: 120 },

  // Google Calendar integration
  googleEventId: { type: String, default: null, index: true },
  meetLink:      { type: String, default: null },

  // Lifecycle
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'confirmed',
    index: true,
  },
  source:     { type: String, default: 'website' },     // website | admin | api
  cancelledBy:{ type: String, default: null },          // customer | studio
  cancelledReason: { type: String, default: '' },
  internalNote: { type: String, default: '' },         // visible only in admin
}, { timestamps: true });

// Prevent double-booking same slot
BookingSchema.index({ date: 1, time: 1, status: 1 });

// --------------------------------------------------------------------------
//  QUESTION — non-booking enquiries from "Stel een vraag" tab
// --------------------------------------------------------------------------
const QuestionSchema = new Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, default: '', trim: true },
  company: { type: String, default: '', trim: true },
  message: { type: String, required: true, maxLength: 2000 },

  status: {
    type: String,
    enum: ['new', 'replied', 'closed'],
    default: 'new',
    index: true,
  },
  internalNote: { type: String, default: '' },
}, { timestamps: true });

// --------------------------------------------------------------------------
//  AVAILABILITY RULES — what days/times can people book?
//
//  ONE document holds the global availability config (singleton pattern).
//  Admin edits it via PATCH /api/admin/availability.
// --------------------------------------------------------------------------
const TimeRangeSchema = new Schema({
  start: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // "09:00"
  end:   { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // "17:00"
}, { _id: false });

const BlackoutSchema = new Schema({
  date:    { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  // Optional time window. If omitted, the WHOLE day is blocked.
  start:   { type: String, default: null, match: /^\d{2}:\d{2}$/ },
  end:     { type: String, default: null, match: /^\d{2}:\d{2}$/ },
  reason:  { type: String, default: '' },
  createdBy: { type: String, default: 'admin' },
}, { _id: true, timestamps: true });

const AvailabilitySchema = new Schema({
  // Singleton: there's only ever one of these.
  _id: { type: String, default: 'singleton' },

  // Weekly schedule. Keys are 0=Sunday … 6=Saturday (JS Date convention).
  // Each day has an array of time ranges. Empty array = no availability that day.
  weeklyHours: {
    0: { type: [TimeRangeSchema], default: [] },                                       // Zon
    1: { type: [TimeRangeSchema], default: [{ start: '09:00', end: '17:00' }] },       // Ma
    2: { type: [TimeRangeSchema], default: [{ start: '09:00', end: '17:00' }] },       // Di
    3: { type: [TimeRangeSchema], default: [{ start: '09:00', end: '17:00' }] },       // Wo
    4: { type: [TimeRangeSchema], default: [{ start: '09:00', end: '17:00' }] },       // Do
    5: { type: [TimeRangeSchema], default: [{ start: '09:00', end: '17:00' }] },       // Vr
    6: { type: [TimeRangeSchema], default: [] },                                       // Zat
  },

  // Slot length & buffer
  slotMinutes:    { type: Number, default: 30, min: 15, max: 120 },
  bufferMinutes:  { type: Number, default: 0, min: 0, max: 60 },
  minNoticeHours: { type: Number, default: 24, min: 0, max: 168 }, // earliest bookable: now + N hours

  // Maximum number of days in the future bookable
  bookingWindowDays: { type: Number, default: 60, min: 1, max: 365 },

  // Specific date overrides — block individual dates/ranges
  blackouts: { type: [BlackoutSchema], default: [] },

  // Toggle Dutch national holidays auto-blocked (default true)
  blockDutchHolidays: { type: Boolean, default: true },

  // Master switch — turn the whole booking widget off
  bookingEnabled: { type: Boolean, default: true },
  disabledReason: { type: String, default: '' }, // shown to user when bookingEnabled=false

  updatedBy: { type: String, default: 'system' },
}, { timestamps: true });

// `mongoose.models.X ||` guards against "Cannot overwrite model" errors when
// Next.js hot-reloads this module in dev.
export const Booking      = models.Booking      || model('Booking', BookingSchema);
export const Question     = models.Question     || model('Question', QuestionSchema);
export const Availability = models.Availability || model('Availability', AvailabilitySchema);

/** Get-or-create the singleton availability doc. */
export async function getAvailability() {
  let doc = await Availability.findById('singleton');
  if (!doc) doc = await Availability.create({ _id: 'singleton' });
  return doc;
}
