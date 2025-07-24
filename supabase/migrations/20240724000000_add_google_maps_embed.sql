-- Add google_maps_embed column to about_content table
ALTER TABLE about_content 
ADD COLUMN google_maps_embed TEXT;

-- Add comment for documentation
COMMENT ON COLUMN about_content.google_maps_embed IS 'Google Maps embed URL for displaying location on about page'; 