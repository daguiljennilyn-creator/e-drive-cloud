<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCredentialRequest;
use App\Http\Requests\UpdateCredentialRequest;
use App\Http\Resources\CredentialResource;
use App\Models\Credential;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CredentialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->credentials();

        if ($search = trim($request->string('q')->toString())) {
            $like = '%'.$search.'%';
            $query->where(function ($builder) use ($like): void {
                $builder->where('name', 'like', $like)
                    ->orWhere('identifier', 'like', $like)
                    ->orWhere('url', 'like', $like)
                    ->orWhere('notes', 'like', $like);
            });
        }

        if ($type = $request->string('type')->toString()) {
            if ($type !== 'all') {
                $query->where('type', $type);
            }
        }

        if ($health = $request->string('health')->toString()) {
            $query->where('health', $health);
        }

        if ($request->boolean('favorites')) {
            $query->where('is_favorite', true);
        }

        $sort = $request->string('sort')->toString();
        $sort = in_array($sort, ['name', 'type', 'last_rotated_at', 'created_at'], true)
            ? $sort
            : 'name';
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction);

        $perPage = min(50, max(1, (int) $request->integer('per_page', 8)));
        $paginator = $query->paginate($perPage)->withQueryString();

        $all = $user->credentials()->get();
        $stats = [
            'total' => $all->count(),
            'passkeys' => $all->where('type', 'passkey')->count(),
            'strong' => $all->where('health', 'strong')->count(),
            'needs_rotation' => $all->filter(fn (Credential $credential) => $credential->health !== 'strong'
                || ($credential->last_rotated_at !== null && $credential->last_rotated_at->lt(now()->subDays(45))))->count(),
            'two_factor_enabled' => $all->where('two_factor_enabled', true)->count(),
            'reused' => 0,
            'types' => $all->groupBy('type')->map->count(),
        ];

        return response()->json([
            'data' => CredentialResource::collection($paginator->getCollection())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
            'stats' => $stats,
        ]);
    }

    public function store(StoreCredentialRequest $request): JsonResponse
    {
        $user = $request->user();
        $credential = $user->credentials()->create(array_merge(
            $request->validated(),
            ['last_rotated_at' => $request->validated('last_rotated_at') ?? now()],
        ));

        ActivityLogger::record($user, 'credential_created', 'Added credential '.$credential->name, null, [], $request);

        return response()->json([
            'message' => 'Credential added to your encrypted vault.',
            'credential' => CredentialResource::make($credential),
        ], 201);
    }

    public function show(Request $request, Credential $credential): CredentialResource
    {
        $this->authorize('view', $credential);

        return CredentialResource::make($credential);
    }

    public function update(UpdateCredentialRequest $request, Credential $credential): JsonResponse
    {
        $this->authorize('update', $credential);
        $credential->update($request->validated());

        ActivityLogger::record($request->user(), 'credential_updated', 'Updated credential '.$credential->name, null, [], $request);

        return response()->json([
            'message' => 'Credential updated.',
            'credential' => CredentialResource::make($credential->fresh()),
        ]);
    }

    public function destroy(Request $request, Credential $credential): JsonResponse
    {
        $this->authorize('delete', $credential);
        $name = $credential->name;
        $credential->delete();

        ActivityLogger::record($request->user(), 'credential_deleted', 'Deleted credential '.$name, null, [], $request);

        return response()->json(['message' => 'Credential deleted.']);
    }

    public function reveal(Request $request, Credential $credential): JsonResponse
    {
        $this->authorize('view', $credential);

        ActivityLogger::record($request->user(), 'credential_revealed', 'Revealed secret for '.$credential->name, null, [], $request);

        return response()->json([
            'secret' => $credential->secret,
            'identifier' => $credential->identifier,
        ]);
    }

    public function rotate(Request $request, Credential $credential): JsonResponse
    {
        $this->authorize('update', $credential);

        $data = $request->validate([
            'secret' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $credential->update(array_merge($data, [
            'last_rotated_at' => now(),
            'health' => 'strong',
        ]));

        ActivityLogger::record($request->user(), 'credential_rotated', 'Rotated secret for '.$credential->name, null, [], $request);
        Notifier::send(
            $request->user(),
            'credential_rotated',
            'Credential rotated',
            $credential->name.' now has a fresh secret and is marked strong.',
            '/credentials',
        );

        return response()->json([
            'message' => $credential->name.' rotated successfully.',
            'credential' => CredentialResource::make($credential->fresh()),
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'credentials' => ['required', 'array', 'min:1', 'max:100'],
            'credentials.*.name' => ['required', 'string', 'min:2', 'max:120'],
            'credentials.*.type' => ['required', Rule::in(Credential::TYPES)],
            'credentials.*.identifier' => ['nullable', 'string', 'max:180'],
            'credentials.*.secret' => ['nullable', 'string', 'max:2000'],
            'credentials.*.url' => ['nullable', 'url', 'max:255'],
            'credentials.*.notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $created = 0;

        foreach ($data['credentials'] as $item) {
            $request->user()->credentials()->create(array_merge($item, [
                'health' => 'strong',
                'last_rotated_at' => now(),
            ]));
            $created++;
        }

        ActivityLogger::record($request->user(), 'credentials_imported', 'Imported '.$created.' credential(s)', null, ['count' => $created], $request);

        return response()->json([
            'message' => $created.' credential(s) imported.',
            'count' => $created,
        ], 201);
    }
}
