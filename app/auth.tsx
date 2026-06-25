import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import AuthModal from '@/app/components/AuthModal';

export default function Auth() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <AuthModal
        visible={true}
        onClose={() => router.back()}
        initialMode="signin"
        onSuccess={(role) => {
          if (role === 'owner') {
            router.replace('/landlord');
          } else {
            router.replace('/');
          }
        }}
      />
    </View>
  );
}
