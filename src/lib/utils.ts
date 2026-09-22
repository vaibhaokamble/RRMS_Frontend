import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] ?? { message: 'No matching records' });
  const esc = (v: unknown) => {
    let t = String(v ?? '');
    if (/^[=+@-]/.test(t)) t = "'" + t;
    return '"' + t.replaceAll('"', '""') + '"';
  };
  download(
    name,
    '\uFEFF' +
      [keys.map(esc).join(','), ...rows.map((row) => keys.map((k) => esc(row[k])).join(','))].join(
        '\r\n',
      ),
    'text/csv;charset=utf-8',
  );
}
export function download(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
