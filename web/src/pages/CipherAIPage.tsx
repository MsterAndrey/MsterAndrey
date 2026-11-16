import { useEffect } from 'react';
import { CipherChat } from '../components/CipherChat/CipherChat';

export default function CipherAIPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'CIPHER AI — Demostración · NEXUS CUBE';
    return () => {
      document.title = prev;
    };
  }, []);
  return <CipherChat />;
}
