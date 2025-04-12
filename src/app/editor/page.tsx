import ImageEditor2 from '@/components/ImageEditor2';
import { Suspense } from 'react';

<Suspense fallback={<div>Loading Image Editor...</div>}>
  <ImageEditor2 />
</Suspense>
