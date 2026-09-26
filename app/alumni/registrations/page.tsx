import DashboardLayout from '@/components/layout/DashboardLayout';
import OpportunityRegistrations from '@/components/dashboard/alumni/OpportunityRegistrations';

export default async function AlumniRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ postType?: string; postId?: string }>;
}) {
  const params = await searchParams;

  return (
    <DashboardLayout title="Alumni portal" role="ALUMNI" activeItem="Careers">
      {params.postType && params.postId ? (
        <OpportunityRegistrations postType={params.postType} postId={params.postId} />
      ) : (
        <div className="max-w-4xl mx-auto bg-white/60 border border-white/70 rounded-2xl p-8 text-sm font-bold text-slate-700">
          Select a specific opportunity from your Career or Mentorship dashboard to view registrations.
        </div>
      )}
    </DashboardLayout>
  );
}
