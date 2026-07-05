import PageContainer from '../components/layout/PageContainer'
import ComingSoon from '../components/ComingSoon'

export default function Explore() {
  return (
    <PageContainer
      title="Explore"
      subtitle="Attractions across Sri Lanka, recommended just for you."
    >
      <ComingSoon icon="🗺️" title="Recommendations are on their way">
        The AI recommendation engine will surface attractions matched to your
        interests, budget, and current conditions. Check back soon.
      </ComingSoon>
    </PageContainer>
  )
}
