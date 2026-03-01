import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'LankaPros - Sri Lanka\'s Professional Network'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: '#D4A843',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 'bold', color: '#0a0a0a' }}>LP</span>
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold', color: '#ededed' }}>
          <span>Lanka</span>
          <span style={{ color: '#D4A843' }}>Pros</span>
        </div>
        <p style={{ fontSize: 24, color: '#888888', marginTop: 16 }}>
          Sri Lanka&apos;s Professional Network
        </p>
        <p style={{ fontSize: 16, color: '#555555', marginTop: 32 }}>
          Connect. Collaborate. Grow.
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}
