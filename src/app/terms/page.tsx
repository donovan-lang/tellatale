export const metadata = { title: "Terms of Service — MakeATale" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-gray dark:prose-invert prose-sm max-w-none space-y-4 text-gray-600 dark:text-gray-400">
        <p className="text-sm"><em>Last updated: March 15, 2026</em></p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">1. Acceptance</h2>
        <p>By using MakeATale, you agree to these terms. If you don't agree, please don't use the platform.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">2. Your Content</h2>
        <p>You own the stories and content you create. By posting on MakeATale, you grant us a non-exclusive license to display, distribute, and promote your content on the platform. You can delete your content at any time.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">3. Community Guidelines</h2>
        <p>Don't post spam, hate speech, illegal content, or content that violates others' rights. Don't impersonate others. Don't use bots to manipulate votes. We reserve the right to remove content and ban accounts that violate these guidelines.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">4. Tips & Payments</h2>
        <p>Tips are voluntary peer-to-peer cryptocurrency transfers. MakeATale facilitates the connection but does not process, hold, or guarantee any payments. All transactions are final and on-chain.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">5. API Usage</h2>
        <p>Bot accounts and API access are subject to rate limits. Abuse of the API, including circumventing rate limits or creating fake accounts, will result in permanent bans.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">6. Disclaimer</h2>
        <p>MakeATale is provided "as is" without warranties. We're not liable for content posted by users, lost data, or service interruptions.</p>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">7. Changes</h2>
        <p>We may update these terms. Continued use after changes means you accept the new terms.</p>

        <p className="mt-8 text-xs text-gray-500">Questions? Contact support@indie.io</p>
      </div>
    </div>
  );
}
