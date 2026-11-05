<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteAccountRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\UserResource;
use App\Services\ActivityLogger;
use App\Services\UserSessions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('plan');
        $documents = $user->documents()->get();

        return response()->json([
            'user' => UserResource::make($user),
            'stats' => [
                'documents' => $documents->count(),
                'shared' => $documents->filter(fn ($document) => $document->isShared())->count(),
                'favorites' => $documents->where('is_favorite', true)->count(),
                'storage_used_bytes' => $user->storageUsedBytes(),
                'activities' => $user->activities()->count(),
                'member_since' => $user->created_at?->format('F Y'),
            ],
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->safe()->except(['avatar', 'remove_avatar']);

        if ($request->boolean('remove_avatar') && $user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $data['avatar_path'] = null;
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $data['avatar_path'] = $request->file('avatar')->store('avatars/'.$user->id, 'public');
        }

        $user->update($data);

        ActivityLogger::record($user, 'profile_updated', 'Updated profile details', null, [], $request);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => UserResource::make($user->fresh()->load('plan')),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['password' => $request->validated('password')]);

        app(UserSessions::class)->forgetAllFor($user, $request->session()->getId());

        ActivityLogger::record($user, 'password_changed', 'Changed account password', null, [], $request);

        return response()->json(['message' => 'Password updated. Other sessions have been signed out.']);
    }

    public function export(Request $request)
    {
        $user = $request->user()->load('plan');
        $documents = $user->documents()->withTrashed()->get();
        $activities = $user->activities()->with('document')->latest()->limit(200)->get();

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'user' => UserResource::make($user)->resolve(),
            'documents' => DocumentResource::collection($documents)->resolve(),
            'activities' => ActivityResource::collection($activities)->resolve(),
        ];

        ActivityLogger::record($user, 'data_exported', 'Exported account data', null, [], $request);

        return response()->streamDownload(
            fn () => print json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            'e-drive-export-'.now()->format('Y-m-d').'.json',
            ['Content-Type' => 'application/json'],
        );
    }

    public function destroy(DeleteAccountRequest $request): JsonResponse
    {
        $user = $request->user();
        $documents = $user->documents()->withTrashed()->get();

        foreach ($documents as $document) {
            Storage::disk('local')->delete($document->file_path);
        }

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->notifications()->delete();

        // Log out before deleting: logging out rotates the remember token and
        // saves the model, which would re-insert an already-deleted row.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        app(UserSessions::class)->forgetAllFor($user);
        $user->delete();

        return response()->json(['message' => 'Your account and all encrypted files have been deleted.']);
    }
}
