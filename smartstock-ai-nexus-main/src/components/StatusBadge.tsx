import { ProductStatus } from '@/lib/types';

const classMap: Record<ProductStatus, string> = {
  EXPIRED: 'badge-expired',
  LOW_STOCK: 'badge-low-stock',
  OVERFLOW: 'badge-overflow',
  OK: 'badge-ok',
};

const labelMap: Record<ProductStatus, string> = {
  EXPIRED: 'EXPIRED',
  LOW_STOCK: 'LOW STOCK',
  OVERFLOW: 'OVERFLOW',
  OK: 'IN STOCK',
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return <span className={classMap[status]}>{labelMap[status]}</span>;
}
