'use client';
import dynamic from 'next/dynamic';

const CesiumMapWrapper = dynamic(
  () => import('@/components/cesium/CesiumMapWrapper'),
  { ssr: false, loading: () => <div style={{ background: '#030a18', height: '100vh' }} /> }
);

export default function MapPage() {
  return <CesiumMapWrapper />;
}
