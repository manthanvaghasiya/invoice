"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'quotations'
  
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    activeProjects: 0
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [invRes, quoteRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/quotations')
      ]);
      
      const invData = await invRes.json();
      const quoteData = await quoteRes.json();
      
      let rev = 0;
      let rec = 0;
      let out = 0;
      let active = 0;

      const processedInvoices = invData.map(doc => {
        let invGrandTotal = doc.totals?.grandTotal || 0;
        let invAmountPaid = doc.totals?.amountPaid || 0;
        let invBalanceDue = doc.totals?.balanceDue || 0;
        let invStatus = doc.status || 'Pending';

        if (!doc.totals && doc.items) {
          const subtotal = doc.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          invGrandTotal = subtotal - (doc.discount || 0);
          invAmountPaid = doc.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
          invBalanceDue = invGrandTotal - invAmountPaid;
          invStatus = invBalanceDue <= 0 ? 'Paid' : invAmountPaid > 0 ? 'Partially Paid' : 'Pending';
        }

        rev += invGrandTotal;
        rec += invAmountPaid;
        out += invBalanceDue;
        if (invStatus !== 'Paid') active++;

        return {
          ...doc,
          calculatedGrandTotal: invGrandTotal,
          calculatedBalanceDue: invBalanceDue,
          calculatedStatus: invStatus
        };
      });

      setInvoices(processedInvoices);
      setQuotations(quoteData);
      setMetrics({ totalRevenue: rev, totalReceived: rec, totalOutstanding: out, activeProjects: active });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this invoice? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
      alert("Error deleting invoice");
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this quotation? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
      alert("Error deleting quotation");
    }
  };

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center', fontSize: '18px', color: '#0E5E64' }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HEADER SECTION */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/WEBIOX icon + name.png" alt="Webiox Logo" style={{ height: '50px', objectFit: 'contain' }} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#111', margin: 0, fontSize: '24px', borderLeft: '2px solid #eee', paddingLeft: '15px' }}>Admin Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link href="/quote/create" style={{ backgroundColor: '#f1f5f9', color: '#0E5E64', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '18px' }}>+</span> New Quotation
            </Link>
            <Link href="/create" style={{ backgroundColor: '#0E5E64', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(14, 94, 100, 0.3)', transition: 'transform 0.2s' }}>
              <span style={{ fontSize: '18px' }}>+</span> New Invoice
            </Link>
          </div>
        </header>

        {/* METRICS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {/* Total Revenue Card */}
          <div style={{ backgroundColor: '#0E5E64', color: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '10px', opacity: 0.8 }}>Total Invoiced</div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>₹ {metrics.totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          </div>
          {/* Amount Received Card */}
          <div style={{ backgroundColor: '#ffffff', color: '#111', border: '1px solid #eee', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '10px', color: '#777' }}>Amount Received</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#27ae60' }}>₹ {metrics.totalReceived.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
          {/* Outstanding Balance Card */}
          <div style={{ backgroundColor: '#FFBF00', color: '#111', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(255, 191, 0, 0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '10px', opacity: 0.8 }}>Outstanding Balance</div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>₹ {metrics.totalOutstanding.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '50%' }}></div>
          </div>
          {/* Active Projects Card */}
          <div style={{ backgroundColor: '#ffffff', color: '#111', border: '1px solid #eee', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '10px', color: '#777' }}>Active Projects</div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>{metrics.activeProjects}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '5px' }}>Pending or partially paid</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveTab('invoices')}
            style={{ 
              background: 'none', border: 'none', padding: '10px 20px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              color: activeTab === 'invoices' ? '#0E5E64' : '#64748b',
              borderBottom: activeTab === 'invoices' ? '3px solid #0E5E64' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            Invoices
          </button>
          <button 
            onClick={() => setActiveTab('quotations')}
            style={{ 
              background: 'none', border: 'none', padding: '10px 20px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              color: activeTab === 'quotations' ? '#0E5E64' : '#64748b',
              borderBottom: activeTab === 'quotations' ? '3px solid #0E5E64' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            Quotations
          </button>
        </div>

        {/* INVOICES TABLE */}
        {activeTab === 'invoices' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '1.1rem', color: '#777', marginBottom: '20px' }}>No invoices yet. Create your first invoice!</p>
                <Link href="/create" style={{ backgroundColor: '#FFBF00', color: '#111', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>Create Invoice</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead style={{ backgroundColor: '#fdfdfd', borderBottom: '2px solid #eee' }}>
                    <tr>
                      <th style={{ padding: '18px 30px', textAlign: 'left', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice No</th>
                      <th style={{ padding: '18px 30px', textAlign: 'left', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Client</th>
                      <th style={{ padding: '18px 30px', textAlign: 'left', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                      <th style={{ padding: '18px 30px', textAlign: 'right', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</th>
                      <th style={{ padding: '18px 30px', textAlign: 'right', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance Due</th>
                      <th style={{ padding: '18px 30px', textAlign: 'center', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                      <th style={{ padding: '18px 30px', textAlign: 'right', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '20px 30px', fontWeight: '600', color: '#111', fontSize: '14px' }}>#{invoice.invoiceNo}</td>
                        <td style={{ padding: '20px 30px' }}>
                          <strong style={{ color: '#0E5E64', fontSize: '15px' }}>{invoice.client?.name}</strong>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{invoice.client?.title}</div>
                        </td>
                        <td style={{ padding: '20px 30px', color: '#555', fontSize: '14px' }}>{new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '20px 30px', textAlign: 'right', fontWeight: '700', color: '#111', fontSize: '15px' }}>₹ {invoice.calculatedGrandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        <td style={{ padding: '20px 30px', textAlign: 'right', fontWeight: '700', color: invoice.calculatedBalanceDue > 0 ? '#d4a000' : '#27ae60', fontSize: '15px' }}>₹ {invoice.calculatedBalanceDue?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || '0.00'}</td>
                        <td style={{ padding: '20px 30px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '6px 14px', backgroundColor: invoice.calculatedStatus === 'Paid' ? '#eaf4f4' : invoice.calculatedStatus === 'Partially Paid' ? '#fff9e6' : '#f9f9f9', color: invoice.calculatedStatus === 'Paid' ? '#0E5E64' : invoice.calculatedStatus === 'Partially Paid' ? '#d4a000' : '#777', borderRadius: '99px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {invoice.calculatedStatus}
                          </span>
                        </td>
                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Link href={`/pay/${invoice._id}`} style={{ backgroundColor: '#0E5E64', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>Pay</Link>
                            <Link href={`/edit/${invoice._id}`} style={{ backgroundColor: '#f1f5f9', color: '#333', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>Update</Link>
                            <button onClick={() => handleDeleteInvoice(invoice._id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* QUOTATIONS TABLE */}
        {activeTab === 'quotations' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
            {quotations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '1.1rem', color: '#777', marginBottom: '20px' }}>No quotations yet. Generate your first quotation!</p>
                <Link href="/quote/create" style={{ backgroundColor: '#FFBF00', color: '#111', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>Create Quotation</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead style={{ backgroundColor: '#fdfdfd', borderBottom: '2px solid #eee' }}>
                    <tr>
                      <th style={{ padding: '18px 30px', textAlign: 'left', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quote No</th>
                      <th style={{ padding: '18px 30px', textAlign: 'left', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Client & Subject</th>
                      <th style={{ padding: '18px 30px', textAlign: 'left', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                      <th style={{ padding: '18px 30px', textAlign: 'right', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</th>
                      <th style={{ padding: '18px 30px', textAlign: 'right', fontWeight: '700', color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((quote) => (
                      <tr key={quote._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '20px 30px', fontWeight: '600', color: '#111', fontSize: '14px' }}>#{quote.quotationNo}</td>
                        <td style={{ padding: '20px 30px' }}>
                          <strong style={{ color: '#0E5E64', fontSize: '15px' }}>{quote.client?.name}</strong>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>{quote.subject}</div>
                        </td>
                        <td style={{ padding: '20px 30px', color: '#555', fontSize: '14px' }}>{new Date(quote.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '20px 30px', textAlign: 'right', fontWeight: '700', color: '#111', fontSize: '15px' }}>₹ {quote.totals?.grandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Link href={`/quote/edit/${quote._id}`} style={{ backgroundColor: '#f1f5f9', color: '#333', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>Update</Link>
                            <button onClick={() => handleDeleteQuotation(quote._id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
