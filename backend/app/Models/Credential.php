<?php

namespace App\Models;

use Database\Factories\CredentialFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Credential extends Model
{
    /** @use HasFactory<CredentialFactory> */
    use HasFactory;

    public const TYPES = ['password', 'passkey', 'ssh_key', 'api_key', 'other'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'identifier',
        'secret',
        'url',
        'notes',
        'health',
        'two_factor_enabled',
        'is_favorite',
        'last_rotated_at',
        'expires_at',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = ['secret'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'secret' => 'encrypted',
            'two_factor_enabled' => 'boolean',
            'is_favorite' => 'boolean',
            'last_rotated_at' => 'datetime',
            'expires_at' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
