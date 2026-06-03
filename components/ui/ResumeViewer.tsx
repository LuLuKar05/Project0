'use client';
import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  url: string;
  onReady?: () => void;
}

export default function ResumeViewer({ url, onReady }: Props) {
  const [numPages, setNumPages]     = useState<number>(0);
  const [loading, setLoading]       = useState(true);
  const containerRef                = useRef<HTMLDivElement>(null);
  const [containerWidth, setWidth]  = useState(0);

  const onContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(node);
    setWidth(node.getBoundingClientRect().width);
  }, []);

  const handleLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    onReady?.();
  }, [onReady]);

  return (
    <div
      ref={onContainerRef}
      style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
    >
      {loading && (
        <div className="dossier-loader" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="dossier-loader-dot" />
          <span className="dossier-loader-dot" />
          <span className="dossier-loader-dot" />
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={handleLoad}
        onLoadError={console.error}
        loading={null}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={i + 1}
            style={{ display: 'block', marginBottom: i < numPages - 1 ? 8 : 0 }}
          >
            <Page
              pageNumber={i + 1}
              width={containerWidth || undefined}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={null}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
