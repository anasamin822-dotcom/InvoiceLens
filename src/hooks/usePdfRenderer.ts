import { useEffect, useState, type RefObject } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface UsePdfRendererOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  url: string | null;
}

export function usePdfRenderer({ canvasRef, url }: UsePdfRendererOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    let isMounted = true;
    let renderTask: pdfjsLib.RenderTask | null = null;

    async function renderPage() {
      try {
        setLoading(true);
        setError(null);

        // pdfjs-dist v6: getDocument takes DocumentInitParameters, not a raw string
        const loadingTask = pdfjsLib.getDocument({ url: url as string });
        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        const page = await pdf.getPage(1);
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const initialViewport = page.getViewport({ scale: 1.0 });
        const dpr = window.devicePixelRatio || 1;
        // Scale to max 1000px wide CSS, rendered at device pixel ratio
        const cssWidth = Math.min(initialViewport.width, 1000);
        const scale = (cssWidth / initialViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${Math.round(initialViewport.height * (cssWidth / initialViewport.width))}px`;

        // pdfjs-dist v6: RenderParameters requires 'canvas', not 'canvasContext'
        renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
      } catch (err) {
        if (!isMounted) return;
        // RenderingCancelledException is expected on teardown — ignore it
        if (err instanceof Error && err.name === 'RenderingCancelledException') return;
        console.error('PDF render error:', err);
        setError('Failed to render PDF. Ensure the file is a valid PDF.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    renderPage();

    return () => {
      isMounted = false;
      try {
        renderTask?.cancel();
      } catch {
        // ignore
      }
    };
  }, [url, canvasRef]);

  return { loading, error };
}
