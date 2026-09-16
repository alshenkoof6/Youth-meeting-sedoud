import { FollowUpStatus, EducationStage } from '../types';

export function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return 'غير محدد';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatShortArabicDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatArabicTime(timeStr?: string): string {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = minutes || '00';
    const period = h >= 12 ? 'م' : 'ص';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${m} ${period}`;
  } catch {
    return timeStr;
  }
}

export function getFollowUpBadgeInfo(status: FollowUpStatus): {
  label: string;
  colorClass: string;
  bgClass: string;
  dotColor: string;
} {
  switch (status) {
    case 'regular':
      return {
        label: 'منتظم',
        colorClass: 'text-emerald-700 dark:text-emerald-300',
        bgClass: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
      };
    case 'irregular':
      return {
        label: 'قد يحتاج متابعة (غياب 2)',
        colorClass: 'text-amber-700 dark:text-amber-300',
        bgClass: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    case 'needs_followup':
      return {
        label: 'بحاجة لافتقاد (غياب 3)',
        colorClass: 'text-orange-700 dark:text-orange-300',
        bgClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800',
        dotColor: 'bg-orange-500',
      };
    case 'urgent':
      return {
        label: 'افتقاد عاجل (غياب 4+)',
        colorClass: 'text-rose-700 dark:text-rose-300',
        bgClass: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800',
        dotColor: 'bg-rose-500',
      };
    default:
      return {
        label: 'غير معروف',
        colorClass: 'text-slate-700',
        bgClass: 'bg-slate-50 border-slate-200',
        dotColor: 'bg-slate-400',
      };
  }
}

export function getEducationStageLabel(stage: EducationStage): string {
  switch (stage) {
    case 'middle_school':
      return 'إعدادي';
    case 'secondary':
      return 'ثانوي';
    case 'university':
      return 'جامعي';
    case 'graduate':
      return 'خريجين';
    default:
      return stage;
  }
}

export function exportToCSV(filename: string, rows: Array<Record<string, any>>) {
  if (!rows || rows.length === 0) return;
  
  const headers = Object.keys(rows[0]);
  const csvContent = [
    '\uFEFF' + headers.join(','), // UTF-8 BOM for Arabic excel support
    ...rows.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCSV(rows: Array<Record<string, any>>, filename: string) {
  exportToCSV(filename.replace(/\.csv$/, ''), rows);
}
