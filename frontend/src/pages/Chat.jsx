import PageContainer from '../components/layout/PageContainer'
import ComingSoon from '../components/ComingSoon'

export default function Chat() {
  return (
    <PageContainer
      title="Ask TourMate"
      subtitle="Your AI travel guide for Sri Lanka."
    >
      <ComingSoon icon="💬" title="The chatbot is warming up">
        Ask anything about visiting Sri Lanka — temples, trains, beaches, food —
        and get answers grounded in a curated travel knowledge base.
      </ComingSoon>
    </PageContainer>
  )
}
