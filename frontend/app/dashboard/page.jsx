import Sidebar from '../components/Sidebar'
import KpiCards from '../components/KpiCards'
import LandParcelsSpotlight from '../components/LandParcelsSpotlight'
import ChartsSection from '../components/ChartsSection'
import ModuleGrid from '../components/ModuleGrid'
import ActivityTimeline from '../components/ActivityTimeline'
import ProductLifecycle from '../components/ProductLifecycle'

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <main className='flex-1 p-4 md:p-6 space-y-6'>
          <KpiCards />
          <LandParcelsSpotlight />
          <ChartsSection />
          <ModuleGrid />
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <ActivityTimeline />
            <ProductLifecycle />
          </div>
        </main>
      </div>
    </div>
  )
}
