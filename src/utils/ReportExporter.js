import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (filename, data) => {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = (filename, data) => {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (filename, title, headers, rows, orientation = 'landscape') => {
  if (!rows || rows.length === 0) return;
  
  const doc = new jsPDF({ orientation });
  
  // University Branding Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KL University', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Department of Computer Science and Engineering', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
  doc.text('Academic Year: 2023-2024 | Semester: Odd', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
  
  // Table
  doc.autoTable({
    startY: 45,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }, // primary-600 color
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 45 },
    didDrawPage: function (data) {
      // Footer with timestamp and page number
      const str = 'Page ' + doc.internal.getNumberOfPages();
      const timeStr = 'Generated: ' + new Date().toLocaleString();
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(timeStr, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
      doc.text(str, doc.internal.pageSize.getWidth() - data.settings.margin.right - 10, doc.internal.pageSize.getHeight() - 10);
    }
  });
  
  doc.save(`${filename}.pdf`);
};
