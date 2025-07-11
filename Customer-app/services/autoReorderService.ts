import API from '../utils/api';

export interface AutoReorderPayload {
  orderTemplate: any;
  frequency: '12h' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customInterval?: number;
  intervalHours?: number; // <--- add this!
  time: string;
}

export const createAutoReorder = async (payload: AutoReorderPayload) => {
  return API.post('/auto-reorders', payload);
};

export const getAutoReorders = async () => {
  return API.get('/auto-reorders');
};
