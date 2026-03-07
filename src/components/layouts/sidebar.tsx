"use client";

import {
  ChartPieIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface ISidebarProps {
  toggleOpen?: boolean;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const naviItems = [
  {
    icon: ChartPieIcon,
    name: "Dashboard",
    url: "/admin",
  },
  {
    icon: ClipboardDocumentCheckIcon,
    name: "Cotizador",
    url: "/admin/quoter",
  },
  {
    icon: WrenchScrewdriverIcon,
    name: "Mantenedores",
    url: "#",
    insider: true,
    children: [
      {
        name: "Productos",
        url: "/admin/products",
      },
    ],
  },
];

interface NavContentProps {
  pathname: string;
  toggleOpen: boolean;
  mobileOpen: boolean;
}

function NavContent({ pathname, toggleOpen, mobileOpen }: NavContentProps) {
  return (
    <nav className="flex-1 px-3 space-y-1">
      <ul className="pb-2 space-y-1">
        {naviItems.map((item, index) => {
          if (item.insider && item.children) {
            const isChildActive = item.children.some(
              (child) => child.url === pathname
            );

            return (
              <li key={index}>
                {toggleOpen || mobileOpen ? (
                  <Accordion
                    className="px-0"
                    defaultExpandedKeys={isChildActive ? [index.toString()] : []}
                  >
                    <AccordionItem
                      key={index.toString()}
                      aria-label={item.name}
                      title={
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-default-500" />
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                        </div>
                      }
                      indicator={<ChevronDownIcon className="w-4 h-4" />}
                      classNames={{
                        trigger: "py-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors",
                        title: "text-gray-700 dark:text-gray-300",
                      }}
                    >
                      <ul className="space-y-1 ml-8">
                        {item.children.map((child, childIndex) => (
                          <li key={childIndex}>
                            <Link
                              href={child.url}
                              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                child.url === pathname
                                  ? "bg-blue-600 text-white font-medium shadow-sm"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                              }`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <button
                    className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                    title={item.name}
                  >
                    <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </li>
            );
          }

          return (
            <li key={index}>
              <Link
                href={item.url}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  item.url === pathname
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {(toggleOpen || mobileOpen) && (
                  <span className="text-sm font-medium">
                    {item.name}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Sidebar({ toggleOpen = true, mobileOpen = false, setMobileOpen }: ISidebarProps) {
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen && setMobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, setMobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen?.(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#232323] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile sidebar"
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Quoter Online
            </span>
          </div>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setMobileOpen?.(false)}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
        
        {/* Mobile nav content */}
        <div className="flex flex-col flex-1 pt-4 pb-4 overflow-y-auto">
          <NavContent pathname={pathname} toggleOpen={toggleOpen} mobileOpen={mobileOpen} />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 z-20 flex-col shrink-0 hidden ${
          toggleOpen ? "w-64" : "w-16"
        } h-full pt-16 font-normal duration-200 lg:flex transition-all border-r border-gray-200 dark:border-gray-800`}
        aria-label="Sidebar"
      >
        <div className="relative flex flex-col flex-1 min-h-0 pt-0 bg-white dark:bg-[#232323] transition-all duration-200 ease-in-out">
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            <NavContent pathname={pathname} toggleOpen={toggleOpen} mobileOpen={mobileOpen} />
          </div>
        </div>
      </aside>
    </>
  );
}
