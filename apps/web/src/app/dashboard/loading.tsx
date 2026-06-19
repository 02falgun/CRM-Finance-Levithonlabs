import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from '../../components/skeletons';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 font-sans">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TableSkeleton rows={4} />
        </div>
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}
