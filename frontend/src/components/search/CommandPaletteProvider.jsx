import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CommandPalette from "./CommandPalette";
import { CommandPaletteContext } from "./CommandPaletteContext";

export default function CommandPaletteProvider({ children }) {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef(null);
  const isAvailable = isLoaded && isSignedIn && Boolean(orgId);

  const openPalette = useCallback(() => {
    if (!isAvailable) return;
    returnFocusRef.current = document.activeElement;
    setIsOpen(true);
  }, [isAvailable]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => {
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
    });
  }, []);

  useEffect(() => {
    if (!isAvailable) return undefined;

    function handleGlobalShortcut(event) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "k") {
        return;
      }

      event.preventDefault();
      if (isOpen) closePalette();
      else openPalette();
    }

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, [closePalette, isAvailable, isOpen, openPalette]);

  const contextValue = useMemo(() => ({ openPalette }), [openPalette]);

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      {isOpen && isAvailable ? <CommandPalette onClose={closePalette} /> : null}
    </CommandPaletteContext.Provider>
  );
}
