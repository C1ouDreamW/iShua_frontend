import { useEffect, useState } from "react";

function resolvePageSize() {
  if (window.matchMedia("(min-width: 1024px)").matches) {
    return 12;
  }

  if (window.matchMedia("(min-width: 768px)").matches) {
    return 10;
  }

  return 8;
}

export function useResponsivePageSize() {
  const [pageSize, setPageSize] = useState(() => resolvePageSize());

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(min-width: 768px)"),
    ];
    const updatePageSize = () => setPageSize(resolvePageSize());

    mediaQueries.forEach((query) =>
      query.addEventListener("change", updatePageSize),
    );

    return () => {
      mediaQueries.forEach((query) =>
        query.removeEventListener("change", updatePageSize),
      );
    };
  }, []);

  return pageSize;
}
