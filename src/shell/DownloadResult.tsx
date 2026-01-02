function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface DownloadResultProps {
  outputUrl: string | null
  outputName: string | null
  originalBytes: number | null
  processedBytes: number | null
}

export function DownloadResult({
  outputUrl,
  outputName,
  originalBytes,
  processedBytes,
}: DownloadResultProps) {
  if (!outputUrl || !outputName || originalBytes === null || processedBytes === null) {
    return (
      <section className="result-card pending">
        <h3>Result</h3>
        <p>Process a file to see output preview and download action.</p>
      </section>
    )
  }

  const delta = processedBytes - originalBytes
  const deltaLabel = delta <= 0 ? `${formatBytes(Math.abs(delta))} smaller` : `${formatBytes(delta)} larger`

  return (
    <section className="result-card">
      <h3>Result Ready</h3>
      <div className="result-stats">
        <div>
          <span>Original</span>
          <strong>{formatBytes(originalBytes)}</strong>
        </div>
        <div>
          <span>Processed</span>
          <strong>{formatBytes(processedBytes)}</strong>
        </div>
        <div>
          <span>Delta</span>
          <strong>{deltaLabel}</strong>
        </div>
      </div>
      <a className="download-button" href={outputUrl} download={outputName}>
        Download {outputName}
      </a>
    </section>
  )
}
