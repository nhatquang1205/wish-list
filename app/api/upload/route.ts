import { NextResponse, type NextRequest } from "next/server";
import { currentRole } from "@/lib/session";
import {
  MAX_UPLOAD_BYTES,
  isAllowedImage,
  publicImageUrl,
  storageReady,
  uploadImage,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
// The S3 client needs TCP, so this must not be moved to the edge runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if ((await currentRole()) !== "nina") {
    return NextResponse.json({ error: "Only Nina can add photos." }, { status: 403 });
  }

  if (!storageReady()) {
    return NextResponse.json(
      { error: "Photo storage isn't set up yet." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo in that upload." }, { status: 400 });
  }

  if (!isAllowedImage(file.type)) {
    return NextResponse.json({ error: "That isn't an image file." }, { status: 415 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That photo is over ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` },
      { status: 413 },
    );
  }

  try {
    // `path` is what the wish stores; `url` is only for the form's preview.
    const path = await uploadImage(new Uint8Array(await file.arrayBuffer()), file.type);
    return NextResponse.json({ path, url: publicImageUrl(path) }, { status: 201 });
  } catch (error) {
    console.error("upload failed", error);
    return NextResponse.json({ error: "The photo didn't make it. Try again?" }, { status: 502 });
  }
}
