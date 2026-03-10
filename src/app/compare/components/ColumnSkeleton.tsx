import {
  columnSkeletonStyles,
} from '../../consts';

export function ColumnSkeleton() {
  return (
    <div
      data-testid="column-skeleton"
      className={columnSkeletonStyles.root}
    >
      {/* Image placeholder */}
      <div className={columnSkeletonStyles.image} />

      <div className={columnSkeletonStyles.body}>
        {/* Title placeholder */}
        <div className={columnSkeletonStyles.title} />

        {/* Price badge placeholder */}
        <div className={columnSkeletonStyles.price} />

        {/* Condition badge placeholder */}
        <div className={columnSkeletonStyles.condition} />

        {/* Stats row placeholder */}
        <div className={columnSkeletonStyles.statsGrid}>
          <div className={columnSkeletonStyles.stat} />
          <div className={columnSkeletonStyles.stat} />
          <div className={columnSkeletonStyles.stat} />
        </div>

        {/* Reasons placeholder */}
        <div className={columnSkeletonStyles.reasonsTitle} />
        <div className={columnSkeletonStyles.reasonsCol}>
          <div className={columnSkeletonStyles.reason} />
          <div className={columnSkeletonStyles.reason} />
          <div className={columnSkeletonStyles.reason} />
        </div>

        {/* Tip placeholder */}
        <div className={columnSkeletonStyles.tipTitle} />
        <div className={columnSkeletonStyles.tip} />
      </div>
    </div>
  );
}
