import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFromR2 } from '@/lib/r2';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.scriptText !== undefined) data.scriptText = body.scriptText;
  if (body.status === 'posted') data.postedAt = new Date();
  const asset = await prisma.mediaAsset.update({ where: { id: params.id }, data });
  return NextResponse.json(asset);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
  if (asset) {
    try { await deleteFromR2(asset.r2Key); } catch {}
    await prisma.mediaAsset.delete({ where: { id: params.id } });
  }
  return NextResponse.json({ success: true });
}
