import { Injectable } from '@angular/core';

export interface ExportTableContext {
  title: string;
  headers: string[];
  rows: any[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportPdf(context: ExportTableContext): void {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(14);
        doc.text(context.title, 14, 18);

        const tableBody = context.rows.map((row) => context.headers.map((header) => row[header] ?? '-'));

        (autoTable as any)(doc, {
          startY: 24,
          head: [context.headers],
          body: tableBody,
          theme: 'grid'
        });

        doc.save(`${context.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      });
    });
  }

  exportExcel(context: ExportTableContext): void {
    import('xlsx').then((xlsx) => {
      const sheet = xlsx.utils.json_to_sheet(context.rows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, sheet, context.title.length > 31 ? 'Sheet1' : context.title);
      xlsx.writeFile(workbook, `${context.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    });
  }
}
