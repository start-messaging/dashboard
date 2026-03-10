import { apiGet, apiPatch } from './api-client';
import type { UpdateUserPayload, User } from '@/types';

export function getMe(): Promise<User> {
  return apiGet<User>('/users/me');
}

export function updateMe(data: UpdateUserPayload): Promise<User> {
  return apiPatch<User>('/users/me', data);
}
