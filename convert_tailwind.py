import re
import sys

classes = {
    'container': 'flex h-screen overflow-hidden font-sans bg-slate-50',
    'leftPanel': 'flex-none w-[550px] bg-white overflow-y-auto border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.05)] flex flex-col',
    'formHeader': 'p-5 bg-[#0E5E64] text-white sticky top-0 z-10 flex justify-between items-center',
    'formBody': 'p-8 flex-1',
    'section': 'bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6',
    'sectionTitle': 'text-base font-bold text-slate-800 mt-0 mb-4 pb-2.5 border-b-2 border-[#0E5E64] flex justify-between items-center',
    'formGroup': 'mb-4',
    'row': 'flex gap-4',
    'col': 'flex-1',
    'listContainer': 'flex flex-col gap-4',
    'listItem': 'bg-white border border-slate-300 p-4 rounded-md relative',
    'removeBtn': 'absolute top-2.5 right-2.5 bg-red-100 text-red-500 border-none rounded w-6 h-6 cursor-pointer flex items-center justify-center font-bold',
    'addBtn': 'w-full p-3 bg-slate-100 border border-dashed border-slate-400 text-slate-600 font-semibold rounded-md cursor-pointer mt-2.5 transition-all hover:bg-slate-200 hover:border-slate-500 hover:text-slate-800',
    'actionFooter': 'p-5 bg-white border-t border-slate-200 sticky bottom-0 flex gap-4 z-10',
    'primaryBtn': 'flex-[2] bg-[#FFBF00] text-black border-none p-4 rounded-lg font-bold text-[15px] cursor-pointer shadow-[0_4px_10px_rgba(255,191,0,0.2)]',
    'secondaryBtn': 'flex-1 bg-[#0E5E64] text-white border-none p-4 rounded-lg font-bold text-[15px] cursor-pointer',
    'rightPanel': 'flex-1 p-10 overflow-y-auto bg-slate-100 flex justify-center',
    'pagePreview': 'w-[210mm] min-h-[297mm] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative overflow-hidden font-sans text-slate-800 box-border',
    'topHeader': 'flex justify-between items-center h-[110px] bg-[#FFBF00] bg-[url("data:image/svg+xml,%3Csvg_width=\'1000\'_height=\'110\'_viewBox=\'0_0_1000_110\'_preserveAspectRatio=\'none\'_fill=\'none\'_xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpolygon_points=\'420,0_1000,0_1000,110_420,110_470,55\'_fill=\'%230E5E64\'_/%3E%3Cpolygon_points=\'435,0_1000,0_1000,110_435,110_485,55\'_fill=\'%23FFBF00\'_/%3E%3Cpolygon_points=\'450,0_1000,0_1000,110_450,110_500,55\'_fill=\'%230E5E64\'_/%3E%3C/svg%3E")] bg-no-repeat bg-center bg-[length:100%_100%] pl-5 pr-12 box-border',
    'psdBottomShape': 'absolute bottom-0 left-0 w-full h-[50px] bg-[#0E5E64] z-10 flex justify-between items-center px-12 box-border text-slate-400 text-xs before:content-[\'\'] before:absolute before:-top-1 before:left-0 before:w-full before:h-1 before:bg-[#FFBF00]',
    'highlight': 'text-white font-semibold tracking-wide',
    'previewContent': 'relative z-20 pt-10 px-12 pb-24',
    'logo': 'max-w-[280px] h-auto',
    'companyInfo': 'flex flex-col justify-center items-end text-right gap-1.5 text-xs text-white w-[380px]',
    'quoteTitle': 'text-center text-[22px] font-extrabold text-[#2d3436] underline decoration-[#0E5E64] decoration-3 underline-offset-[6px] mb-8 tracking-wide',
    'toBlock': 'border border-[#0E5E64] rounded-lg py-4 px-5 bg-gradient-to-r from-[#0E5E64]/5 to-white flex justify-between mb-5',
    'subjectBlock': 'bg-[#0E5E64] text-white py-2.5 px-5 rounded-md font-semibold text-sm mb-9',
    'quoteSection': 'mb-6',
    'quoteSectionTitle': 'flex items-center text-base font-bold text-[#0E5E64] mb-4 before:content-[\'\'] before:block before:w-[6px] before:h-[22px] before:bg-[#FFBF00] before:mr-3',
    'quoteText': 'text-[13px] leading-relaxed text-slate-800 mb-2.5',
    'deliverableList': 'list-none p-0 m-0',
    'timelineRow': 'flex items-stretch bg-slate-50 border border-slate-200 rounded-md mb-2.5 overflow-hidden',
    'timelinePhase': 'bg-[#0E5E64] text-white py-2.5 px-4 font-bold text-[11px] flex items-center justify-center w-[60px] text-center',
    'timelineDesc': 'py-2.5 px-4 flex-1',
    'timelineDuration': 'bg-[#FFBF00] text-black py-2.5 px-4 font-bold text-xs flex items-center justify-center min-w-[80px]',
    'table': 'w-full border-collapse text-[13px]',
    'tableTotalRow': 'bg-[#0E5E64] text-[#FFBF00] font-bold text-[15px]',
    'payScheduleRow': 'flex mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4 items-center',
    'payCircle': 'w-10 h-10 bg-[#0E5E64] text-white rounded-full flex items-center justify-center font-bold mr-4 shrink-0',
    'payDesc': 'flex-1',
    'payAmount': 'font-bold text-[15px] text-[#0E5E64]',
    'termsList': 'text-xs mb-2.5',
    'signatureFooter': 'flex justify-between mt-12 pb-20',
    'sigBlock': 'w-[250px]',
    'sigLine': 'border-b border-slate-800 mb-1.5 w-full',
}

def convert_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove the import styles
    content = re.sub(r"import styles from '\.\./quote\.module\.css';\n", "", content)

    # Replace classNames
    for key, tw_class in classes.items():
        # Using regex to replace className={styles.key}
        pattern = r"className=\{styles\." + key + r"\}"
        replacement = f'className="{tw_class}"'
        content = re.sub(pattern, replacement, content)
        
        # Also handle template literals with styles if any, e.g. `${styles.key}`
        pattern2 = r"\$\{styles\." + key + r"\}"
        replacement2 = tw_class
        content = re.sub(pattern2, replacement2, content)

    # Some manual fixes for elements inside styles:
    # .formHeader h2 -> this doesn't have a style. We will fix it manually in python.
    content = re.sub(r'<h2>Create Quotation</h2>', r'<h2 className="m-0 text-xl font-semibold">Create Quotation</h2>', content)
    content = re.sub(r'<label>Quotation No\.</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Quotation No.</label>', content)
    content = re.sub(r'<label>Date</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Date</label>', content)
    content = re.sub(r'<label>Subject</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Subject</label>', content)
    content = re.sub(r'<label>Client Name</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Client Name</label>', content)
    content = re.sub(r'<label>Address</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Address</label>', content)
    content = re.sub(r'<label>Phone</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phone</label>', content)
    content = re.sub(r'<label>Title</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Title</label>', content)
    content = re.sub(r'<label>Description</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>', content)
    content = re.sub(r'<label>Phase</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phase</label>', content)
    content = re.sub(r'<label>Duration</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Duration</label>', content)
    content = re.sub(r'<label>Phase Title</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Phase Title</label>', content)
    content = re.sub(r'<label>Service Description</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Service Description</label>', content)
    content = re.sub(r'<label>Cost \(₹\)</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Cost (₹)</label>', content)
    content = re.sub(r'<label>Percentage \(%\)</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Percentage (%)</label>', content)
    content = re.sub(r'<label>Condition</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Condition</label>', content)
    content = re.sub(r'<label>Term Title</label>', r'<label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Term Title</label>', content)
    
    # inputs and textareas
    input_class = 'w-full p-2.5 border border-slate-300 rounded-md text-sm font-sans transition-all focus:outline-none focus:border-[#0E5E64] focus:ring-2 focus:ring-[#0E5E64]/10'
    content = re.sub(r'<input type="text"', f'<input className="{input_class}" type="text"', content)
    content = re.sub(r'<input type="date"', f'<input className="{input_class}" type="date"', content)
    content = re.sub(r'<input type="number"', f'<input className="{input_class}" type="number"', content)
    content = re.sub(r'<textarea rows', f'<textarea className="{input_class}" rows', content)

    # Custom inner elements fixes:
    content = re.sub(r'<strong>WEBIOX - WEB & AUTOMATION AGENCY</strong>', r'<strong className="text-[#FFBF00] text-sm tracking-wide block mb-0.5">WEBIOX - WEB & AUTOMATION AGENCY</strong>', content)
    content = re.sub(r'<strong>Date:</strong>', r'<strong className="text-[#0E5E64]">Date:</strong>', content)
    content = re.sub(r'<strong>Quotation No:</strong>', r'<strong className="text-[#0E5E64]">Quotation No:</strong>', content)
    content = re.sub(r'<span>(.*?)</span>', lambda m: f'<span className="text-[#FFBF00]">{m.group(1)}</span>' if 'Quotation For' not in m.group(1) else m.group(0), content)
    
    # .deliverableList li
    content = re.sub(r'<li>', r'<li className="mb-3 pl-5 relative text-[13px] leading-relaxed before:content-[\'•\'] before:text-[#FFBF00] before:text-xl before:absolute before:left-0 before:-top-1">', content)
    content = re.sub(r'<strong>([^<]+)</strong>', lambda m: f'<strong className="text-black">{m.group(1)}</strong>' if m.group(1) not in ['WEBIOX - WEB & AUTOMATION AGENCY', 'Date:', 'Quotation No:'] else m.group(0), content)

    content = re.sub(r'<table className="w-full border-collapse text-\[13px\]">', r'<table className="w-full border-collapse text-[13px] text-left">', content)
    content = re.sub(r'<th>', r'<th className="bg-[#0E5E64] text-white py-3 px-4 text-left">', content)
    content = re.sub(r'<td>', r'<td className="py-3 px-4 border-b border-slate-200 text-slate-800">', content)

    # .tableTotalRow td overrides
    content = re.sub(r'<td colSpan="2" style=\{\{ textAlign: \'right\' \}\}>', r'<td colSpan="2" className="py-3 px-4 bg-[#0E5E64] text-[#FFBF00] font-bold text-[15px] text-right">', content)
    content = re.sub(r'<td style=\{\{ fontWeight: \'bold\' \}\}>', r'<td className="py-3 px-4 bg-[#0E5E64] text-[#FFBF00] font-bold text-[15px]">', content)

    # .payDesc strong, pct, span
    content = re.sub(r'<span className="pct">', r'<span className="inline-block bg-[#FFBF00] text-black py-0.5 px-1.5 rounded text-[11px] font-bold mr-2">', content)
    
    content = re.sub(r'<p><strong>', r'<p className="m-1 text-[13px] text-slate-800"><strong className="text-black">', content)
    content = re.sub(r'<p>Authorized', r'<p className="m-1 text-[13px] text-slate-800">Authorized', content)
    content = re.sub(r'<p>Client', r'<p className="m-1 text-[13px] text-slate-800">Client', content)
    
    # termsList li 
    content = re.sub(r'<ul className="termsList">', r'<ul className="list-decimal pl-4 m-0">', content)
    content = re.sub(r'<li className="mb-3 pl-5 relative text-\[13px\] leading-relaxed before:content-\[\'•\'\] before:text-\[\#FFBF00\] before:text-xl before:absolute before:left-0 before:-top-1">([^<]+)</li>', r'<li className="mb-2.5 text-xs text-slate-700">\1</li>', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

convert_file("d:/invoice/invoice-app/app/quote/create/page.js")
