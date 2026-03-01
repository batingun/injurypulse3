export const metadata = {
  title: 'InjuryPulse - Sakatlık & Ceza Takip',
  description: 'S Sport Plus Kreatif Ekibi İçin Sakatlık ve Kart Cezası Takip Sistemi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
