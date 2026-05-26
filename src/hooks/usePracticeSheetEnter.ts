import { useEffect, useRef, useState } from "react";

export function usePracticeSheetEnter(currentIndex: number) {
  const prevIndexRef = useRef(currentIndex);
  const isFirstRender = useRef(true);
  const [enterClass, setEnterClass] = useState("");

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevIndexRef.current = currentIndex;
      return;
    }

    const prev = prevIndexRef.current;
    if (currentIndex > prev) {
      setEnterClass("motion-safe:animate-sheet-next");
    } else if (currentIndex < prev) {
      setEnterClass("motion-safe:animate-sheet-prev");
    }

    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  return enterClass;
}
