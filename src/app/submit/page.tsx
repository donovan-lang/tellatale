import StoryForm from "@/components/StoryForm";

export const metadata = {
  title: "Submit a Story — MakeATale",
};

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Plant a Story Seed</h1>
      <StoryForm />
    </div>
  );
}
