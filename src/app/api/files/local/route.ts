import { NextResponse } from "next/server";
import { requireSession } from "@/modules/core/auth/session";
import { isLocalProductionStack } from "@/lib/providers";
import { storageRead } from "@/modules/core/files/storage/local-provider";
import { getErrorMessage } from "@/lib/errors";

export async function GET(request: Request) {
  if (!isLocalProductionStack()) {
    return NextResponse.json({ error: "Storage local indisponível." }, { status: 404 });
  }

  try {
    const session = await requireSession();
    const ref = new URL(request.url).searchParams.get("ref");
    if (!ref) return NextResponse.json({ error: "Referência ausente." }, { status: 400 });

    const decoded = decodeURIComponent(ref);
    const [tenantId, bucket, ...rest] = decoded.split("/");
    const relativePath = rest.join("/");

    if (!tenantId || !bucket || !relativePath) {
      return NextResponse.json({ error: "Referência inválida." }, { status: 400 });
    }

    if (tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const file = await storageRead(tenantId, bucket, relativePath);
    if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.meta.mimeType,
        "Content-Length": String(file.meta.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}
