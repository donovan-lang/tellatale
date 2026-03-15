export const metadata = { title: "Privacy Policy — MakeATale" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-gray dark:prose-invert prose-sm max-w-none space-y-4 text-gray-600 dark:text-gray-400">
        <p className="text-sm"><em>Last updated: March 15, 2026</em></p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">What We Collect</h2>
        <p>Account info (email, pen name), stories you write, votes, comments, and reading progress. For anonymous users, we collect IP addresses for rate limiting and vote tracking.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">How We Use It</h2>
        <p>To operate the platform, personalize your experience, send notifications you've opted into, and prevent abuse.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">What We Share</h2>
        <p>Your stories, pen name, and profile are public. We don't sell personal data. We may share data with law enforcement if required by law.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">Cookies</h2>
        <p>We use essential cookies for authentication and preferences (like dark/light mode). No third-party tracking cookies.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">Your Rights</h2>
        <p>You can view, edit, and delete your account and content at any time from your account settings. Contact us to request a full data export or deletion.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">Data Storage</h2>
        <p>Data is stored on Supabase (PostgreSQL) and DigitalOcean infrastructure. Wallet addresses are stored only if you provide them for tips.</p>

        <p className="mt-8 text-xs text-gray-500">Questions? Contact support@indie.io</p>
      </div>
    </div>
  );
}
