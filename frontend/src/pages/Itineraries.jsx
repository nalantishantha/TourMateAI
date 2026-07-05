import PageContainer from '../components/layout/PageContainer'
import ComingSoon from '../components/ComingSoon'

export default function Itineraries() {
  return (
    <PageContainer
      title="Itineraries"
      subtitle="Your saved plans, day by day."
    >
      <ComingSoon icon="🧳" title="No itineraries yet">
        Soon you'll be able to save recommended attractions into day-by-day
        travel plans and keep your whole trip organized here.
      </ComingSoon>
    </PageContainer>
  )
}
