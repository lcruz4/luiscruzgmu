import { cn } from '@/lib/utils';
import type { Product } from '@/types/giantOrder';

export const ProductThumb = ({
  product,
  className,
}: {
  product: Product | undefined;
  className?: string;
}) =>
  product?.image ? (
    <img
      src={product.image.small}
      alt=''
      loading='lazy'
      className={cn(
        'size-10 shrink-0 rounded-lg bg-mist-surface object-contain',
        className,
      )}
    />
  ) : (
    <div
      className={cn('size-10 shrink-0 rounded-lg bg-mist-raised', className)}
    />
  );
