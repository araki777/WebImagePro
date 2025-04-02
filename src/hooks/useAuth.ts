import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export const useAuth = (requireAuth: boolean = true) => {
  const router = useRouter();
  const { user, isLoading, checkUser, signOut } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push('/login?error=ユーザー情報が取得できませんでした');
    }
  }, [isLoading, user, requireAuth, router]);

  return {
    user,
    isLoading,
    signOut,
  };
};