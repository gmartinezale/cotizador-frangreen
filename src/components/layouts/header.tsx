"use client";

import { ArrowLeftOnRectangleIcon, Bars3Icon, SunIcon, MoonIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { useActionState } from "react";
import { logout } from "@/lib/actions";
import { useEffect, useState } from "react";

interface IHeaderProps {
  setToggleOpen: (toggleOpen: boolean) => void;
  toggleOpen?: boolean;
  setMobileOpen: (mobileOpen: boolean) => void;
  mobileOpen?: boolean;
}

export default function Header({ setToggleOpen, toggleOpen, setMobileOpen, mobileOpen }: IHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [state, dispatch] = useActionState(logout, undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setToggleOpen(!toggleOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="fixed z-30 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#232323]/95 backdrop-blur-xl shadow-sm dark:shadow-none">
      <div className="px-3 py-3 md:px-5 md:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start gap-3">
            {/* Desktop sidebar toggle */}
            <Button
              isIconOnly
              variant="light"
              className="hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800"
              onPress={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            
            {/* Mobile sidebar toggle */}
            <Button
              isIconOnly
              variant="light"
              className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
              onPress={toggleMobileSidebar}
              aria-label="Toggle mobile sidebar"
            >
              {mobileOpen ? (
                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </Button>

            <a href="/admin/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-xl font-bold whitespace-nowrap text-gray-900 dark:text-white hidden sm:block">
                Quoter Online
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                isIconOnly
                variant="light"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                onPress={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            )}

            <form action={dispatch}>
              <Button
                type="submit"
                isIconOnly
                variant="light"
                className="hover:bg-red-50 dark:hover:bg-red-950/30"
                aria-label="Logout"
                onPress={() => {
                  setTimeout(() => window.location.reload(), 1000);
                }}
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-500" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
