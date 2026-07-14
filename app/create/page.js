"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './invoice.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Link from 'next/link';

export default function CreateInvoice() {
  const router = useRouter();
  const previewRef = useRef(null);

  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultInvoiceNo = defaultDate.replace(/-/g, '') + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  const [formData, setFormData] = useState({
    salespersonName: 'Manthan Vaghasiya\nFounder - Webiox Digital Solution',
    clientName: 'Mr. Nitinbhai thummar',
    clientTitle: 'Founder - Sadguru car surat',
    clientMobile: '+91 099136 34447',
    clientAddress: 'Trilok Car Bazar, Simada, Canal, BRTS Rd,\nCanal Chokdi, Varachha, Surat, Gujarat',
    invoiceNo: defaultInvoiceNo,
    invoiceDate: defaultDate,
    bankAccount: '',
    ifscCode: '',
    upiNumber: '+91 9664736245',
    upiId: 'manthanvaghasiya60@okicici',
    email: 'manthanvaghasiya@webiox.tech'
  });

  const [milestones, setMilestones] = useState([
    { id: 1, title: 'Advance Payment', description: 'Required to commence development & purchase domain.', amount: 10000, isPaid: true, paidDate: '2026-04-15' },
    { id: 2, title: 'Milestone 1', description: 'Due upon completion of the frontend UI and Admin Panel setup.', amount: 25000, isPaid: true, paidDate: '2026-05-08' },
    { id: 3, title: 'Final Payment', description: 'Due upon final testing, bug fixing, and project handover.', amount: 7500, isPaid: false, paidDate: '' },
  ]);

  const [images, setImages] = useState({
    logo: '/WEBIOX icon + name.png',
    qrCode: '/WhatsApp_Image.png',
    signature: '/IMG_20251109_132305-removebg-preview.png',
  });

  // Preload images to base64 for html2canvas
  useEffect(() => {
    const convertUrlToBase64 = async (url, key) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => ({ ...prev, [key]: reader.result }));
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Failed to convert image', err);
      }
    };

    if (images.logo && images.logo.startsWith('/')) convertUrlToBase64(images.logo, 'logo');
    if (images.qrCode && images.qrCode.startsWith('/')) convertUrlToBase64(images.qrCode, 'qrCode');
    if (images.signature && images.signature.startsWith('/')) convertUrlToBase64(images.signature, 'signature');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => ({ ...prev, [type]: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMilestoneChange = (id, field, value) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: field === 'isPaid' ? value : value } : m))
    );
  };

  const addMilestone = () => {
    setMilestones([...milestones, { id: Date.now(), title: '', description: '', amount: 0, isPaid: false, paidDate: '' }]);
  };

  const removeMilestone = (id) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  // Calculations
  const grandTotal = milestones.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
  const amountPaid = milestones.filter(m => m.isPaid).reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
  const balanceDue = grandTotal - amountPaid;
  const status = balanceDue <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Pending';

  const paidPercent = grandTotal > 0 ? ((amountPaid / grandTotal) * 100).toFixed(1) : 0;
  const duePercent = grandTotal > 0 ? ((balanceDue / grandTotal) * 100).toFixed(1) : 0;

  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', "'");
  };

  const saveToDatabase = async () => {
    setIsSaving(true);
    try {
      const payload = {
        invoiceNo: formData.invoiceNo,
        date: formData.invoiceDate,
        salespersonName: formData.salespersonName,
        client: {
          name: formData.clientName,
          title: formData.clientTitle,
          mobile: formData.clientMobile,
          address: formData.clientAddress
        },
        milestones: milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          isPaid: m.isPaid,
          paidDate: m.isPaid ? m.paidDate : null
        })),
        status: status,
        totals: {
          subtotal: grandTotal,
          discount: 0,
          grandTotal: grandTotal,
          amountPaid,
          balanceDue
        },
        paymentDetails: {
          upiNumber: formData.upiNumber,
          upiId: formData.upiId
        },
        images: {
          logoUrl: images.logo,
          qrCodeUrl: images.qrCode,
          signatureUrl: images.signature
        }
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Invoice saved successfully!');
        router.push('/');
      } else {
        const err = await res.json();
        alert(`Error saving invoice: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const pageRatio = pageWidth / pageHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let imgWidth, imgHeight;

      if (canvasRatio > pageRatio) {
        imgWidth = pageWidth;
        imgHeight = imgWidth / canvasRatio;
      } else {
        imgHeight = pageHeight;
        imgWidth = imgHeight * canvasRatio;
      }

      const x = (pageWidth - imgWidth) / 2;

      pdf.addImage(imgData, 'JPEG', x, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${formData.invoiceNo}-${formData.clientName.replace(/ /g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Sorry, there was an error generating the PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ padding: '20px 20px 0 20px' }}>
        <Link href="/" style={{ color: '#2980b9', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Dashboard</Link>
      </div>

      <div className={styles.container}>
        {/* FORM SECTION */}
        <div className={styles.invoiceForm}>
          <h2>Create Invoice</h2>

          <div className={styles.formSection}>
            <h3>Client Details</h3>
            <div className={styles.formGroup}>
              <label>Client Name:</label>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Client Title / Company:</label>
              <input type="text" name="clientTitle" value={formData.clientTitle} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile No.:</label>
              <input type="tel" name="clientMobile" value={formData.clientMobile} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Address:</label>
              <textarea name="clientAddress" rows={3} value={formData.clientAddress} onChange={handleInputChange}></textarea>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Invoice Details</h3>
            <div className={styles.formGroup}>
              <label>Your Name / Title (Top Banner):</label>
              <input type="text" name="salespersonName" value={formData.salespersonName} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Invoice No.:</label>
              <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Date:</label>
              <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Payment Schedule (Milestones)</h3>
            <div>
              {milestones.map((m) => (
                <div key={m.id} className={styles.itemRow} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                  <button type="button" className={styles.removeBtn} style={{ position: 'absolute', top: '10px', right: '10px', padding: '5px 10px' }} onClick={() => removeMilestone(m.id)}>X</button>
                  <div style={{ width: '100%', marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Milestone Title</label>
                    <input type="text" className={styles.itemDesc} placeholder="e.g., Advance Payment" value={m.title} onChange={(e) => handleMilestoneChange(m.id, 'title', e.target.value)} />
                  </div>
                  <div style={{ width: '100%', marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Description</label>
                    <input type="text" className={styles.itemSub} placeholder="e.g., Required to commence development." value={m.description} onChange={(e) => handleMilestoneChange(m.id, 'description', e.target.value)} />
                  </div>
                  <div style={{ width: '100%', marginBottom: '10px', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Amount (₹)</label>
                      <input type="number" className={styles.itemPrice} placeholder="Amount" value={m.amount} onChange={(e) => handleMilestoneChange(m.id, 'amount', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px' }}>
                      <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0E5E64' }} checked={m.isPaid} onChange={(e) => handleMilestoneChange(m.id, 'isPaid', e.target.checked)} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: m.isPaid ? '#0E5E64' : '#555' }}>Mark as Paid</span>
                    </div>
                    {m.isPaid && (
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Date Paid</label>
                        <input type="date" value={m.paidDate} onChange={(e) => handleMilestoneChange(m.id, 'paidDate', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className={styles.addBtn} onClick={addMilestone}>+ Add Milestone</button>
          </div>

          <div className={styles.formSection}>
            <h3>Payment Details & Media</h3>
            <div className={styles.formGroup}>
              <label>UPI Number:</label>
              <input type="text" name="upiNumber" value={formData.upiNumber} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>UPI ID:</label>
              <input type="text" name="upiId" value={formData.upiId} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label>QR Code (Scanner Image):</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'qrCode')} />
            </div>
            <div className={styles.formGroup}>
              <label>Signature Image:</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} />
            </div>
            <div className={styles.formGroup}>
              <label>Company Logo:</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
            </div>
          </div>

          <button type="button" className={styles.saveBtn} onClick={saveToDatabase} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save to Database'}
          </button>
          <button type="button" className={styles.downloadBtn} onClick={generatePDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>

        {/* PREVIEW SECTION */}
        <div className={styles.previewWrapper}>
          <div className={styles.previewContainer} ref={previewRef} id="invoice-preview">

            <header className={styles.topBanner}>
              <div className={styles.logoSection}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images.logo} alt="Company Logo" />
              </div>
              <div className={styles.sideBox}>
                {formData.salespersonName.split('\n').map((line, idx, arr) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </header>

            <section className={styles.billToSection}>
              <div className={styles.leftCol}>
                <h2 className={styles.sectionHeading}>Invoice to</h2>
                <p className={styles.clientName}>{formData.clientName}</p>
                <p>{formData.clientTitle}</p>
                <div className={styles.contactLine}>
                  <div className={`${styles.iconPlaceholder} ${styles.phone}`}>📞</div> <span>{formData.clientMobile}</span>
                </div>
                <div className={styles.contactLine}>
                  <div className={`${styles.iconPlaceholder} ${styles.location}`}>📍</div>
                  <span style={{ whiteSpace: 'pre-line' }}>{formData.clientAddress}</span>
                </div>
              </div>
              <div className={styles.rightCol}>
                <div className={styles.invoiceInfoGroup}>
                  <p><strong>Invoice No.</strong></p>
                  <p>{formData.invoiceNo}</p>
                  <p><strong>Date:</strong></p>
                  <p>{formatInvoiceDate(formData.invoiceDate)}</p>
                </div>
              </div>
            </section>

            <section className={styles.cardsSection}>
              <h3 className={styles.sectionHeading} style={{ marginBottom: '5px', color: '#111' }}>Payment Overview</h3>
              <p className={styles.subtitle}>Summary of total billed, received, and outstanding amounts.</p>

              <div className={styles.cardsGrid}>
                <div className={`${styles.card} ${styles.cardTotal}`}>
                  <div>
                    <div className={styles.cardLabel}>TOTAL PROJECT</div>
                    <div className={styles.cardValue}>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className={styles.cardPercent}>100% of project</div>
                  </div>
                  <div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>

                <div className={`${styles.card} ${styles.cardPaid}`}>
                  <div>
                    <div className={styles.cardLabel}>AMOUNT PAID</div>
                    <div className={styles.cardValue}>₹ {amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className={styles.cardPercent}>{paidPercent}% of total</div>
                  </div>
                  <div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${paidPercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className={`${styles.card} ${styles.cardDue}`}>
                  <div>
                    <div className={styles.cardLabel}>AMOUNT DUE</div>
                    <div className={styles.cardValue}>₹ {balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className={styles.cardPercent}>{duePercent}% of total</div>
                  </div>
                  <div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${duePercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.scheduleSection}>
              <h3 className={styles.sectionHeading} style={{ marginBottom: '5px', color: '#111' }}>Payment Schedule</h3>
              <p className={styles.subtitle}>The project is billed in {milestones.length} milestones. Each milestone is marked complete when its payment is received.</p>

              <div className={styles.tableWrapper}>
                <div className={styles.tableHeader}>
                  <div className={styles.colId}>#</div>
                  <div className={styles.colDesc}>MILESTONE</div>
                  <div className={styles.colAmount}>AMOUNT</div>
                  <div className={styles.colStatus}>STATUS</div>
                </div>

                <div>
                  {milestones.map((m, index) => (
                    <div key={m.id || index} className={m.isPaid ? styles.rowPaid : styles.rowPending}>
                      <div className={styles.rowId}>{index + 1}</div>
                      <div className={styles.rowDesc}>
                        <div className={styles.rowTitle}>{m.title}</div>
                        <div className={styles.rowSubtitle}>{m.description}</div>
                      </div>
                      <div className={styles.rowAmount}>₹ {parseFloat(m.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className={styles.rowStatus}>
                        {m.isPaid ? (
                          <>
                            <div className={styles.pillPaid}>✓ PAID</div>
                            <div className={styles.statusDate}>{m.paidDate ? new Date(m.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                          </>
                        ) : (
                          <div className={styles.pillPending}>• PENDING</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.tableFooter}>
                  <div className={styles.rowId}></div>
                  <div className={styles.rowDesc} style={{ textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px' }}>TOTAL PROJECT INVESTMENT</div>
                  <div className={styles.rowAmount} style={{ color: '#1C95A3', fontSize: '18px' }}>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className={styles.rowStatus}></div>
                </div>
              </div>
            </section>

            <footer className={styles.bottomFooter}>
              <div className={styles.paymentDetails}>
                <h3 className={styles.sectionHeading}>Payment Details</h3>
                <p><strong>UPI No.:</strong> {formData.upiNumber}</p>
                <p><strong>UPI ID:</strong> {formData.upiId}</p>
                <div className={styles.qrWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images.qrCode} alt="QR Code" className={styles.qrCodeImg} />
                  <div className={styles.scanToPay}>Scan to Pay</div>
                </div>
              </div>

              <div className={styles.signatureBlock}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images.signature} alt="Signature" className={styles.signatureImg} />
                <div className={styles.signatureLine}></div>
                <div className={styles.signatureTitle}>Signature</div>
                <div className={styles.contactDetail}>📞 {formData.upiNumber}</div>
                <div className={styles.contactDetail}>✉️ {formData.email}</div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
