import React from 'react';
import { useGallery } from '@/hooks/use-gallery';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash, Image, X, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Album, Photo } from '@/types/database.types';

const GalleryManager = () => {
  const { albums, addAlbum, updateAlbum, deleteAlbum, addPhotosToAlbum, deletePhotoFromAlbum, updatePhotoInAlbum } = useGallery();
  const [selectedAlbum, setSelectedAlbum] = React.useState<Partial<Album> | null>(null);
  const [isNewAlbum, setIsNewAlbum] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [albumToDelete, setAlbumToDelete] = React.useState<Album | null>(null);
  const [previewPhoto, setPreviewPhoto] = React.useState<(Photo & { albumTitle: string }) | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleNewAlbum = () => {
    setSelectedAlbum({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsNewAlbum(true);
  };

  const handleSaveAlbum = () => {
    if (!selectedAlbum?.title || !selectedAlbum?.description || !selectedAlbum?.date) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    const albumData = {
      title: selectedAlbum.title,
      description: selectedAlbum.description,
      date: selectedAlbum.date,
    };

    if (isNewAlbum) {
      addAlbum(albumData);
    } else if (selectedAlbum.id) {
      const originalAlbum = albums.find(a => a.id === selectedAlbum.id);
      if (originalAlbum) {
        updateAlbum({ ...originalAlbum, ...albumData });
      }
    }
    setSelectedAlbum(null);
    setIsNewAlbum(false);
  };

  const handleDeleteClick = (album: Album) => {
    setAlbumToDelete(album);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (albumToDelete) {
      deleteAlbum(albumToDelete.id);
      setIsDeleteDialogOpen(false);
      setAlbumToDelete(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, albumId: string) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const result = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      newPhotos.push({
        image_url: result as string,
        caption: '',
      });
    }

    addPhotosToAlbum(albumId, newPhotos);
    e.target.value = ''; // Reset input
  };

  const handlePhotoClick = (photo: Photo, album: Album) => {
    setPreviewPhoto({ ...photo, albumTitle: album.title });
  };

  const handleUpdatePhotoCaption = (albumId: string, photoId: string, caption: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const photo = album.photos?.find(p => p.id === photoId);
    if (!photo) return;

    updatePhotoInAlbum(albumId, { ...photo, caption });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manajemen Galeri</h2>
        <Button onClick={handleNewAlbum} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Album
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {albums.map((album) => (
          <Card key={album.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{album.title}</h3>
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAlbum(album);
                    setIsNewAlbum(false);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(album)}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-center py-8 border-dashed"
              >
                <Image className="w-6 h-6 mr-2" />
                Pilih Foto untuk Ditambahkan
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, album.id)}
              />
            </div>

            <ScrollArea className="h-[400px] rounded-md border">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {album.photos?.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || album.title}
                      className="w-full h-full object-cover rounded-md cursor-pointer"
                      onClick={() => handlePhotoClick(photo, album)}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => handlePhotoClick(photo, album)}
                        aria-label="Lihat foto"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => deletePhotoFromAlbum(album.id, photo.id)}
                        aria-label="Hapus foto"
                      >
                        <Trash className="w-5 h-5" />
                      </Button>
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm truncate">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        ))}
      </div>

      {/* Album Edit/Create Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={(open) => !open && setSelectedAlbum(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNewAlbum ? 'Tambah Album Baru' : 'Edit Album'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Album</Label>
              <Input
                id="title"
                value={selectedAlbum?.title || ''}
                onChange={(e) =>
                  setSelectedAlbum(prev => prev ? { ...prev, title: e.target.value } : null)
                }
                placeholder="Masukkan judul album"
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={selectedAlbum?.description || ''}
                onChange={(e) =>
                  setSelectedAlbum(prev => prev ? { ...prev, description: e.target.value } : null)
                }
                placeholder="Masukkan deskripsi album"
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={selectedAlbum?.date?.split('T')[0] || ''}
                onChange={(e) =>
                  setSelectedAlbum(prev => prev ? { ...prev, date: e.target.value } : null)
                }
              />
            </div>
            <Button onClick={handleSaveAlbum} className="w-full">
              {isNewAlbum ? 'Tambah Album' : 'Simpan Perubahan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Album</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus album ini? Semua foto dalam album ini juga akan dihapus.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewPhoto?.albumTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={previewPhoto?.image_url}
              alt={previewPhoto?.caption || previewPhoto?.albumTitle}
              className="w-full h-auto rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setPreviewPhoto(null)}
              aria-label="Tutup preview"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={previewPhoto?.caption || ''}
              onChange={(e) => {
                if (previewPhoto && previewPhoto.id && previewPhoto.album_id) {
                  handleUpdatePhotoCaption(previewPhoto.album_id, previewPhoto.id, e.target.value);
                  setPreviewPhoto(prev => prev ? { ...prev, caption: e.target.value } : null);
                }
              }}
              placeholder="Tambahkan caption untuk foto ini"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryManager; 