import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

type SortOption = {
  value: string
  label: string
}

const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price (low to high)' },
  { value: 'price-high', label: 'Price (high to low)' },
]

export default function SortBySelect({
  value,
  onValueChange,
  labelId,
}: {
  value: string
  onValueChange: (value: string) => void
  labelId?: string
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="sort-select__trigger" aria-label="Sort by" aria-labelledby={labelId}>
        <Select.Value />
        <Select.Icon className="sort-select__icon">
          <ChevronUp size={16} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="sort-select__content" position="popper" sideOffset={10} align="start">
          <Select.ScrollUpButton className="sort-select__scroll-button">
            <ChevronUp size={14} />
          </Select.ScrollUpButton>
          <Select.Viewport className="sort-select__viewport">
            {sortOptions.map((option) => (
              <Select.Item key={option.value} value={option.value} className="sort-select__item">
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="sort-select__item-indicator">
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="sort-select__scroll-button">
            <ChevronDown size={14} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
