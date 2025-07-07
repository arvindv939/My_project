import 'dotenv/config';

export default {
  expo: {
    // ... other config
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    },
  },
};
