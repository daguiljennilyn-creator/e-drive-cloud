<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $documents = $user->documents()->get();
        $credentials = $user->credentials()->get();
        $recentDocuments = $user->documents()
            ->orderByDesc('last_modified_at')
            ->limit(5)
            ->get();

        $recentActivity = $user->activities()
            ->with('document')
            ->latest()
            ->limit(6)
            ->get();

        $expiringDocuments = $user->documents()
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '<=', now()->addDays(30)->toDateString())
            ->orderBy('expires_at')
            ->limit(5)
            ->get();

        $labels = [
            'government_id' => 'Government IDs',
            'certificate' => 'Certificates',
            'personal' => 'Personal Files',
            'school' => 'School Documents',
            'employment' => 'Employment',
            'financial' => 'Financial',
            'health' => 'Health',
            'credential' => 'Credentials',
            'other' => 'Other',
        ];

        $breakdown = $documents
            ->groupBy('category')
            ->map(fn ($group, string $category) => [
                'category' => $category,
                'label' => $labels[$category] ?? ucfirst($category),
                'count' => $group->count(),
                'bytes' => (int) $group->sum('size'),
            ])
            ->sortByDesc('bytes')
            ->values();

        $used = $user->storageUsedBytes();
        $limit = max(1, $user->storage_limit_bytes);

        $score = 60;
        $score += $user->two_factor_enabled ? 15 : 0;
        $score += $user->biometric_enabled ? 10 : 0;
        $score += $user->login_alerts_enabled ? 10 : 0;
        $score += $user->auto_lock_enabled ? 5 : 0;

        return response()->json([
            'stats' => [
                'total_documents' => $documents->count(),
                'certificates' => $documents->where('category', 'certificate')->count(),
                'personal_files' => $documents->where('category', 'personal')->count(),
                'credentials' => $credentials->count(),
                'credentials_strong' => $credentials->where('health', 'strong')->count(),
                'credentials_need_rotation' => $credentials->whereIn('health', ['needs_rotation', 'weak'])->count(),
                'favorites' => $documents->where('is_favorite', true)->count(),
                'expiring' => $documents->filter(fn (Document $document) => $document->expires_at !== null
                    && $document->expires_at->lte(now()->addDays(30)))->count(),
                'shared' => $documents->filter(fn (Document $document) => $document->isShared())->count(),
            ],
            'storage' => [
                'used_bytes' => $used,
                'limit_bytes' => $limit,
                'percentage' => round(min(100, ($used / $limit) * 100), 1),
                'breakdown' => $breakdown,
            ],
            'recent_documents' => DocumentResource::collection($recentDocuments)->resolve(),
            'recent_activity' => ActivityResource::collection($recentActivity)->resolve(),
            'expiring_documents' => DocumentResource::collection($expiringDocuments)->resolve(),
            'security' => [
                'score' => min(100, $score),
                'label' => $score >= 90 ? 'Excellent' : ($score >= 75 ? 'Strong' : 'Needs attention'),
                'two_factor_enabled' => $user->two_factor_enabled,
                'biometric_enabled' => $user->biometric_enabled,
                'login_alerts_enabled' => $user->login_alerts_enabled,
                'auto_lock_enabled' => $user->auto_lock_enabled,
                'recommendations' => $this->recommendations($user),
            ],
            'unread_notifications' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function recommendations(User $user): array
    {
        $items = [];

        if (! $user->two_factor_enabled) {
            $items[] = 'Enable two-factor authentication for an extra layer of protection.';
        }

        if (! $user->biometric_enabled) {
            $items[] = 'Turn on biometric and passcode lock for your vault.';
        }

        if (! $user->login_alerts_enabled) {
            $items[] = 'Enable login alerts to be notified about new sign-ins.';
        }

        return $items;
    }
}
