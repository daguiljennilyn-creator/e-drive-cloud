<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $used = $this->storageUsedBytes();
        $limit = max(1, $this->storage_limit_bytes);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'job_title' => $this->job_title,
            'company' => $this->company,
            'bio' => $this->bio,
            'initials' => $this->initials(),
            'avatar_url' => $this->avatar_path
                ? asset('storage/'.$this->avatar_path)
                : null,
            'plan' => PlanResource::make($this->whenLoaded('plan')),
            'storage_limit_bytes' => $this->storage_limit_bytes,
            'storage_used_bytes' => $used,
            'storage_percentage' => round(min(100, ($used / $limit) * 100), 1),
            'two_factor_enabled' => $this->two_factor_enabled,
            'biometric_enabled' => $this->biometric_enabled,
            'auto_lock_enabled' => $this->auto_lock_enabled,
            'auto_lock_minutes' => $this->auto_lock_minutes,
            'login_alerts_enabled' => $this->login_alerts_enabled,
            'notification_preferences' => $this->notificationPreferences(),
            'privacy_preferences' => $this->privacyPreferences(),
            'last_active_at' => $this->last_active_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function initials(): string
    {
        $parts = preg_split('/\s+/', trim($this->name)) ?: [];
        $initials = '';

        foreach (array_slice($parts, 0, 2) as $part) {
            $initials .= mb_strtoupper(mb_substr($part, 0, 1));
        }

        return $initials !== '' ? $initials : 'ED';
    }
}
