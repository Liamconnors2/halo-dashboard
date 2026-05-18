import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { passcode } = await req.json()

  if (passcode !== process.env.APP_PASSCODE) {
    return NextResponse.json({ error: 'Wrong passcode' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('halo-auth', 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
