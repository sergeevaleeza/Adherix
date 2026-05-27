import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clinivore — Close the loop. Change lives.",
    template: "%s | Clinivore",
  },
  description:
    "Treatment continuity for psychiatric practices. Clinivore helps coordinators manage injectable treatment schedules, prioritize outreach, and document follow-up — HIPAA-aware.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Clinivore",
    description: "Close the loop. Change lives.",
    siteName: "Clinivore",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('clinivore-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})();`,
          }}
        />
      </head>
      <body style={{ backgroundColor: "var(--page-bg)" }} className="min-h-screen">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar session={session} />
            <main className="flex-1 ml-64 min-h-screen">
              <div className="max-w-7xl mx-auto p-6">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
