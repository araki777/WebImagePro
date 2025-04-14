import ImageEditor2 from '@/components/ImageEditor2';
import { Suspense } from 'react';

const EditorPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>}>
      <ImageEditor2 />
    </Suspense>
  );
};

export default EditorPage;
