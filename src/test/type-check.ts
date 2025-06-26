// Type safety test for ProjectMedia.gallery fix
import type { ProjectMedia } from '@/types/angor';

// Test the type safety of our hasGallery function
const hasGallery = (media: unknown): media is ProjectMedia & { gallery: NonNullable<ProjectMedia['gallery']> } => {
  return media != null && 
         typeof media === 'object' && 
         'gallery' in media && 
         Array.isArray((media as ProjectMedia).gallery) && 
         (media as ProjectMedia).gallery!.length > 0;
};

// Test cases
const mediaWithGallery: ProjectMedia = {
  gallery: [
    { url: 'test.jpg', type: 'image', caption: 'Test' }
  ]
};

const mediaWithoutGallery: ProjectMedia = {
  images: ['test.jpg']
};

const emptyObject = {};

// These should work without type errors
if (hasGallery(mediaWithGallery)) {
  // gallery is now guaranteed to exist and be non-empty
  console.log(mediaWithGallery.gallery[0].url); // Type-safe access
}

if (hasGallery(mediaWithoutGallery)) {
  // This block won't execute, but if it did, gallery would be type-safe
  console.log(mediaWithoutGallery.gallery[0].url);
}

if (hasGallery(emptyObject)) {
  // This block won't execute, but if it did, it would be type-safe
  console.log((emptyObject as ProjectMedia & { gallery: NonNullable<ProjectMedia['gallery']> }).gallery[0].url);
}

export { hasGallery };
