import { NextResponse } from "next/server";
import { CloudflareStorageService } from "@/lib/storage/CloudflareStorageService";
import { validateSession } from "@/lib/lucia";
import { logger } from "@/utils/logger";

export async function DELETE(request: Request) {
  try {
    const { user } = await validateSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    let storageService = new CloudflareStorageService();

    // Extraire le chemin du fichier de l'URL
    // Format: https://domain.com/entityType/entityId/filename
    const urlParts = imageUrl.split("/");
    const fileName = urlParts.slice(-3).join("/"); // Récupère les 3 dernières parties (entityType/entityId/filename)

    try {
      await storageService.deleteFile(fileName);
      logger({
        message: "Image deleted successfully",
        context: { fileName },
      }).info();
    } catch (error) {
      logger({
        message: "Error deleting image from storage",
        context: { error, fileName },
      }).error();
      // On continue même si la suppression du fichier échoue
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger({
      message: "Delete image error",
      context: error,
    }).error();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}