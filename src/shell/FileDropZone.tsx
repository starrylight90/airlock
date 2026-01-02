import { useRef, useState } from 'react'

interface FileDropZoneProps {
  acceptedMimePrefix: string
  file: File | null
  onFileSelected: (file: File) => void
}

export function FileDropZone({ acceptedMimePrefix, file, onFileSelected }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  function openPicker() {
    inputRef.current?.click()
  }

  function acceptFile(fileCandidate: File | null) {
    if (!fileCandidate) {
      return
    }

    if (!fileCandidate.type.startsWith(acceptedMimePrefix)) {
      return
    }

    onFileSelected(fileCandidate)
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    const dropped = event.dataTransfer.files?.[0] ?? null
    acceptFile(dropped)
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    acceptFile(selected)
  }

  return (
    <div
      className={`drop-zone ${isDragActive ? 'drag-active' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragActive(true)
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={onDrop}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      aria-label="Drop an image file or browse"
    >
      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        onChange={onChange}
      />
      <div className="drop-zone-copy">
        <h3>Drop an image here</h3>
        <p>or click to browse your device</p>
      </div>
      {file ? (
        <div className="picked-file">
          <p>{file.name}</p>
          <span>{Math.round(file.size / 1024)} KB</span>
        </div>
      ) : null}
    </div>
  )
}
