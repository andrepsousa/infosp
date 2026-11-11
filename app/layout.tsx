import type { Metadata } from "next";
import "./vai-sp.css";

export const metadata: Metadata = {
  title: "infosp � Seu dia pela cidade",
  description: "Clima, situa��o das linhas, mapas e not�cias �teis de S�o Paulo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "infosp", statusBarStyle: "default" },
  icons: {
    icon: "/infosp-192.png",
    apple: "/infosp-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
