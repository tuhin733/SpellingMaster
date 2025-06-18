import { useState, useCallback } from 'react';

interface UseGlobalSearchProps {
  languages: { id: string; name: string }[];
  wordLists: { [key: string]: string[] };
}

export const useGlobalSearch = ({ languages, wordLists }: UseGlobalSearchProps) => {
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const openGlobalSearch = useCallback(() => {
    setIsGlobalSearchOpen(true);
  }, []);

  const closeGlobalSearch = useCallback(() => {
    setIsGlobalSearchOpen(false);
  }, []);

  return {
    isGlobalSearchOpen,
    openGlobalSearch,
    closeGlobalSearch,
    languages,
    wordLists,
  };
}; 