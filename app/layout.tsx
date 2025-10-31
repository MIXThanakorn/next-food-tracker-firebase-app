import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Food Tracker App",
  description: "An app to track your daily food intake and nutrition.",
  keywords: [
    "food tracker",
    "nutrition",
    "diet",
    "health",
    "calorie counter",
    "meal planner",
  ],
  authors: [{ name: "Thanakorn", url: "https://github.com/MIXThanakorn" }],
  icons: {
    icon: "/vercel.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
