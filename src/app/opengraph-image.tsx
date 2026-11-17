import { ImageResponse } from 'next/og';
export const alt = 'Baji Market — A little spark. A lot of celebration.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', background: '#183d31', color: '#f8f6ef', padding: '70px' }}><div style={{ display: 'flex', fontSize: 30, letterSpacing: 4 }}>BAJI MARKET</div><div style={{ display: 'flex', flexDirection: 'column', fontSize: 84, letterSpacing: -4 }}><span>A little spark.</span><span style={{ color: '#edc17a' }}>A lot of celebration.</span></div><div style={{ display: 'flex', fontSize: 22 }}>Explore the collection. Find your sparkle.</div></div>, size);
}
