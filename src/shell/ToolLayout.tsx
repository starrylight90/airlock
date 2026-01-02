import type { ReactNode } from 'react'

interface ToolLayoutProps {
  title: string
  subtitle: string
  controls: ReactNode
  dropZone: ReactNode
  result: ReactNode
}

export function ToolLayout({ title, subtitle, controls, dropZone, result }: ToolLayoutProps) {
  return (
    <main className="tool-layout">
      <section className="hero-panel">
        <p className="eyebrow">Airlock Utilities</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
      <section className="workspace-grid">
        <article className="panel controls-panel">
          <h2>Controls</h2>
          {controls}
        </article>
        <article className="panel drop-panel">
          <h2>Input</h2>
          {dropZone}
        </article>
        <article className="panel result-panel">
          <h2>Output</h2>
          {result}
        </article>
      </section>
    </main>
  )
}
