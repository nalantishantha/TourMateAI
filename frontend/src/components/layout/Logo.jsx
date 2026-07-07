// TourMateAI wordmark image. Used in the navbar, auth pages, and footer.

import logoColored from '../../assets/logo_colored.png'

export default function Logo({ size = 'md' }) {
  return (
    <span className={`logo logo-${size}`}>
      <img src={logoColored} alt="TourMateAI" className="logo-mark" />
    </span>
  )
}
