export const IMAGE_FILE_TYPES = ["webp", "jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "svg"];

export function isImageFile(fileType: string): boolean {
  return IMAGE_FILE_TYPES.includes(fileType.toLowerCase());
}
