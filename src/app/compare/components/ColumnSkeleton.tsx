import {
  b5,
  roundedXl,
  shadow6,
} from '../../consts';

export function ColumnSkeleton() {
  return (
    <div
      data-testid="column-skeleton"
      className={`bg-white ${b5} ${roundedXl} ${shadow6} overflow-hidden flex flex-col animate-pulse`}
    >
      {/* Image placeholder */}
      <div className="w-full h-[200px] bg-gray-200" />

      <div className="p-5 flex flex-col gap-4">
        {/* Title placeholder */}
        <div className="h-8 w-3/4 bg-gray-200 rounded" />

        {/* Price badge placeholder */}
        <div className="h-10 w-32 bg-gray-200 rounded-xl" />

        {/* Condition badge placeholder */}
        <div className="h-16 w-full bg-gray-200 rounded-xl" />

        {/* Stats row placeholder */}
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="h-16 bg-gray-200 rounded-xl" />
        </div>

        {/* Reasons placeholder */}
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="flex flex-col gap-2">
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>

        {/* Tip placeholder */}
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
