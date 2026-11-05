<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->notifications()->latest();

        if ($request->string('filter')->toString() === 'unread') {
            $query->whereNull('read_at');
        }

        $categories = [
            'documents' => ['expiry', 'certificate', 'document_uploaded'],
            'security' => ['security', 'credential', 'credential_rotated'],
            'sharing' => ['share'],
            'storage' => ['storage', 'plan_changed'],
            'system' => ['digest', 'welcome'],
        ];

        $category = $request->string('category')->toString();

        if (isset($categories[$category])) {
            $query->whereIn('data->type', $categories[$category]);
        }

        $paginator = $query->paginate(min(50, max(1, (int) $request->integer('per_page', 12))));

        return response()->json([
            'data' => NotificationResource::collection($paginator->getCollection())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
                'unread_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $record = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $record->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => NotificationResource::make($record->fresh())->resolve(),
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'unread_count' => 0,
        ]);
    }

    public function destroy(Request $request, string $notification): JsonResponse
    {
        $record = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $record->delete();

        return response()->json([
            'message' => 'Notification deleted.',
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function clearRead(Request $request): JsonResponse
    {
        $count = $request->user()->notifications()->whereNotNull('read_at')->delete();

        return response()->json([
            'message' => $count.' read notification(s) cleared.',
            'count' => $count,
        ]);
    }
}
