import "./globals.css";

export const metadata = {
  title: "Ticket System",
  description: "…",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
