import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { FileText } from 'lucide-react-native';
import type { PdfProps } from 'react-native-pdf';

type PdfPreviewProps = {
  uri: string;
  width?: number;
  height?: number;
  fullReader?: boolean;
};

export function PdfPreview({ uri, width = 80, height = 96, fullReader = false }: PdfPreviewProps) {
  const [Pdf, setPdf] = useState<ComponentType<PdfProps> | null>(null);

  useEffect(() => {
    let active = true;

    import('react-native-pdf')
      .then((module) => {
        if (active) setPdf(() => module.default);
      })
      .catch((error: unknown) => {
        console.warn('PDF preview is unavailable in this app build:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!Pdf) {
    return <FileText size={36} color="#ef4444" strokeWidth={2} />;
  }

  return (
    <Pdf
      key={uri}
      source={{ uri, cache: false }}
      singlePage={!fullReader}
      scrollEnabled={fullReader}
      enablePaging={fullReader}
      fitPolicy={0}
      style={fullReader ? { flex: 1, width: '100%', height: '100%' } : { width, height }}
    />
  );
}
