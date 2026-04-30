import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #fff7e8 0%, #f6efe6 100%)',
          fontFamily: 'serif',
        }}
      >
        {/* HEADER */}
        <div style={{ fontSize: 28, letterSpacing: '0.2em', color: '#a68a64' }}>
          SONYACHNA
        </div>

        {/* MAIN TEXT */}
        <div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.2,
              color: '#1f1f1f',
            }}
          >
            ウクライナの厳選食品
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 28,
              color: '#6b6258',
            }}
          >
            商品ではなく、物語を届ける
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ fontSize: 20, color: '#8a7f72' }}>
          From Ukraine to Japan
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}