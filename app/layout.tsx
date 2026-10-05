import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MULTIKIDS — таблица умножения",
  description: "Интерактивный тренажёр таблицы умножения и деления для детей 8–10 лет"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
