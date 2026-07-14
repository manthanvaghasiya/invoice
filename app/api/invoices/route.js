import connectToDatabase from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    // Sort by createdAt descending
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Create new invoice
    const newInvoice = new Invoice(body);
    await newInvoice.save();
    
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    // Check for duplicate key error (MongoDB code 11000)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.invoiceNo) {
      return NextResponse.json(
        { error: 'Invoice number already exists. Please use a unique Invoice No.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice', details: error },
      { status: 500 }
    );
  }
}
