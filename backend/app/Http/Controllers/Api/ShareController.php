<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ShareController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $document = Document::withoutTrashed()
            ->where('share_token', $token)
            ->with('user:id,name')
            ->first();

        if (! $document) {
            return response()->json(['message' => 'This share link is invalid or has been revoked.'], 404);
        }

        if ($document->share_expires_at !== null && $document->share_expires_at->isPast()) {
            return response()->json(['message' => 'This share link has expired.'], 410);
        }

        $document->increment('view_count');
        $document->forceFill(['last_accessed_at' => now()])->save();

        return response()->json([
            'document' => [
                'id' => $document->id,
                'name' => $document->name,
                'original_name' => $document->original_name,
                'extension' => $document->extension,
                'mime_type' => $document->mime_type,
                'size' => $document->size,
                'human_size' => $this->humanSize($document->size),
                'category' => $document->category,
                'description' => $document->description,
                'issuer' => $document->issuer,
                'expires_at' => $document->expires_at?->format('Y-m-d'),
                'shared_at' => $document->shared_at?->toIso8601String(),
                'share_expires_at' => $document->share_expires_at?->toIso8601String(),
                'owner' => $document->user?->name,
                'download_url' => route('share.download', ['token' => $token]),
                'file_url' => route('share.file', ['token' => $token]),
            ],
        ]);
    }

    public function file(string $token)
    {
        $document = $this->resolveDocument($token);

        if ($document instanceof JsonResponse) {
            return $document;
        }

        $disk = Storage::disk('local');

        if (! $disk->exists($document->file_path)) {
            return response()->json(['message' => 'The shared file is no longer available.'], 404);
        }

        $document->increment('view_count');

        return response()->file($disk->path($document->file_path), [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => 'inline; filename="'.addslashes($document->original_name).'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function download(string $token): BinaryFileResponse|JsonResponse
    {
        $document = $this->resolveDocument($token);

        if ($document instanceof JsonResponse) {
            return $document;
        }

        $disk = Storage::disk('local');

        if (! $disk->exists($document->file_path)) {
            return response()->json(['message' => 'The shared file is no longer available.'], 404);
        }

        $document->increment('view_count');

        return response()->download($disk->path($document->file_path), $document->original_name, [
            'Content-Type' => $document->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function resolveDocument(string $token): Document|JsonResponse
    {
        $document = Document::withoutTrashed()->where('share_token', $token)->first();

        if (! $document) {
            return response()->json(['message' => 'This share link is invalid or has been revoked.'], 404);
        }

        if ($document->share_expires_at !== null && $document->share_expires_at->isPast()) {
            return response()->json(['message' => 'This share link has expired.'], 410);
        }

        return $document;
    }

    private function humanSize(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 0).' KB';
        }

        return $bytes.' B';
    }
}
