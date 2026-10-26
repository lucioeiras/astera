import { FileText } from 'lucide-react-native';

type PdfPreviewProps = {
  uri: string;
};

export function PdfPreview({ uri }: PdfPreviewProps) {
  // Browser-native PDF embedding is inconsistent for local file URIs.
  void uri;
  return <FileText size={36} color="#ef4444" strokeWidth={2} />;
}
