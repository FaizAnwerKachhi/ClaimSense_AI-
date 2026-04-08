import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaimSense AI — Pre-Submission Claim Validator",
  description: "AI-powered medical claim pre-submission validation engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
