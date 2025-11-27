import './globals.css';

export const metadata = {
  title: 'Internities - Find Your Perfect Internship',
  description: 'Connect students with companies for meaningful internship experiences',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
