<?php

namespace App\Models;

use Database\Factories\DocumentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use HasFactory, SoftDeletes;

    public const CATEGORIES = [
        'government_id',
        'certificate',
        'personal',
        'school',
        'employment',
        'financial',
        'health',
        'credential',
        'other',
    ];

    public const STATUSES = [
        'active',
        'verified',
        'shared',
        'expired',
        'draft',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'original_name',
        'file_path',
        'mime_type',
        'extension',
        'size',
        'category',
        'subcategory',
        'description',
        'tags',
        'status',
        'issued_at',
        'verified_at',
        'expires_at',
        'last_modified_at',
        'checksum',
        'issuer',
        'document_number',
        'is_favorite',
        'share_token',
        'share_expires_at',
        'shared_at',
        'view_count',
        'last_accessed_at',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'share_token',
        'file_path',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'tags' => 'array',
            'issued_at' => 'date:Y-m-d',
            'verified_at' => 'datetime',
            'expires_at' => 'date:Y-m-d',
            'last_modified_at' => 'datetime',
            'share_expires_at' => 'datetime',
            'shared_at' => 'datetime',
            'last_accessed_at' => 'datetime',
            'is_favorite' => 'boolean',
            'view_count' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isShared(): bool
    {
        return $this->share_token !== null
            && ($this->share_expires_at === null || $this->share_expires_at->isFuture());
    }
}
