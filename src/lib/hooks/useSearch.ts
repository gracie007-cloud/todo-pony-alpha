/**
 * useSearch Hook
 * 
 * Search functionality with Fuse.js for fuzzy searching.
 */

import { useState, useMemo, useCallback } from 'react';
import Fuse, { FuseResultMatch } from 'fuse.js';
import type { TaskWithRelations, Label, List } from '@/lib/db/schema';
import { useDebounce } from './useDebounce';

export interface SearchResult {
  item: TaskWithRelations;
  score?: number;
  matches?: FuseResultMatch[];
}

export interface SearchOptions {
  keys?: Array<string | { name: string; weight: number }>;
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
  findAllMatches?: boolean;
}

const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'labels.name', weight: 1.5 },
    { name: 'list.name', weight: 1 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  findAllMatches: false,
};

/**
 * Hook for searching tasks with Fuse.js
 */
export function useTaskSearch(
  tasks: TaskWithRelations[],
  options: SearchOptions = {}
) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };

  // Create Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(tasks, searchOptions);
  }, [tasks, JSON.stringify(searchOptions)]);

  // Perform search
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return tasks.map((task) => ({ item: task }));
    }

    return fuse.search(debouncedQuery).map((result) => ({
      item: result.item,
      score: result.score,
      matches: result.matches,
    }));
  }, [fuse, debouncedQuery, tasks]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    results,
    search,
    clear,
    isSearching: query !== debouncedQuery,
  };
}

/**
 * Hook for searching labels
 */
export function useLabelSearch(labels: Label[]) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const fuse = useMemo(() => {
    return new Fuse(labels, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [labels]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return labels;
    }

    return fuse.search(debouncedQuery).map((result) => result.item);
  }, [fuse, debouncedQuery, labels]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    results,
    search,
    clear,
  };
}

/**
 * Hook for searching lists
 */
export function useListSearch(lists: List[]) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const fuse = useMemo(() => {
    return new Fuse(lists, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [lists]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return lists;
    }

    return fuse.search(debouncedQuery).map((result) => result.item);
  }, [fuse, debouncedQuery, lists]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    results,
    search,
    clear,
  };
}

/**
 * Hook for global search across all entities
 */
export function useGlobalSearch(
  tasks: TaskWithRelations[],
  labels: Label[],
  lists: List[]
) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // Task search
  const taskFuse = useMemo(() => {
    return new Fuse(tasks, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'description', weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
    });
  }, [tasks]);

  // Label search
  const labelFuse = useMemo(() => {
    return new Fuse(labels, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [labels]);

  // List search
  const listFuse = useMemo(() => {
    return new Fuse(lists, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [lists]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return {
        tasks: [],
        labels: [],
        lists: [],
      };
    }

    return {
      tasks: taskFuse.search(debouncedQuery).slice(0, 5).map((r) => r.item),
      labels: labelFuse.search(debouncedQuery).slice(0, 3).map((r) => r.item),
      lists: listFuse.search(debouncedQuery).slice(0, 3).map((r) => r.item),
    };
  }, [taskFuse, labelFuse, listFuse, debouncedQuery]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  const hasResults =
    results.tasks.length > 0 ||
    results.labels.length > 0 ||
    results.lists.length > 0;

  return {
    query,
    debouncedQuery,
    results,
    hasResults,
    search,
    clear,
    isSearching: query !== debouncedQuery,
  };
}

export default useTaskSearch;
