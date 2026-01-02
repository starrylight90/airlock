interface PrivacyBannerProps {
  networkIdleNote: string
}

export function PrivacyBanner({ networkIdleNote }: PrivacyBannerProps) {
  return (
    <aside className="privacy-banner" role="status" aria-live="polite">
      <p>
        <strong>Local-Only Promise:</strong> Files are processed in your browser only. No upload. No server.
      </p>
      <span>{networkIdleNote}</span>
    </aside>
  )
}
