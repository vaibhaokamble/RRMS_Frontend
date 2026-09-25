import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  Inbox,
  Check,
  LoaderCircle,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn-primary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      destructive: 'btn-danger',
      soft: 'btn-soft',
    },
    size: { default: '', sm: 'btn-sm', icon: 'btn-icon' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  const text = typeof children === 'string' ? children.toLowerCase() : '';
  return (
    <span
      className={cn(
        'badge',
        text.match(/^(ready|available|completed|resolved|active|approved|paid|checked in)$/)
          ? 'badge-green'
          : text.match(/cancel|high|no-show|maintenance|declined|unpaid|unavailable|out of service/)
            ? 'badge-red'
            : text.match(/pending|confirm|requested|inspection|progress|medium|dirty|cleaning|reserved/)
              ? 'badge-amber'
              : 'badge-neutral',
        className,
      )}
    >
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className={cn('dialog-content', wide && 'dialog-wide')}>
          <div className="dialog-header">
            <div>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                {description ?? 'Review the details below and save your changes.'}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X size={18} />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export function Menu({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content className="dropdown-content" align="end" sideOffset={10}>
          {children}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}
export function MenuItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <DropdownPrimitive.Item className="dropdown-item" onSelect={onSelect}>
      {children}
    </DropdownPrimitive.Item>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section style={style} className={cn('card', className)}>
      {children}
    </section>
  );
}
export function CardHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title = 'Nothing here just yet',
  description = 'New records will appear here as your resort day unfolds.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={25} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Avatar({
  name,
  size = 'normal',
}: {
  name: string;
  size?: 'normal' | 'small' | 'large';
}) {
  const palette = ['#e9ece0', '#fae9db', '#e3edf2', '#eae3ef', '#e6eee8'];
  return (
    <span
      className={cn('avatar', `avatar-${size}`)}
      style={{ background: palette[name.charCodeAt(0) % palette.length] }}
    >
      {name
        .split(' ')
        .slice(0, 2)
        .map((x) => x[0])
        .join('')}
    </span>
  );
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="tabs"
      role="tablist"
      onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const index = tabs.findIndex((t) => t.value === value),
          next = (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        onChange(tabs[next].value);
        (e.currentTarget.children[next] as HTMLElement).focus();
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          tabIndex={value === t.value ? 0 : -1}
          onClick={() => onChange(t.value)}
          className={cn('tab', value === t.value && 'selected')}
        >
          {t.label}
          {t.count !== undefined && <span>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
export type FieldSpec = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number;
  hint?: string;
  wide?: boolean;
  disabled?: boolean;
};
export function Fields({
  fields,
  values,
  onChange,
}: {
  fields: FieldSpec[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => (
        <label className={cn('field', f.wide && 'field-wide')} key={f.name}>
          <span>
            {f.label}
            {f.required && <b> *</b>}
          </span>
          {f.type === 'select' ? (
            <select
              disabled={f.disabled}
              required={f.required}
              value={values[f.name] ?? ''}
              onChange={(e) => onChange(f.name, e.target.value)}
            >
              <option value="">Select {f.label.toLowerCase()}</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.name] ?? ''}
              onChange={(e) => onChange(f.name, e.target.value)}
              rows={3}
            />
          ) : f.type === 'checkbox' ? (
            <div className="check-field">
              <input
                type="checkbox"
                checked={!!values[f.name]}
                onChange={(e) => onChange(f.name, e.target.checked)}
              />
              <span>{f.hint ?? 'Enabled'}</span>
            </div>
          ) : (
            <input
              type={f.type ?? 'text'}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.name] ?? ''}
              min={f.min}
              max={f.max}
              step={f.step}
              disabled={f.disabled}
              onChange={(e) =>
                onChange(
                  f.name,
                  f.type === 'number'
                    ? e.target.value === ''
                      ? ''
                      : Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          )}{' '}
          {f.hint && f.type !== 'checkbox' && <small>{f.hint}</small>}
        </label>
      ))}
    </div>
  );
}
export function FormModal({
  title,
  description,
  fields,
  initial,
  onClose,
  onSubmit,
  submit = 'Save changes',
  children,
}: {
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial?: Record<string, any>;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => boolean;
  submit?: string;
  children?: React.ReactNode;
}) {
  const [values, setValues] = React.useState(initial ?? {});
  return (
    <Modal open onClose={onClose} title={title} description={description}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit(values)) onClose();
        }}
      >
        <div className="dialog-body">
          {children}
          <Fields
            fields={fields}
            values={values}
            onChange={(k, v) => setValues({ ...values, [k]: v })}
          />
        </div>
        <div className="dialog-footer">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {submit}
            <Check size={15} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function Confirm({
  title,
  description,
  onClose,
  onConfirm,
  label = 'Confirm',
  cancelLabel = 'Go back',
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => boolean;
  label?: string;
  cancelLabel?: string;
}) {
  return (
    <Modal open onClose={onClose} title={title} description={description}>
      <div className="dialog-footer">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (onConfirm()) onClose();
          }}
        >
          {label}
        </Button>
      </div>
    </Modal>
  );
}
export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sort?: (row: T) => string | number;
};
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchBy,
  placeholder = 'Search records…',
  filters,
  pageSize = 7,
  onRowClick,
  hideToolbar = false,
}: {
  rows: T[];
  columns: Column<T>[];
  searchBy: (r: T) => string;
  placeholder?: string;
  filters?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (r: T) => void;
  hideToolbar?: boolean;
}) {
  const [query, setQuery] = React.useState(''),
    [page, setPage] = React.useState(0),
    [sort, setSort] = React.useState<{ key: string; dir: number } | null>(null);
  const filtered = rows.filter((r) => searchBy(r).toLowerCase().includes(query.toLowerCase()));
  if (sort) {
    const col = columns.find((c) => c.key === sort.key);
    if (col?.sort)
      filtered.sort((a, b) => {
        const av = col.sort!(a),
          bv = col.sort!(b);
        return (
          (typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv))) * sort.dir
        );
      });
  }
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  return (
    <div>
      {!hideToolbar && <div className="table-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label={placeholder}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </label>
        <div className="table-filters">{filters}</div>
      </div>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" aria-sort={c.sort ? sort?.key === c.key ? sort.dir === 1 ? 'ascending' : 'descending' : 'none' : undefined}>
                  {c.sort ? (
                    <button
                      className="sort-button"
                      onClick={() =>
                        setSort({ key: c.key, dir: sort?.key === c.key ? -sort.dir : 1 })
                      }
                    >
                      {c.label}
                      <ArrowUpDown size={12} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(current * pageSize, (current + 1) * pageSize).map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'clickable-row' : ''}
              >
                {columns.map((c) => (
                  <td key={c.key}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <Empty
          title="No matching records"
          description="Try another search or adjust your filters."
        />
      )}
      <div className="table-pagination">
        <span>
          Showing {filtered.length ? current * pageSize + 1 : 0}–
          {Math.min((current + 1) * pageSize, filtered.length)} of {filtered.length} records
        </span>
        <div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={15} />
          </Button>
          <span>
            {current + 1} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
export function Counter({
  value,
  format = (n) => String(n),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = React.useState(value);
  React.useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let id: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 650);
      setDisplay(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value, reduced]);
  return <>{format(display)}</>;
}
export function PageMotion({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
export function Skeleton() {
  return (
    <div className="skeleton-layout" aria-label="Loading workspace" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
