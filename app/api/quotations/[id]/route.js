import connectToDatabase from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    return NextResponse.json(quotation, { status: 200 });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    
    const updatedQuotation = await Quotation.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    
    if (!updatedQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedQuotation, { status: 200 });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const deletedQuotation = await Quotation.findByIdAndDelete(id);
    
    if (!deletedQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Quotation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
