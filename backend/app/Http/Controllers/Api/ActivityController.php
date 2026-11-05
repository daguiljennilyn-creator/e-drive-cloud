<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->activities()->with('document')->latest();

        if ($action = $request->string('action')->toString()) {
            $query->where('action', $action);
        }

        $groups = [
            'documents' => [
                'uploaded', 'updated', 'trashed', 'restored', 'deleted', 'bulk_trash',
                'bulk_restore', 'bulk_delete', 'trash_emptied', 'verified', 'certificates_verified',
            ],
            'sharing' => ['shared', 'share_revoked'],
            'security' => [
                'login', 'logout', 'password_changed', 'security_updated', 'device_revoked',
                'devices_revoked', 'account_created',
            ],
            'credentials' => [
                'credential_created', 'credential_updated', 'credential_deleted',
                'credential_revealed', 'credential_rotated', 'credentials_imported',
            ],
            'account' => [
                'profile_updated', 'data_exported', 'notifications_updated', 'privacy_updated',
                'plan_changed',
            ],
        ];

        $group = $request->string('group')->toString();

        if (isset($groups[$group])) {
            $query->whereIn('action', $groups[$group]);
        }

        if ($search = trim($request->string('q')->toString())) {
            $query->where('description', 'like', '%'.$search.'%');
        }

        $paginator = $query->paginate(min(50, max(1, (int) $request->integer('per_page', 15))));

        return response()->json([
            'data' => ActivityResource::collection($paginator->getCollection())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
