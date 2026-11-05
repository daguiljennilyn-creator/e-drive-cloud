<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'price_cents',
        'billing_period',
        'storage_bytes',
        'features',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'storage_bytes' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function storageLabel(): string
    {
        $gb = $this->storage_bytes / 1073741824;

        if ($gb >= 1024) {
            return rtrim(rtrim(number_format($gb / 1024, 1), '0'), '.').' TB';
        }

        return rtrim(rtrim(number_format($gb, 1), '0'), '.').' GB';
    }
}
