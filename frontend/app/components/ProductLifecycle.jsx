'use client'

const stages = [
  'Draft',
  'Pending Approval',
  'Published',
  'Viewed',
  'Interested',
  'Negotiation',
  'Reserved',
  'Sold',
  'Delivered',
  'Completed',
  'Archived'
];

const current = 7; // Sold

export default function ProductLifecycle() {
  return (
    <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
      <h3 className='mb-4 text-sm font-semibold text-gray-700'>Product Lifecycle</h3>
      <div className='flex flex-wrap gap-2'>
        {stages.map((stage, index) => {
          const isPast = index < current;
          const isCurrent = index === current;
          const isFuture = index > current;

          let classes = 'rounded-full px-3 py-1 text-xs font-medium transition ';
          if (isCurrent) classes += 'bg-kisan-600 text-white';
          else if (isPast) classes += 'bg-kisan-100 text-kisan-800';
          else classes += 'bg-gray-100 text-gray-500';

          return (
            <div key={stage} className='flex items-center'>
              <span className={classes}>{stage}</span>
              {index !== stages.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-3 ${isPast || isCurrent ? 'bg-kisan-400' : 'bg-gray-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className='mt-5 grid grid-cols-3 gap-3 text-center'>
        <div className='rounded-xl bg-gray-50 p-3'>
          <p className='text-lg font-bold text-kisan-700'>25</p>
          <p className='text-xs text-gray-500'>Views</p>
        </div>
        <div className='rounded-xl bg-gray-50 p-3'>
          <p className='text-lg font-bold text-kisan-700'>5</p>
          <p className='text-xs text-gray-500'>Interested</p>
        </div>
        <div className='rounded-xl bg-gray-50 p-3'>
          <p className='text-lg font-bold text-kisan-700'>2</p>
          <p className='text-xs text-gray-500'>Offers</p>
        </div>
      </div>
    </div>
  );
}
