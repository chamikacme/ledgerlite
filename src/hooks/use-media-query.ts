import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
  // Initialize with the current match, but only on client side
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      return matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
