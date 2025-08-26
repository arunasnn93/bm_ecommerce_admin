import { debounce } from '@/utils';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { log } from '@utils/logger';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  initialValue?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  initialValue = '',
  className,
}) => {
  const [value, setValue] = useState(initialValue);
  const isInitialMount = useRef(true);

  // Create debounced search function with useMemo to prevent recreation
  const debouncedSearch = useMemo(
    () => debounce(onSearch, debounceMs),
    [onSearch, debounceMs]
  );

  useEffect(() => {
    // Skip the first render to prevent initial search with empty value
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only trigger search if value is not empty
    if (value.trim() !== '') {
      log.ui.userAction('search', { query: value, debounceMs });
      debouncedSearch(value);
    }
  }, [value, debouncedSearch]);

  const handleClear = () => {
    setValue('');
    log.ui.userAction('search-clear');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export { SearchInput };
export type { SearchInputProps };

