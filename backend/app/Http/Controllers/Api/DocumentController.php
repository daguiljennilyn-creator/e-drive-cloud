<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkDocumentRequest;
use App\Http\Requests\ShareDocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $query = $request->string('trashed')->toString() === 'only'
            ? $user->documents()->onlyTrashed()
            : $user->documents();

        if ($search = trim($request->string('q')->toString())) {
            $query->where(function ($builder) use ($search): void {
                $like = '%'.$search.'%';
                $builder->where('name', 'like', $like)
                    ->orWhere('original_name', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('issuer', 'like', $like)
                    ->orWhere('document_number', 'like', $like);
            });
        }

        if ($category = $request->string('category')->toString()) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        if ($subcategory = $request->string('subcategory')->toString()) {
            $query->where('subcategory', $subcategory);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($request->boolean('favorites')) {
            $query->where('is_favorite', true);
        }

        if ($request->boolean('expiring')) {
            $query->whereNotNull('expires_at')
                ->whereDate('expires_at', '<=', now()->addDays(30)->toDateString());
        }

        if ($request->boolean('shared')) {
            $query->whereNotNull('share_token')
                ->where(function ($builder): void {
                    $builder->whereNull('share_expires_at')
                        ->orWhere('share_expires_at', '>', now());
                });
        }

        if ($tag = $request->string('tag')->toString()) {
            $query->whereJsonContains('tags', $tag);
        }

        $sort = $request->string('sort')->toString();
        $direction = $request->string('direction')->toString() === 'asc' ? 'asc' : 'desc';
        $sortable = ['name', 'size', 'category', 'created_at', 'last_modified_at', 'expires_at'];
        $sort = in_array($sort, $sortable, true) ? $sort : 'last_modified_at';

        $query->orderBy($sort, $direction);
        if ($sort !== 'last_modified_at') {
            $query->orderByDesc('last_modified_at');
        }

        $perPage = min(50, max(1, (int) $request->integer('per_page', 8)));
        $paginator = $query->paginate($perPage)->withQueryString();

        $allDocuments = $user->documents()->get(['category', 'subcategory', 'status', 'size', 'expires_at', 'share_token', 'share_expires_at', 'is_favorite']);

        $categoryCounts = collect(Document::CATEGORIES)
            ->mapWithKeys(fn (string $category) => [
                $category => $allDocuments->where('category', $category)->count(),
            ]);

        $subcategoryCounts = collect(['identity', 'medical', 'finance', 'home_legal'])
            ->mapWithKeys(fn (string $subcategory) => [
                $subcategory => $allDocuments->where('subcategory', $subcategory)->count(),
            ]);

        $stats = [
            'total' => $allDocuments->count(),
            'category_counts' => $categoryCounts,
            'subcategory_counts' => $subcategoryCounts,
            'status_counts' => $allDocuments->groupBy('status')->map->count(),
            'total_size' => (int) $allDocuments->sum('size'),
            'shared_count' => $allDocuments->filter(fn (Document $document) => $document->isShared())->count(),
            'favorite_count' => $allDocuments->where('is_favorite', true)->count(),
            'expiring_count' => $allDocuments
                ->filter(fn (Document $document) => $document->expires_at !== null
                    && $document->expires_at->lte(now()->addDays(30)))
                ->count(),
        ];

        return DocumentResource::collection($paginator)->additional(['stats' => $stats]);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $user = $request->user();
        $file = $request->file('file');

        $this->ensureStorageAvailable($user->storageUsedBytes(), $file->getSize(), $user->storage_limit_bytes);

        $path = $file->store('documents/'.$user->id, 'local');

        $document = $user->documents()->create([
            'name' => $request->validated('name'),
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType() ?: $file->getClientMimeType(),
            'extension' => strtolower($file->getClientOriginalExtension()),
            'size' => $file->getSize(),
            'category' => $request->validated('category'),
            'subcategory' => $request->validated('subcategory'),
            'description' => $request->validated('description'),
            'tags' => $this->normalizeTags($request->input('tags', [])),
            'status' => $request->validated('status', 'active'),
            'issued_at' => $request->validated('issued_at'),
            'verified_at' => $request->validated('status') === 'verified' ? now() : null,
            'expires_at' => $request->validated('expires_at'),
            'last_modified_at' => now(),
            'checksum' => hash_file('sha256', Storage::disk('local')->path($path)),
            'issuer' => $request->validated('issuer'),
            'document_number' => $request->validated('document_number'),
        ]);

        ActivityLogger::record($user, 'uploaded', 'Uploaded '.$document->name, $document, [], $request);
        Notifier::send(
            $user,
            'document_uploaded',
            'Document uploaded',
            $document->name.' is encrypted and stored in your vault.',
            '/documents/'.$document->id,
        );

        return response()->json([
            'message' => 'Document encrypted and stored successfully.',
            'document' => DocumentResource::make($document),
        ], 201);
    }

    public function show(Request $request, Document $document): DocumentResource
    {
        $this->authorize('view', $document);

        return DocumentResource::make($document);
    }

    public function update(UpdateDocumentRequest $request, Document $document): JsonResponse
    {
        $this->authorize('update', $document);
        $user = $request->user();
        $data = $request->safe()->except(['file', 'tags']);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $usedWithoutDocument = $user->storageUsedBytes() - $document->size;

            $this->ensureStorageAvailable(
                $usedWithoutDocument,
                $file->getSize(),
                $user->storage_limit_bytes,
            );

            $oldPath = $document->file_path;
            $path = $file->store('documents/'.$user->id, 'local');

            $data = array_merge($data, [
                'original_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType() ?: $file->getClientMimeType(),
                'extension' => strtolower($file->getClientOriginalExtension()),
                'size' => $file->getSize(),
                'checksum' => hash_file('sha256', Storage::disk('local')->path($path)),
            ]);

            if ($oldPath) {
                Storage::disk('local')->delete($oldPath);
            }
        }

        if ($request->has('tags')) {
            $data['tags'] = $this->normalizeTags($request->input('tags', []));
        }

        if ($request->has('status')) {
            $data['verified_at'] = $request->validated('status') === 'verified' ? now() : null;
        }

        $data['last_modified_at'] = now();
        $document->update($data);

        ActivityLogger::record($user, 'updated', 'Updated '.$document->name, $document, [], $request);

        return response()->json([
            'message' => 'Document updated successfully.',
            'document' => DocumentResource::make($document->fresh()),
        ]);
    }

    public function toggleFavorite(Request $request, Document $document): JsonResponse
    {
        $this->authorize('update', $document);
        $document->update(['is_favorite' => ! $document->is_favorite]);

        return response()->json([
            'message' => $document->is_favorite ? 'Added to favorites.' : 'Removed from favorites.',
            'document' => DocumentResource::make($document->fresh()),
        ]);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        $this->authorize('delete', $document);

        $document->update([
            'share_token' => null,
            'share_expires_at' => null,
            'shared_at' => null,
            'status' => 'active',
        ]);
        $document->delete();

        ActivityLogger::record($request->user(), 'trashed', 'Moved '.$document->name.' to trash', $document, [], $request);

        return response()->json(['message' => 'Document moved to trash.']);
    }

    public function restore(Request $request, Document $document): JsonResponse
    {
        $this->authorize('restore', $document);

        $document->restore();
        $document->update(['last_modified_at' => now()]);

        ActivityLogger::record($request->user(), 'restored', 'Restored '.$document->name, $document, [], $request);

        return response()->json([
            'message' => 'Document restored successfully.',
            'document' => DocumentResource::make($document->fresh()),
        ]);
    }

    public function forceDelete(Request $request, Document $document): JsonResponse
    {
        $this->authorize('forceDelete', $document);

        ActivityLogger::record($request->user(), 'deleted', 'Permanently deleted '.$document->name, null, [], $request);

        Storage::disk('local')->delete($document->file_path);
        $document->forceDelete();

        return response()->json(['message' => 'Document permanently deleted.']);
    }

    public function emptyTrash(Request $request): JsonResponse
    {
        $documents = $request->user()->documents()->onlyTrashed()->get();

        foreach ($documents as $document) {
            Storage::disk('local')->delete($document->file_path);
            $document->forceDelete();
        }

        ActivityLogger::record(
            $request->user(),
            'trash_emptied',
            'Emptied trash ('.$documents->count().' documents)',
            null,
            ['count' => $documents->count()],
            $request,
        );

        return response()->json([
            'message' => $documents->count().' document(s) permanently deleted.',
            'count' => $documents->count(),
        ]);
    }

    public function bulk(BulkDocumentRequest $request): JsonResponse
    {
        $user = $request->user();
        $action = $request->validated('action');
        $documents = $user->documents()
            ->withTrashed()
            ->whereIn('id', $request->validated('ids'))
            ->get();

        $count = 0;

        foreach ($documents as $document) {
            match ($action) {
                'trash' => $document->trashed() ? null : ($document->update([
                    'share_token' => null,
                    'share_expires_at' => null,
                    'shared_at' => null,
                ]) && $document->delete() && $count++),
                'restore' => $document->trashed() ? ($document->restore() && $count++) : null,
                'delete' => Storage::disk('local')->delete($document->file_path) && $document->forceDelete() && $count++,
                default => null,
            };
        }

        ActivityLogger::record(
            $user,
            'bulk_'.$action,
            ucfirst($action).' action applied to '.$count.' document(s)',
            null,
            ['count' => $count, 'action' => $action],
            $request,
        );

        return response()->json([
            'message' => $count.' document(s) updated.',
            'count' => $count,
        ]);
    }

    public function file(Request $request, Document $document): StreamedResponse|BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $document);

        return $this->inlineResponse($document);
    }

    public function download(Request $request, Document $document): StreamedResponse|BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $document);

        return $this->downloadResponse($document);
    }

    public function share(ShareDocumentRequest $request, Document $document): JsonResponse
    {
        $this->authorize('share', $document);

        $days = (int) $request->integer('expires_in_days', config('edrive.share_expiry_days'));

        $document->update([
            'share_token' => Str::random(48),
            'share_expires_at' => now()->addDays($days),
            'shared_at' => now(),
            'status' => $document->status === 'expired' ? 'expired' : 'shared',
        ]);

        ActivityLogger::record(
            $request->user(),
            'shared',
            'Created a secure share link for '.$document->name,
            $document,
            ['expires_in_days' => $days],
            $request,
        );

        return response()->json([
            'message' => 'Secure share link created.',
            'document' => DocumentResource::make($document->fresh()),
        ]);
    }

    public function unshare(Request $request, Document $document): JsonResponse
    {
        $this->authorize('share', $document);

        $document->update([
            'share_token' => null,
            'share_expires_at' => null,
            'shared_at' => null,
            'status' => $document->status === 'shared' ? 'active' : $document->status,
        ]);

        ActivityLogger::record($request->user(), 'share_revoked', 'Revoked share link for '.$document->name, $document, [], $request);

        return response()->json([
            'message' => 'Share link revoked.',
            'document' => DocumentResource::make($document->fresh()),
        ]);
    }

    public function verify(Request $request, Document $document): JsonResponse
    {
        $this->authorize('update', $document);

        $document->update([
            'status' => 'verified',
            'verified_at' => now(),
            'last_modified_at' => now(),
        ]);

        ActivityLogger::record($request->user(), 'verified', 'Verified '.$document->name, $document, [], $request);

        return response()->json([
            'message' => $document->name.' is verified.',
            'document' => DocumentResource::make($document->fresh()),
        ]);
    }

    public function verifyAll(Request $request): JsonResponse
    {
        $documents = $request->user()->documents()
            ->where('category', 'certificate')
            ->where('status', '!=', 'verified')
            ->get();

        foreach ($documents as $document) {
            $document->update([
                'status' => 'verified',
                'verified_at' => now(),
            ]);
        }

        ActivityLogger::record(
            $request->user(),
            'certificates_verified',
            'Verified '.$documents->count().' certificate(s)',
            null,
            ['count' => $documents->count()],
            $request,
        );

        return response()->json([
            'message' => $documents->count().' certificate(s) verified.',
            'count' => $documents->count(),
        ]);
    }

    private function inlineResponse(Document $document): StreamedResponse|BinaryFileResponse|JsonResponse
    {
        $disk = Storage::disk('local');

        if (! $disk->exists($document->file_path)) {
            return response()->json(['message' => 'The stored file could not be found.'], 404);
        }

        $document->increment('view_count');
        $document->forceFill(['last_accessed_at' => now()])->save();

        return response()->file($disk->path($document->file_path), [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => 'inline; filename="'.addslashes($document->original_name).'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function downloadResponse(Document $document): StreamedResponse|BinaryFileResponse|JsonResponse
    {
        $disk = Storage::disk('local');

        if (! $disk->exists($document->file_path)) {
            return response()->json(['message' => 'The stored file could not be found.'], 404);
        }

        $document->increment('view_count');
        $document->forceFill(['last_accessed_at' => now()])->save();

        return response()->download($disk->path($document->file_path), $document->original_name, [
            'Content-Type' => $document->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function ensureStorageAvailable(int $usedBytes, int $newFileBytes, int $limitBytes): void
    {
        if ($usedBytes + $newFileBytes > $limitBytes) {
            throw ValidationException::withMessages([
                'file' => ['This upload exceeds your available storage. Upgrade your plan or free up space.'],
            ]);
        }
    }

    /**
     * @param  array<int, string>  $tags
     * @return array<int, string>
     */
    private function normalizeTags(array $tags): array
    {
        return collect($tags)
            ->map(fn (string $tag) => ltrim(trim($tag), '#'))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
