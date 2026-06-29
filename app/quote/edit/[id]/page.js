"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEFAULT_TERMS = [
  { id: 1, title: 'Maintenance & Support', description: 'The first 90 days (3 months) of post-launch bug fixes are provided free of charge. Subsequent maintenance, hosting renewals, and domain renewals will be billed separately or under an Annual Maintenance Contract (AMC).' },
  { id: 2, title: 'Revisions', description: 'Includes 3 rounds of minor UI revisions before final deployment. Revision requests must be submitted within the agreed project timeline.' },
  { id: 3, title: 'Content', description: 'Client is responsible for providing all text content, car photos, logo assets, and other media required for the website.' },
  { id: 4, title: 'Future Feature Additions', description: 'Any new features, modules, or functionalities requested by the client after the project scope is finalised will be assessed and quoted separately.' }
];

export default function EditQuotation({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  const previewRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [formData, setFormData] = useState({
    quotationNo: '',
    date: '',
    subject: '',
    clientName: '',
    clientTitle: '',
    clientMobile: '',
    clientAddress: '',
    overview: ''
  });

  const [deliverables, setDeliverables] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    async function fetchQuotation() {
      try {
        const res = await fetch(`/api/quotations/${id}`);
        if (!res.ok) throw new Error('Failed to fetch quotation');
        const data = await res.json();

        setFormData({
          quotationNo: data.quotationNo || '',
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
          subject: data.subject || '',
          clientName: data.client?.name || '',
          clientTitle: data.client?.title || '',
          clientMobile: data.client?.mobile || '',
          clientAddress: data.client?.address || '',
          overview: data.overview || ''
        });

        if (data.deliverables?.length > 0) {
          setDeliverables(data.deliverables.map((d, i) => ({ id: i, ...d })));
        } else {
          setDeliverables([{ id: Date.now(), title: '', description: '' }]);
        }

        if (data.timeline?.length > 0) {
          setTimeline(data.timeline.map((t, i) => ({ id: i, ...t })));
        } else {
          setTimeline([{ id: Date.now(), phase: 'Phase 1', title: 'Design & Setup', description: '', duration: '1-2 days' }]);
        }

        if (data.investments?.length > 0) {
          setInvestments(data.investments.map((inv, i) => ({ id: i, ...inv })));
        } else {
          setInvestments([{ id: Date.now(), description: '', cost: 0 }]);
        }

        if (data.paymentSchedule?.length > 0) {
          setPaymentSchedule(data.paymentSchedule.map((p, i) => ({ id: i, ...p })));
        } else {
          setPaymentSchedule([{ id: Date.now(), title: 'Advance Payment', percentage: 20, condition: 'Required to commence development.', amount: 0 }]);
        }

        if (data.terms?.length > 0) {
          setTerms(data.terms.map((t, i) => ({ id: i, ...t })));
        } else {
          setTerms(DEFAULT_TERMS);
        }
      } catch (error) {
        console.error(error);
        alert('Error loading quotation data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuotation();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generic Handlers for arrays
  const updateArray = (setter, id, field, value) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const removeArrayItem = (setter, id) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const grandTotal = investments.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);

  // Auto-calc payment amounts based on percentage and grandTotal
  const updatePaymentPercentage = (id, pct) => {
    setPaymentSchedule(prev => prev.map(item => {
      if (item.id === id) {
        const percentage = parseFloat(pct) || 0;
        return { ...item, percentage, amount: (percentage / 100) * grandTotal };
      }
      return item;
    }));
  };

  // Recalculate amounts if grandTotal changes
  React.useEffect(() => {
    setPaymentSchedule(prev => prev.map(item => ({
      ...item,
      amount: (item.percentage / 100) * grandTotal
    })));
  }, [grandTotal]);


  const saveToDatabase = async () => {
    if (!formData.clientName || !formData.subject) {
      alert("Please fill out Client Name and Subject");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        quotationNo: formData.quotationNo,
        date: formData.date,
        subject: formData.subject,
        salespersonName: 'Manthan Vaghasiya',
        client: {
          name: formData.clientName,
          title: formData.clientTitle,
          mobile: formData.clientMobile,
          address: formData.clientAddress
        },
        overview: formData.overview,
        deliverables: deliverables.map(d => ({ title: d.title, description: d.description })),
        timeline: timeline.map(t => ({ phase: t.phase, title: t.title, description: t.description, duration: t.duration })),
        investments: investments.map(i => ({ description: i.description, cost: Number(i.cost) })),
        paymentSchedule: paymentSchedule.map(p => ({ title: p.title, percentage: Number(p.percentage), condition: p.condition, amount: Number(p.amount) })),
        terms: terms.map(t => ({ title: t.title, description: t.description })),
        totals: { grandTotal },
        images: {
          logoUrl: '/WEBIOX icon + name.png',
          signatureUrl: '/IMG_20251109_132305-removebg-preview.png'
        }
      };

      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Quotation updated successfully!');
        router.push('/');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const headerElem = document.getElementById('pdf-header');
      const footerElem = document.getElementById('pdf-footer');
      const contentElem = document.getElementById('pdf-content');

      const headerCanvas = await (await import('html2canvas')).default(headerElem, { scale: 4, useCORS: true, logging: false });
      const footerCanvas = await (await import('html2canvas')).default(footerElem, { scale: 4, useCORS: true, logging: false });
      
      const headerImgData = headerCanvas.toDataURL('image/png');
      const footerImgData = footerCanvas.toDataURL('image/png');

      const headerHeight = 45; 
      const footerHeight = 15;

      const opt = {
        margin:       [headerHeight + 2, 0, footerHeight + 2, 0],
        filename:     `Quotation-${formData.quotationNo}-${formData.clientName.replace(/ /g, '_')}.pdf`,
        image:        { type: 'png' },
        html2canvas:  { scale: 4, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'], avoid: ['.print\\:break-inside-avoid'] }
      };

      const worker = html2pdf().set(opt).from(contentElem).toPdf();
      
      await worker.get('pdf').then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.addImage(headerImgData, 'PNG', 0, 0, 210, 38.5875);
          pdf.addImage(footerImgData, 'PNG', 0, 297 - 13.125, 210, 13.125);
        }
        pdf.save(opt.filename);
      });

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF: " + (err.message || err.toString()));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center', fontSize: '18px', color: '#0E5E64' }}>Loading Quotation Data...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-50 print:bg-white print:h-auto print:overflow-visible">
      {/* LEFT PANEL - FORM */}
      <div className="flex-none w-[550px] bg-white overflow-y-auto border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.05)] flex flex-col print:hidden">
        <div className="p-5 bg-[#0E5E64] text-white sticky top-0 z-10 flex justify-between items-center">
          <h2 className="m-0 text-xl font-semibold">Edit Quotation</h2>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>✕ Cancel</Link>
        </div>

        <div className="p-8 flex-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">Header Info</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Quotation No.</label>
                  <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" name="quotationNo" value={formData.quotationNo} onChange={handleInputChange} />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Date</label>
                  <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="date" name="date" value={formData.date} onChange={handleInputChange} />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Subject</label>
              <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="e.g. Custom PWA Digital Showroom & CRM" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">Client Details</h3>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Client Name</label>
              <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} />
            </div>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Address</label>
              <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" name="clientAddress" value={formData.clientAddress} onChange={handleInputChange} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phone</label>
                  <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" name="clientMobile" value={formData.clientMobile} onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">1. Project Overview</h3>
            <div className="mb-4">
              <textarea className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" rows={4} name="overview" value={formData.overview} onChange={handleInputChange} placeholder="Development of a premium Progressive Web App..."></textarea>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">2. Scope of Work & Deliverables</h3>
            <div className="flex flex-col gap-4">
              {deliverables.map((d) => (
                <div key={d.id} className="bg-white border border-slate-300 p-4 rounded-md relative">
                  <button onClick={() => removeArrayItem(setDeliverables, d.id)} className="absolute top-2.5 right-2.5 bg-red-100 text-red-500 border-none rounded w-6 h-6 cursor-pointer flex items-center justify-center font-bold">✕</button>
                  <div className="mb-4">
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Title</label>
                    <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={d.title} onChange={(e) => updateArray(setDeliverables, d.id, 'title', e.target.value)} placeholder="e.g. Website — 5 Pages" />
                  </div>
                  <div className="mb-4" style={{marginBottom: 0}}>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>
                    <textarea className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" rows={2} value={d.description} onChange={(e) => updateArray(setDeliverables, d.id, 'description', e.target.value)} placeholder="Home, Catalog, About Us, Contact..."></textarea>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 bg-slate-100 border border-dashed border-slate-400 text-slate-600 font-semibold rounded-md cursor-pointer mt-2.5 transition-all hover:bg-slate-200 hover:border-slate-500 hover:text-slate-800" onClick={() => setDeliverables([...deliverables, { id: Date.now(), title: '', description: '' }])}>+ Add Deliverable</button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">3. Project Timeline</h3>
            <div className="flex flex-col gap-4">
              {timeline.map((t) => (
                <div key={t.id} className="bg-white border border-slate-300 p-4 rounded-md relative">
                  <button onClick={() => removeArrayItem(setTimeline, t.id)} className="absolute top-2.5 right-2.5 bg-red-100 text-red-500 border-none rounded w-6 h-6 cursor-pointer flex items-center justify-center font-bold">✕</button>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="mb-4">
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phase</label>
                        <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={t.phase} onChange={(e) => updateArray(setTimeline, t.id, 'phase', e.target.value)} placeholder="Phase 1" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Duration</label>
                        <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={t.duration} onChange={(e) => updateArray(setTimeline, t.id, 'duration', e.target.value)} placeholder="1-2 days" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phase Title</label>
                    <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={t.title} onChange={(e) => updateArray(setTimeline, t.id, 'title', e.target.value)} placeholder="Design & Setup" />
                  </div>
                  <div className="mb-4" style={{marginBottom: 0}}>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>
                    <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={t.description} onChange={(e) => updateArray(setTimeline, t.id, 'description', e.target.value)} placeholder="Wireframes, branding, hosting..." />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 bg-slate-100 border border-dashed border-slate-400 text-slate-600 font-semibold rounded-md cursor-pointer mt-2.5 transition-all hover:bg-slate-200 hover:border-slate-500 hover:text-slate-800" onClick={() => setTimeline([...timeline, { id: Date.now(), phase: `Phase ${timeline.length + 1}`, title: '', description: '', duration: '' }])}>+ Add Timeline Phase</button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">4. Investment Breakdown</h3>
            <div className="flex flex-col gap-4">
              {investments.map((inv) => (
                <div key={inv.id} className="bg-white border border-slate-300 p-4 rounded-md relative">
                  <button onClick={() => removeArrayItem(setInvestments, inv.id)} className="absolute top-2.5 right-2.5 bg-red-100 text-red-500 border-none rounded w-6 h-6 cursor-pointer flex items-center justify-center font-bold">✕</button>
                  <div className="flex gap-4">
                    <div className="flex-1" style={{flex: 2}}>
                      <div className="mb-4" style={{marginBottom: 0}}>
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Service Description</label>
                        <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={inv.description} onChange={(e) => updateArray(setInvestments, inv.id, 'description', e.target.value)} placeholder="Frontend Website UI/UX" />
                      </div>
                    </div>
                    <div className="flex-1" style={{flex: 1}}>
                      <div className="mb-4" style={{marginBottom: 0}}>
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Cost (₹)</label>
                        <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="number" value={inv.cost} onChange={(e) => updateArray(setInvestments, inv.id, 'cost', e.target.value)} placeholder="15000" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 bg-slate-100 border border-dashed border-slate-400 text-slate-600 font-semibold rounded-md cursor-pointer mt-2.5 transition-all hover:bg-slate-200 hover:border-slate-500 hover:text-slate-800" onClick={() => setInvestments([...investments, { id: Date.now(), description: '', cost: 0 }])}>+ Add Service Cost</button>
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#0E5E64', color: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span className="text-[#FFBF00]">Total Investment:</span>
              <span className="text-[#FFBF00]">₹ {grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">5. Payment Schedule</h3>
            <div className="flex flex-col gap-4">
              {paymentSchedule.map((p) => (
                <div key={p.id} className="bg-white border border-slate-300 p-4 rounded-md relative">
                  <button onClick={() => removeArrayItem(setPaymentSchedule, p.id)} className="absolute top-2.5 right-2.5 bg-red-100 text-red-500 border-none rounded w-6 h-6 cursor-pointer flex items-center justify-center font-bold">✕</button>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="mb-4">
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Title</label>
                        <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={p.title} onChange={(e) => updateArray(setPaymentSchedule, p.id, 'title', e.target.value)} placeholder="Advance Payment" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Percentage (%)</label>
                        <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="number" value={p.percentage} onChange={(e) => updatePaymentPercentage(p.id, e.target.value)} placeholder="20" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4" style={{marginBottom: 0}}>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Condition</label>
                    <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={p.condition} onChange={(e) => updateArray(setPaymentSchedule, p.id, 'condition', e.target.value)} placeholder="Due upon completion of..." />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 bg-slate-100 border border-dashed border-slate-400 text-slate-600 font-semibold rounded-md cursor-pointer mt-2.5 transition-all hover:bg-slate-200 hover:border-slate-500 hover:text-slate-800" onClick={() => setPaymentSchedule([...paymentSchedule, { id: Date.now(), title: '', percentage: 0, condition: '', amount: 0 }])}>+ Add Milestone</button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h3 className="text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center">6. Terms & Conditions</h3>
            <div className="flex flex-col gap-4">
              {terms.map((t) => (
                <div key={t.id} className="bg-white border border-slate-300 p-4 rounded-md relative">
                  <button onClick={() => removeArrayItem(setTerms, t.id)} className="absolute top-2.5 right-2.5 bg-red-100 text-red-500 border-none rounded w-6 h-6 cursor-pointer flex items-center justify-center font-bold">✕</button>
                  <div className="mb-4">
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Term Title</label>
                    <input className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" type="text" value={t.title} onChange={(e) => updateArray(setTerms, t.id, 'title', e.target.value)} />
                  </div>
                  <div className="mb-4" style={{marginBottom: 0}}>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>
                    <textarea className="w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10" rows={2} value={t.description} onChange={(e) => updateArray(setTerms, t.id, 'description', e.target.value)}></textarea>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-3 bg-slate-100 border border-dashed border-slate-400 text-slate-600 font-semibold rounded-md cursor-pointer mt-2.5 transition-all hover:bg-slate-200 hover:border-slate-500 hover:text-slate-800" onClick={() => setTerms([...terms, { id: Date.now(), title: '', description: '' }])}>+ Add Term</button>
          </div>

        </div>

        <div className="p-5 bg-white border-t border-slate-200 sticky bottom-0 flex gap-4 z-10">
          <button className="flex-[2] bg-[#FFBF00] text-black border-none p-4 rounded-lg font-bold text-[15px] cursor-pointer shadow-[0_4px_10px_rgba(255,191,0,0.2)]" onClick={saveToDatabase} disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Quotation'}
          </button>
          <button className="flex-1 bg-[#0E5E64] text-white border-none p-4 rounded-lg font-bold text-[15px] cursor-pointer" onClick={generatePDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - PREVIEW */}
      <div className="flex-1 p-10 overflow-y-auto bg-slate-100 flex justify-center print:p-0 print:overflow-visible print:bg-[#FFFFFF] print:block">
        <div className="w-[800px] min-h-[1131px] bg-[#FFFFFF] shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative font-sans text-[#1E293B] box-border print:w-full print:min-h-0 print:shadow-none print:m-0 print:p-0" ref={previewRef} id="quotation-preview">
          
          <div id="pdf-header" className="w-full bg-[#FFFFFF] pt-8">
            <div className="relative w-full h-[115px] bg-[#0E5E64] flex items-center overflow-hidden print-color-adjust-exact">
              <div className="absolute top-0 left-0 h-full w-[50%] bg-[#FFFFFF] border-r-[6px] border-[#FFBF00]"></div>
              
              <div className="relative z-10 w-[50%] pl-10 flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/WEBIOX icon + name.png" alt="Webiox" className="w-[280px] h-auto object-contain" />
              </div>
              
              <div className="relative z-10 w-[50%] pr-12 flex flex-col items-end text-right justify-center h-full pt-1">
                <strong className="text-[#FFBF00] text-[16px] tracking-widest uppercase mb-1 font-extrabold">Webiox - Digital Solution</strong>
                <span className="text-[#FFFFFF] text-[13px] tracking-wide mb-0.5">Surat, Gujarat</span>
                <span className="text-[#FFFFFF] text-[13px] tracking-wide mb-0.5 opacity-90">manthanvaghasiya@webiox.tech</span>
                <span className="text-[#FFFFFF] text-[13px] tracking-wide opacity-90">+91 9664736245</span>
              </div>
            </div>
          </div>

          <div id="pdf-content" className="pt-6 px-12 pb-6">
            
            <div className="flex flex-col items-center justify-center mb-8 pb-6 border-b border-[#E2E8F0]">
              <h1 className="text-[36px] font-black text-[#0E5E64] tracking-[0.25em] uppercase leading-none text-center m-0">
                QUOTATION
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="w-12 h-[2px] bg-[#E2E8F0] print-color-adjust-exact"></div>
                <span className="text-[#FFBF00] font-extrabold text-[13px] tracking-[0.3em] uppercase">Statement of Work</span>
                <div className="w-12 h-[2px] bg-[#E2E8F0] print-color-adjust-exact"></div>
              </div>
            </div>

            <div className="flex justify-between items-start mb-5 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 print-color-adjust-exact">
              <div>
                <strong className="text-[#94A3B8] text-[11px] uppercase tracking-widest block mb-1 font-bold">Prepared For</strong>
                <strong className="text-[#0E5E64] text-[18px] block mb-1 font-extrabold">{formData.clientName}</strong>
                <span className="text-[#475569] block leading-relaxed whitespace-pre-line">{formData.clientAddress}</span>
                {formData.clientMobile && <span className="text-[#475569] block mt-1 font-medium">{formData.clientMobile}</span>}
              </div>
              <div className="text-right">
                <strong className="text-[#94A3B8] text-[11px] uppercase tracking-widest block mb-1 font-bold">Date Issued</strong>
                <span className="text-[#1E293B] font-bold text-[15px]">{formatInvoiceDate(formData.date)}</span>
              </div>
            </div>

            {formData.subject && (
              <div className="text-[13px] text-[#1E293B] mb-5 font-bold bg-[#F8FAFC] border-l-4 border-[#0E5E64] py-2 px-4 rounded-r-md print-color-adjust-exact">
                <span className="text-[#0E5E64] mr-2 uppercase tracking-widest text-[12px]">Subject:</span> {formData.subject}
              </div>
            )}

            {formData.overview && (
              <div className="mb-6 print:break-inside-avoid">
                <div className="flex items-center mb-3 border-b border-[#E2E8F0] pb-1.5">
                  <div className="bg-[#0E5E64] text-white w-6 h-6 flex-none flex items-center justify-center font-bold text-[12px] shadow-sm mr-3 rounded-sm print-color-adjust-exact leading-none">01</div>
                  <h2 className="text-[15px] font-extrabold text-[#0E5E64] uppercase tracking-widest m-0">Project Overview</h2>
                </div>
                <div className="text-[12.5px] leading-relaxed text-[#1E293B] mb-2">{formData.overview}</div>
              </div>
            )}

            {deliverables.length > 0 && deliverables[0].title !== '' && (
              <div className="mb-6 print:break-inside-avoid">
                <div className="flex items-center mb-3 border-b border-[#E2E8F0] pb-1.5">
                  <div className="bg-[#0E5E64] text-white w-6 h-6 flex-none flex items-center justify-center font-bold text-[12px] shadow-sm mr-3 rounded-sm print-color-adjust-exact leading-none">02</div>
                  <h2 className="text-[15px] font-extrabold text-[#0E5E64] uppercase tracking-widest m-0">Scope of Work & Deliverables</h2>
                </div>
                <ul className="list-disc pl-5 m-0 text-[12.5px] text-[#334155] leading-relaxed">
                  {deliverables.map((d, i) => (
                    <li key={i} className="print:break-inside-avoid mb-1.5"><strong className="text-[#0F172A]">{d.title}:</strong> {d.description}</li>
                  ))}
                </ul>
              </div>
            )}

            {timeline.length > 0 && timeline[0].title !== '' && (
              <div className="mb-6 print:break-inside-avoid">
                <div className="flex items-center mb-3 border-b border-[#E2E8F0] pb-1.5">
                  <div className="bg-[#0E5E64] text-white w-6 h-6 flex-none flex items-center justify-center font-bold text-[12px] shadow-sm mr-3 rounded-sm print-color-adjust-exact leading-none">03</div>
                  <h2 className="text-[15px] font-extrabold text-[#0E5E64] uppercase tracking-widest m-0">Project Timeline</h2>
                </div>
                <table className="w-full border-collapse text-[12.5px] text-left mt-1.5">
                  <thead>
                    <tr className="border-b-2 border-[#0E5E64]">
                      <th className="text-[#0E5E64] py-1.5 px-2 w-[80px] font-bold uppercase tracking-wider text-[11px]">Phase</th>
                      <th className="text-[#0E5E64] py-1.5 px-2 w-[180px] font-bold uppercase tracking-wider text-[11px]">Task</th>
                      <th className="text-[#0E5E64] py-1.5 px-2 font-bold uppercase tracking-wider text-[11px]">Description</th>
                      <th className="text-[#0E5E64] py-1.5 px-2 w-[100px] font-bold uppercase tracking-wider text-[11px] text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.map((t, i) => (
                      <tr key={i} className="print:break-inside-avoid border-b border-[#E2E8F0]">
                        <td className="py-1.5 px-2 text-[#1E293B] font-bold">{t.phase}</td>
                        <td className="py-1.5 px-2 text-[#1E293B] font-bold">{t.title}</td>
                        <td className="py-1.5 px-2 text-[#475569] leading-snug">{t.description}</td>
                        <td className="py-1.5 px-2 text-[#1E293B] text-right font-medium">{t.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {investments.length > 0 && investments[0].description !== '' && (
              <div className="mb-6 print:break-inside-avoid">
                <div className="flex items-center mb-3 border-b border-[#E2E8F0] pb-1.5">
                  <div className="bg-[#0E5E64] text-white w-6 h-6 flex-none flex items-center justify-center font-bold text-[12px] shadow-sm mr-3 rounded-sm print-color-adjust-exact leading-none">04</div>
                  <h2 className="text-[15px] font-extrabold text-[#0E5E64] uppercase tracking-widest m-0">Investment Breakdown</h2>
                </div>
                <table className="w-full border-collapse text-[12.5px] text-left mt-1.5">
                  <thead>
                    <tr className="bg-[#0E5E64] text-white print-color-adjust-exact">
                      <th className="py-2 px-4 text-left font-bold tracking-widest text-[11px] uppercase rounded-tl-md">Service Description</th>
                      <th className="py-2 px-4 text-right font-bold tracking-widest text-[11px] uppercase w-[180px] rounded-tr-md">Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv, i) => (
                      <tr key={i} className="print:break-inside-avoid border-b border-[#E2E8F0]">
                        <td className="py-2 px-4 text-[#1E293B] font-medium leading-snug">{inv.description}</td>
                        <td className="py-2 px-4 text-[#1E293B] text-right font-semibold">₹ {parseFloat(inv.cost || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#F1F5F9] print-color-adjust-exact print:break-inside-avoid">
                      <td className="py-2 px-4 text-[#0E5E64] font-extrabold uppercase text-[12px] rounded-bl-md text-right tracking-widest">Total Project Investment:</td>
                      <td className="py-2 px-4 text-[#0E5E64] text-right font-extrabold text-[16px] rounded-br-md">₹ {grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {paymentSchedule.length > 0 && paymentSchedule[0].title !== '' && (
              <div className="mb-6 print:break-inside-avoid">
                <div className="flex items-center mb-3 border-b border-[#E2E8F0] pb-1.5">
                  <div className="bg-[#0E5E64] text-white w-6 h-6 flex-none flex items-center justify-center font-bold text-[12px] shadow-sm mr-3 rounded-sm print-color-adjust-exact leading-none">05</div>
                  <h2 className="text-[15px] font-extrabold text-[#0E5E64] uppercase tracking-widest m-0">Payment Schedule</h2>
                </div>
                <p className="text-[12.5px] text-[#475569] mb-2 italic leading-relaxed">To ensure steady progress and mutual commitment, the project will be billed in milestones:</p>
                <table className="w-full border-collapse text-[12.5px] text-left mt-1.5">
                  <thead>
                    <tr className="border-b-2 border-[#0E5E64]">
                      <th className="text-[#0E5E64] py-1.5 px-2 w-[40px] font-bold uppercase tracking-wider text-[11px] text-center">#</th>
                      <th className="text-[#0E5E64] py-1.5 px-2 w-[220px] font-bold uppercase tracking-wider text-[11px]">Milestone</th>
                      <th className="text-[#0E5E64] py-1.5 px-2 font-bold uppercase tracking-wider text-[11px]">Condition</th>
                      <th className="text-[#0E5E64] py-1.5 px-2 w-[120px] text-right font-bold uppercase tracking-wider text-[11px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSchedule.map((p, i) => (
                      <tr key={i} className="print:break-inside-avoid border-b border-[#E2E8F0]">
                        <td className="py-2 px-2 text-[#94A3B8] font-bold text-center text-[15px]">{String(i + 1).padStart(2, '0')}</td>
                        <td className="py-2 px-2 text-[#1E293B] font-bold">{p.title} <span className="text-[#FFBF00] ml-1 bg-[#FFF9E6] px-1.5 py-0.5 rounded text-[11px] print-color-adjust-exact">{p.percentage}%</span></td>
                        <td className="py-2 px-2 text-[#475569] leading-snug">{p.condition}</td>
                        <td className="py-2 px-2 text-[#0E5E64] text-right font-extrabold text-[15px]">₹ {parseFloat(p.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {terms.length > 0 && terms[0].title !== '' && (
              <div className="mb-6">
                <div className="flex items-center mb-3 border-b border-[#E2E8F0] pb-1.5">
                  <div className="bg-[#0E5E64] text-white w-6 h-6 flex-none flex items-center justify-center font-bold text-[12px] shadow-sm mr-3 rounded-sm print-color-adjust-exact leading-none">06</div>
                  <h2 className="text-[15px] font-extrabold text-[#0E5E64] uppercase tracking-widest m-0">Terms & Conditions</h2>
                </div>
                <ul className="list-disc pl-5 m-0 text-[12.5px] text-[#334155] leading-relaxed">
                  {terms.map((t, i) => (
                    <li key={i} className="print:break-inside-avoid mb-1.5"><strong className="text-[#0F172A]">{t.title}:</strong> {t.description}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between mt-10 pb-6 print:break-inside-avoid text-[13.5px] text-[#1E293B]">
              <div className="w-[280px]">
                <p className="mb-3 font-medium text-[#64748B] italic">Sincerely,</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/IMG_20251109_132305-removebg-preview.png" style={{height: '65px', marginBottom: '8px', marginLeft: '-10px'}} alt="Signature" />
                <strong className="block text-[15px] text-[#0E5E64] uppercase tracking-wide">Manthan Vaghasiya</strong>
                <p className="text-[#64748B] font-medium">Founder, Webiox Digital Solutions</p>
              </div>
              <div className="w-[280px]" style={{textAlign: 'right'}}>
                <p className="mb-[40px] font-medium text-[#64748B] italic">Accepted by,</p>
                <strong className="block text-[15px] text-[#0E5E64] uppercase tracking-wide">{formData.clientName || 'Client Name'}</strong>
                <p className="text-[#64748B] font-medium">Authorised Signatory</p>
              </div>
            </div>

          </div>

          <div id="pdf-footer" className="w-full h-[50px] bg-[#0E5E64] flex justify-between items-center px-12 box-border text-[#94A3B8] text-xs relative mt-4 print-color-adjust-exact">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#FFBF00]"></div>
            <div className="pt-1">Page <span className="text-[#FFFFFF] font-semibold tracking-wide">1</span></div>
            <div className="text-[#FFFFFF] font-semibold tracking-wide pt-1">webiox.tech</div>
          </div>

        </div>
      </div>
    </div>
  );
}
