import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadToR2, generateR2Key } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const taskId = formData.get('taskId') as string | null;
  const pillarId = formData.get('pillarId') as string | null;
  const scriptText = formData.get('scriptText') as string | null;
  const notes = formData.get('notes') as string | null;

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const key = generateR2Key(file.name);
  const publicUrl = await uploadToR2(key, buffer, file.type);

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      r2Key: key,
      publicUrl,
      taskId: taskId || undefined,
      pillarId: pillarId ? parseInt(pillarId) : undefined,
      scriptText: scriptText || undefined,
      notes: notes || undefined,
      status: 'draft'
    },
    include: { pillar: true }
  });

  return NextResponse.json(asset);
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const pillarId = req.nextUrl.searchParams.get('pillarId');
  const where: any = {};
  if (status) where.status = status;
  if (pillarId) where.pillarId = parseInt(pillarId);

  const assets = await prisma.mediaAsset.findMany({
    where,
    include: { pillar: true, task: true, performance: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(assets);
}
