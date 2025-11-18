// /app/api/link-preview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch'; // mặc dù node 18+ có fetch sẵn

// Hàm lấy meta tag cơ bản từ HTML
async function fetchMetadata(url: string) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    // Lấy title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';

    // Lấy meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)
      || html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const description = descMatch ? descMatch[1] : '';

    // Lấy ảnh đại diện (og:image)
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const image = imageMatch ? imageMatch[1] : '';

    return { title, description, image, url };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Optional: validate url, chống SSRF
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
  }

  const data = await fetchMetadata(url);
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }

  return NextResponse.json(data);
}
