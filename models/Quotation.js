import mongoose from 'mongoose';

const DeliverableSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const TimelineSchema = new mongoose.Schema({
  phase: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: String, required: true }
});

const InvestmentSchema = new mongoose.Schema({
  description: { type: String, required: true },
  cost: { type: Number, required: true }
});

const PaymentScheduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  percentage: { type: Number, required: true },
  condition: { type: String, required: true },
  amount: { type: Number, required: true }
});

const TermSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const QuotationSchema = new mongoose.Schema({
  quotationNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  salespersonName: { type: String, required: true },
  client: {
    name: { type: String, required: true },
    title: { type: String },
    mobile: { type: String },
    address: { type: String }
  },
  overview: { type: String, required: true },
  deliverables: [DeliverableSchema],
  timeline: [TimelineSchema],
  investments: [InvestmentSchema],
  paymentSchedule: [PaymentScheduleSchema],
  terms: [TermSchema],
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected'], default: 'Draft' },
  totals: {
    grandTotal: { type: Number, default: 0 }
  },
  images: {
    logoUrl: { type: String },
    signatureUrl: { type: String }
  }
}, { timestamps: true });

export default mongoose.models.Quotation || mongoose.model('Quotation', QuotationSchema);
