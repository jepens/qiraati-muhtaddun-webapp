import React, { useState, useEffect } from 'react';
import { useGallery } from '@/hooks/useGallery';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const Galeri = () => {
  const { albums, isLoading, error } = useGallery();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const currentAlbum = albums.find(album => album.id === selectedAlbum);
  const isFullscreenMode = selectedPhotoIndex !== null && currentAlbum;

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex === null || !currentAlbum) return;
    setSelectedPhotoIndex(
      selectedPhotoIndex === 0 ? currentAlbum.photos!.length - 1 : selectedPhotoIndex - 1
    );
    setIsZoomed(false);
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex === null || !currentAlbum) return;
    setSelectedPhotoIndex(
      selectedPhotoIndex === currentAlbum.photos!.length - 1 ? 0 : selectedPhotoIndex + 1
    );
    setIsZoomed(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isFullscreenMode) {
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'Escape') handleClose();
    }
  };

  const handleClose = () => {
    setSelectedPhotoIndex(null);
    setSelectedAlbum(null);
    setIsZoomed(false);
  };

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const xDiff = touchStart.x - e.changedTouches[0].clientX;
    const yDiff = touchStart.y - e.changedTouches[0].clientY;

    // Only handle horizontal swipes
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0) {
        handleNextPhoto();
      } else {
        handlePrevPhoto();
      }
    }

    setTouchStart(null);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, currentAlbum]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Galeri Kegiatan</h1>

      {isLoading ? (
        // Loading skeletons
        <div className="space-y-12">
          {Array.from({ length: 2 }).map((_, albumIndex) => (
            <div key={albumIndex} className="space-y-4">
              <div className="border-b pb-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, photoIndex) => (
                  <Card key={photoIndex} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Belum ada foto kegiatan yang ditambahkan.
        </div>
      ) : (
        <div className="space-y-12">
          {albums.map((album) => (
            <div key={album.id} className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-2xl font-semibold">{album.title}</h2>
                <p className="text-muted-foreground">{album.description}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(album.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {album.photos?.map((photo, index) => (
                  <Card
                    key={photo.id}
                    className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
                    onClick={() => {
                      setSelectedAlbum(album.id);
                      setSelectedPhotoIndex(index);
                    }}
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={photo.image_url}
                        alt={photo.caption || album.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    {photo.caption && (
                      <div className="p-2">
                        <p className="text-sm text-muted-foreground">{photo.caption}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Photo View */}
      {isFullscreenMode && currentAlbum.photos && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <div className="relative w-full h-full bg-black/95">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={handlePrevPhoto}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={handleNextPhoto}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* Zoom controls */}
              <div className="absolute bottom-2 right-2 z-50 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {isZoomed ? (
                    <ZoomOut className="h-6 w-6" />
                  ) : (
                    <ZoomIn className="h-6 w-6" />
                  )}
                </Button>
              </div>

              {/* Photo */}
              <div
                className="w-full h-full flex items-center justify-center p-4"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={currentAlbum.photos[selectedPhotoIndex].image_url}
                  alt={currentAlbum.photos[selectedPhotoIndex].caption || currentAlbum.title}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-transform duration-200",
                    isZoomed && "scale-150"
                  )}
                />
              </div>

              {/* Caption */}
              {currentAlbum.photos[selectedPhotoIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <p>{currentAlbum.photos[selectedPhotoIndex].caption}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Galeri; 