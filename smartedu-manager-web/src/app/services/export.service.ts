import { Injectable } from '@angular/core';

export interface ExportTableContext {
  title: string;
  headers: string[];
  rows: any[];
  orientation?: 'portrait' | 'landscape';
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportPdf(context: ExportTableContext): void {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const orientation = context.orientation || 'portrait';
        const doc = new jsPDF({ orientation });

        doc.setFontSize(14);
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(context.title);
        doc.text(context.title, (pageWidth - textWidth) / 2, 18);

        const tableBody = context.rows.map((row) => {
          if (Array.isArray(row)) return row;
          return context.headers.map((header) => row[header] ?? '-');
        });

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
