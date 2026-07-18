import apiClient, { API_BASE_URL } from './apiClient';
import axios from 'axios';
import { Platform } from 'react-native';

export const getStorageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('minio-storage:9000')) {
    // Rewrite internal Docker hostname to Nginx Gateway to allow tunnel/external device resolution
    return url.replace('http://minio-storage:9000', API_BASE_URL);
  }
  return url;
};

export const storageService = {
  uploadImage: async (localUri: string): Promise<string> => {
    // If it's already an HTTP URL (meaning it's already stored in MinIO/S3), skip upload
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      return localUri;
    }

    try {
      const filename = localUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // 1. Fetch S3 presigned upload policy
      const response = await apiClient.post(`/storage/presigned-upload?file_name=${filename}&mime_type=${type}`);
      const { upload_url, fields } = response.data;

      // 2. Rewrite internal Docker S3 URL to localhost/10.0.2.2 for emulator/host connectivity
      const resolvedUploadUrl = getStorageUrl(upload_url);

      // 3. Populate Multipart FormData
      const formData = new FormData();
      Object.entries(fields).forEach(([key, val]) => {
        formData.append(key, val as string);
      });

      if (Platform.OS === 'web') {
        const responseBlob = await fetch(localUri);
        const blob = await responseBlob.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: localUri,
          name: filename,
          type: type,
        } as any);
      }

      // 4. Perform direct S3/MinIO HTTP POST upload
      await axios.post(resolvedUploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 5. Construct persistent S3 file URL
      const fileKey = fields.key;
      return `${resolvedUploadUrl}/${fileKey}`;
    } catch (error: any) {
      console.error('S3 upload failed:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Storage upload failed');
    }
  },
};
