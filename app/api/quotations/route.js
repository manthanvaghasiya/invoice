import connectToDatabase from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDatabase();
    const quotations = await Quotation.find({}).sort({ createdAt: -1 });
    return NextResponse.json(quotations, { status: 200 });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const newQuotation = new Quotation(body);
    await newQuotation.save();
    
    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: 'Failed to create quotation', details: error.message }, { status: 500 });
  }
}
