'use client';

import type { Store } from '@/src/types/store.types';
import { SearchableEntitySelect } from './SearchableEntitySelect';

interface Props {
  value: string | null;
  onChange: (storeId: string | null) => void;
  stores: Store[];
  onCreate: (name: string) => Promise<Store | null>;
  placeholder?: string;
  disabled?: boolean;
}

/** Store-specific wrapper around SearchableEntitySelect. */
export function SearchableStoreSelect({
  value,
  onChange,
  stores,
  onCreate,
  placeholder = 'Оберіть або введіть магазин',
  disabled,
}: Props) {
  return (
    <SearchableEntitySelect<Store>
      value={value}
      onChange={onChange}
      items={stores}
      onCreate={onCreate}
      placeholder={placeholder}
      disabled={disabled}
      createOptionLabel={(q) => `Додати «${q}» як новий магазин`}
    />
  );
}
