import { expect, it } from 'vitest';
import api from './api';

it('preserves FormData for multipart uploads', async () => {
  const body = new FormData();
  body.append('file', 'photo.jpg');
  let requestBody: unknown;
  let contentType: unknown;

  await api.post('/files/upload', body, {
    adapter: async (config) => {
      requestBody = config.data;
      contentType = config.headers.getContentType();
      return {
        data: {},
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    },
  });

  expect(requestBody).toBe(body);
  expect(String(contentType)).not.toContain('application/json');
});
