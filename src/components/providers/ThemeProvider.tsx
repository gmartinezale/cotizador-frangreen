"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <HeroUIProvider>{children}</HeroUIProvider>;
  }

  return (
    <HeroUIProvider>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme="dark"
        themes={["light", "dark"]}
        enableSystem
      >
        {children}
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
