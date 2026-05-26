import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import { SearchLinksDocument } from '../../__generated__/graphql';

const DEBOUNCE_DELAY = 300;

export function useLinkSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimerRef =
    useRef<ReturnType<typeof setTimeout>>(undefined);

  const [searchLinks, searchResults] = useLazyQuery(
    SearchLinksDocument
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim() === '') {
      setDebouncedSearch('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearch) {
      searchLinks({ variables: { search: debouncedSearch } });
    }
  }, [debouncedSearch, searchLinks]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    searchLinks,
    searchResults,
  };
}
