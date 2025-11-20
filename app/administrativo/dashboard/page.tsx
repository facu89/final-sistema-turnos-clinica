"use client";

import { GeneralHeader } from "@/components/GeneralHeader";
import { CardStats } from "./CardStats";
import { GeneralTabList } from "./GeneralTabList";
import { LogoutButton } from "@/components/logout-button";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <GeneralHeader></GeneralHeader>
      </header>

      <div className="container mx-auto px-4 py-6">
        <GeneralTabList></GeneralTabList>
      </div>
    </div>
  );
}
