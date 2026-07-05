// Layout for the public auth pages (login / sign-up): brand panel with a
// stylized Sri Lankan sunset scene on the left, form card on the right.
// On mobile the brand panel collapses to a compact header.

import Logo from './Logo'
import './auth.css'

function SunsetScene() {
  return (
    <svg
      className="auth-scene"
      viewBox="0 0 480 360"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Sky glow */}
      <circle cx="240" cy="200" r="150" fill="rgba(255, 244, 224, 0.14)" />
      <circle cx="240" cy="200" r="100" fill="rgba(255, 244, 224, 0.14)" />
      {/* Sun */}
      <circle cx="240" cy="200" r="52" fill="#F5C77E" opacity="0.95" />
      {/* Distant hills (Ella / hill country) */}
      <path d="M0 268 L90 210 L180 268 Z" fill="rgba(12, 74, 82, 0.55)" />
      <path d="M120 272 L230 196 L340 272 Z" fill="rgba(12, 74, 82, 0.4)" />
      <path d="M290 270 L390 214 L480 270 Z" fill="rgba(12, 74, 82, 0.55)" />
      {/* Ocean waves */}
      <path
        d="M0 292 Q60 282 120 292 T240 292 T360 292 T480 292 V360 H0 Z"
        fill="rgba(19, 94, 102, 0.75)"
      />
      <path
        d="M0 316 Q60 306 120 316 T240 316 T360 316 T480 316 V360 H0 Z"
        fill="rgba(12, 74, 82, 0.85)"
      />
      {/* Palm silhouette */}
      <g fill="rgba(31, 20, 12, 0.8)">
        <path d="M64 300 C66 260 62 230 58 214 L68 213 C74 236 74 268 72 300 Z" />
        <path d="M62 218 C48 204 28 198 10 202 C28 188 52 194 64 210 Z" />
        <path d="M62 216 C52 198 34 186 14 184 C36 176 58 190 66 210 Z" />
        <path d="M64 214 C62 194 70 174 84 164 C78 184 74 200 72 214 Z" />
        <path d="M66 214 C74 198 92 188 110 188 C94 198 80 208 72 218 Z" />
        <path d="M66 216 C80 208 100 208 114 216 C98 220 80 222 70 220 Z" />
      </g>
    </svg>
  )
}

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-brand-panel">
        <div className="auth-brand-top">
          <Logo size="lg" />
        </div>
        <div className="auth-brand-copy">
          <h1 className="auth-headline">
            Travel Sri Lanka with a companion who knows the way.
          </h1>
          <p className="auth-subhead">
            Personalized recommendations, a travel-savvy AI chat, and landmark
            recognition — tuned to where you are, the weather, and the time of day.
          </p>
        </div>
        <SunsetScene />
      </aside>

      <main className="auth-form-panel">
        <div className="auth-mobile-brand">
          <Logo size="lg" />
        </div>
        {children}
      </main>
    </div>
  )
}
