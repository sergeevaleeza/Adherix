import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Clinivore — Treatment Continuity Dashboard",
  description: "Psychiatric treatment continuity dashboard for behavioral health practices",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar session={session} />
          <main className="flex-1 ml-64 min-h-screen">
            <div className="max-w-7xl mx-auto p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
