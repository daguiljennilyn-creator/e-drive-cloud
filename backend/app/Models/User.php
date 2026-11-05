<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'job_title',
        'company',
        'bio',
        'avatar_path',
        'plan_id',
        'storage_limit_bytes',
        'two_factor_enabled',
        'biometric_enabled',
        'auto_lock_enabled',
        'auto_lock_minutes',
        'login_alerts_enabled',
        'notification_preferences',
        'privacy_preferences',
        'last_active_at',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'biometric_enabled' => 'boolean',
            'auto_lock_enabled' => 'boolean',
            'login_alerts_enabled' => 'boolean',
            'auto_lock_minutes' => 'integer',
            'storage_limit_bytes' => 'integer',
            'notification_preferences' => 'array',
            'privacy_preferences' => 'array',
            'last_active_at' => 'datetime',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(Credential::class);
    }

    public function storageUsedBytes(): int
    {
        return (int) $this->documents()->withTrashed()->sum('size');
    }

    /**
     * @return array<string, bool>
     */
    public function notificationPreferences(): array
    {
        return array_merge([
            'expiry_reminders' => true,
            'security_alerts' => true,
            'sharing_activity' => true,
            'storage_alerts' => true,
            'weekly_digest' => false,
            'product_updates' => false,
        ], $this->notification_preferences ?? []);
    }

    /**
     * @return array<string, bool>
     */
    public function privacyPreferences(): array
    {
        return array_merge([
            'profile_visible' => true,
            'activity_logging' => true,
            'analytics' => false,
            'personalized_tips' => true,
        ], $this->privacy_preferences ?? []);
    }
}
