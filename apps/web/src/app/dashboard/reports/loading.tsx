import { PageHeaderSkeleton, TableSkeleton } from '../../../components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-8 font-sans">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
