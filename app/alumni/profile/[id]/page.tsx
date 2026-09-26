import DashboardLayout from '@/components/layout/DashboardLayout';
import AlumniPeerProfileView from '@/components/dashboard/alumni/AlumniPeerProfileView';

export default async function AlumniProfileIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DashboardLayout title="Alumni Network" role="ALUMNI" activeItem="Find Alumni">
      <AlumniPeerProfileView alumniId={id} />
    </DashboardLayout>
  );
}
