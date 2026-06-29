import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidDate: { type: Date }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  salespersonName: { type: String, required: true },
  client: {
    name: { type: String, required: true },
    title: { type: String },
    mobile: { type: String },
    address: { type: String }
  },
  milestones: [MilestoneSchema],
  status: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
  totals: {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 }
  },
  paymentDetails: {
    bankAccount: { type: String },
    ifscCode: { type: String },
    upiNumber: { type: String }
  },
  terms: [{ type: String }],
  images: {
    logoUrl: { type: String }, // Base64 or URL
    qrCodeUrl: { type: String },
    signatureUrl: { type: String }
  }
}, { timestamps: true });

// Check if model already exists to prevent OverwriteModelError in Next.js
export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
