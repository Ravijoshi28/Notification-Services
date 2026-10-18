import type { Metadata } from "next";
import "./globals.css";
import { ConsoleProvider } from "./components/console-state";

export const metadata: Metadata = {
  title: "NotiApp | Notification console",
  description: "Compose notifications and inspect your notification API.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full"><ConsoleProvider>{children}</ConsoleProvider></body>
    </html>
  );
}
