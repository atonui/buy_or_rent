import type { Metadata } from 'next';
import { publicSiteUrl } from '../lib/site-url';
import './globals.css';
const siteUrl = publicSiteUrl();
export const metadata: Metadata = {
  title: 'Kenya Mortgage vs Rent Calculator | buy or rent?',
  description: 'Compare the total cost of a mortgage with renting the same home in Kenya over 15 years or your own term. Edit rent, deposit, interest and upkeep assumptions.',
  ...(siteUrl ? { alternates: { canonical: siteUrl }, openGraph: { title: 'Kenya Mortgage vs Rent Calculator', description: 'Compare the cash cost of buying and renting the same Kenyan home over your mortgage term.', url: siteUrl, siteName: 'buy or rent?', type: 'website' as const } } : {}),
  robots: { index: Boolean(siteUrl), follow: Boolean(siteUrl) },
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const scriptUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL;
  return <html lang="en-KE"><head>{scriptUrl && <>
    <script dangerouslySetInnerHTML={{ __html: "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();" }} />
    <script async src={scriptUrl} />
  </>}</head><body>{children}</body></html>;
}
