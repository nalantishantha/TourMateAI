import PageContainer from '../components/layout/PageContainer'
import ComingSoon from '../components/ComingSoon'

export default function Identify() {
  return (
    <PageContainer
      title="Identify a landmark"
      subtitle="Snap it, and TourMate will name it."
    >
      <ComingSoon icon="📸" title="Landmark recognition is on its way">
        Soon you'll be able to upload a photo of any Sri Lankan landmark and
        get its name, history, and nearby places to visit — powered by the
        image-recognition model we're training.
      </ComingSoon>
    </PageContainer>
  )
}
