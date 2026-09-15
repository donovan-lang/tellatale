import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact — MakeATale",
  description: "Questions, bugs, partnerships or content concerns — send the MakeATale team a message.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-3">Contact Us</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Questions, bug reports, partnership ideas or a concern about content on the site — send it here
        and it goes straight to the team. To flag a specific story, use the flag icon on that story.
      </p>
      <ContactForm />
      <p className="mt-8 text-xs text-gray-500">
        Prefer email? <a href="mailto:support@indie.io" className="underline hover:text-brand-400">support@indie.io</a>
      </p>
    </div>
  );
}
