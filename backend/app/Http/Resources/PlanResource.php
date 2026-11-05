<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price_cents' => $this->price_cents,
            'price' => number_format($this->price_cents / 100, 2),
            'billing_period' => $this->billing_period,
            'storage_bytes' => $this->storage_bytes,
            'storage_label' => $this->storageLabel(),
            'features' => $this->features ?? [],
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
        ];
    }
}
