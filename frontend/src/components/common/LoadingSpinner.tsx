export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-brand-secondary border-t-brand-base rounded-full animate-spin" />
    </div>
  );
}
