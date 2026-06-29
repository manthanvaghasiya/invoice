"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecordPayment({ params }) {
  const router = useRouter();
  const { id } = React.use(params);

  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error('Failed to fetch invoice');
        const data = await res.json();
        
        let initialMilestones = data.milestones || [];
        
        if (initialMilestones.length === 0) {
          let grandTotal = data.totals?.grandTotal || 0;
          let amountPaid = data.totals?.amountPaid || 0;
          
          if (data.items && data.items.length > 0) {
             const subtotal = data.items.reduce((acc, item) => acc + (parseFloat(item.price) * parseFloat(item.quantity)), 0);
             grandTotal = subtotal - (parseFloat(data.discount) || 0);
             if (data.payments && data.payments.length > 0) {
                 amountPaid = data.payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
             }
          }

          if (grandTotal > 0 || amountPaid > 0) {
             if (amountPaid >= grandTotal && grandTotal > 0) {
               initialMilestones = [{ id: 'legacy-1', title: 'Project Total', amount: grandTotal, isPaid: true, paidDate: data.date }];
             } else if (amountPaid > 0) {
               initialMilestones = [
                 { id: 'legacy-paid', title: 'Previous Payments', amount: amountPaid, isPaid: true, paidDate: data.date },
                 { id: 'legacy-due', title: 'Remaining Balance', amount: grandTotal - amountPaid, isPaid: false, paidDate: null }
               ];
             } else {
               initialMilestones = [{ id: 'legacy-1', title: 'Project Total', amount: grandTotal, isPaid: false, paidDate: null }];
             }
          }
          data.milestones = initialMilestones;
        }

        if (!data.milestones) data.milestones = [];

        setInvoice(data);
      } catch (error) {
        console.error(error);
        alert('Error loading invoice data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoice();
  }, [id, router]);

  const handleMilestoneChange = (milestoneId, field, value) => {
    setInvoice(prev => {
      const updated = { ...prev };
      updated.milestones = updated.milestones.map(m => 
        ((m._id || m.id) === milestoneId) ? { ...m, [field]: value } : m
      );
      return updated;
    });
  };

  const savePaymentAndGenerate = async () => {
    setIsSaving(true);
    try {
      // Recalculate totals
      const grandTotal = invoice.milestones.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      const amountPaid = invoice.milestones.filter(m => m.isPaid).reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      const balanceDue = grandTotal - amountPaid;
      const status = balanceDue <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Pending';

      const payload = {
        ...invoice,
        status,
        totals: {
          ...invoice.totals,
          grandTotal,
          amountPaid,
          balanceDue
        }
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Redirect to edit page with autoDownload flag to generate PDF
        router.push(`/edit/${id}?autoDownload=true`);
      } else {
        alert("Error saving payment.");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update invoice.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center', fontSize: '18px', color: '#0E5E64' }}>Loading Payment Details...</div>;
  }

  if (!invoice) return null;

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '40px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0E5E64', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Dashboard</Link>
        </div>

        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* LEFT COLUMN: Summary */}
          <div style={{ flex: '1', minWidth: '300px', backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#111', marginTop: 0, marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
              Invoice Summary
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Client</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0E5E64', marginTop: '5px' }}>{invoice.client?.name}</div>
              <div style={{ fontSize: '13px', color: '#555' }}>{invoice.client?.title}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Invoice No</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111', marginTop: '5px' }}>#{invoice.invoiceNo}</div>
            </div>

            <div style={{ backgroundColor: '#fdfdfd', border: '1px solid #eee', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
              <div style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Project</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111' }}>₹ {invoice.totals?.grandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            </div>

            <div style={{ backgroundColor: '#fffbf0', border: '1px solid #FFBF00', borderRadius: '8px', padding: '15px' }}>
              <div style={{ fontSize: '11px', color: '#b38600', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Current Balance Due</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#111' }}>₹ {invoice.totals?.balanceDue?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            </div>
          </div>

          {/* RIGHT COLUMN: Milestones */}
          <div style={{ flex: '2', minWidth: '400px', backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#111', marginTop: 0, marginBottom: '20px', borderBottom: '2px solid #FFBF00', paddingBottom: '15px' }}>
              Record Payment
            </h2>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '25px' }}>Check off the milestones you have received payment for.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              {invoice.milestones.map((m, index) => (
                <div key={m._id || m.id || index} style={{ 
                  border: m.isPaid ? '1px solid #0E5E64' : '1px solid #eee', 
                  backgroundColor: m.isPaid ? '#f0f7f7' : '#fff',
                  padding: '20px', 
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#777', fontWeight: 'bold', marginBottom: '4px' }}>MILESTONE {index + 1}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>{m.title}</div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: m.isPaid ? '#0E5E64' : '#111' }}>
                      ₹ {parseFloat(m.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        style={{ width: '20px', height: '20px', accentColor: '#0E5E64', cursor: 'pointer' }}
                        checked={m.isPaid} 
                        onChange={(e) => handleMilestoneChange(m._id || m.id, 'isPaid', e.target.checked)} 
                      />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: m.isPaid ? '#0E5E64' : '#555' }}>Paid</span>
                    </label>

                    {m.isPaid && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#777', fontWeight: '600' }}>Date:</span>
                        <input 
                          type="date" 
                          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                          value={m.paidDate ? m.paidDate.split('T')[0] : ''} 
                          onChange={(e) => handleMilestoneChange(m._id || m.id, 'paidDate', e.target.value)} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={savePaymentAndGenerate} 
              disabled={isSaving}
              style={{ 
                width: '100%', 
                padding: '18px', 
                borderRadius: '8px', 
                border: 'none', 
                backgroundColor: '#FFBF00', 
                color: '#111', 
                cursor: isSaving ? 'not-allowed' : 'pointer', 
                fontWeight: '700', 
                fontSize: '16px',
                boxShadow: '0 4px 15px rgba(255, 191, 0, 0.3)',
                transition: 'transform 0.2s'
              }}
            >
              {isSaving ? 'Processing...' : 'Save & Generate New Invoice'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
