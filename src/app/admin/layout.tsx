"use client";

import React, { useState } from "react";
import Header from "@/components/layouts/header";
import Sidebar from "@/components/layouts/sidebar";

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const [toggleOpen, setToggleOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a]">
      <Header 
        setToggleOpen={setToggleOpen} 
        toggleOpen={toggleOpen} 
        setMobileOpen={setMobileOpen}
        mobileOpen={mobileOpen}
      />
      <div className="flex pt-16">
        <Sidebar 
          toggleOpen={toggleOpen} 
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </div>
      <main
        className={`${
          toggleOpen ? "lg:ml-64" : "lg:ml-16"
        } transition-all duration-200 ease-in-out p-4 sm:p-6 min-h-[calc(100vh-4rem)] pb-24 lg:pb-6`}
      >
        <div className="mx-auto max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
