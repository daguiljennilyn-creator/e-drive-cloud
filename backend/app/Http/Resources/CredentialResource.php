<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CredentialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $types = [
            'password' => 'Password',
            'passkey' => 'Passkey',
            'ssh_key' => 'SSH key',
            'api_key' => 'API key',
            'other' => 'Other',
        ];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'type_label' => $types[$this->type] ?? 'Other',
            'identifier' => $this->identifier,
            'masked_identifier' => $this->maskIdentifier(),
            'has_secret' => $this->secret !== null && $this->secret !== '',
            'url' => $this->url,
            'notes' => $this->notes,
            'health' => $this->health,
            'two_factor_enabled' => $this->two_factor_enabled,
            'is_favorite' => $this->is_favorite,
            'last_rotated_at' => $this->last_rotated_at?->toIso8601String(),
            'last_rotated_human' => $this->last_rotated_at?->diffForHumans(),
            'expires_at' => $this->expires_at?->format('Y-m-d'),
            'is_expired' => $this->expires_at !== null && $this->expires_at->isPast(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function maskIdentifier(): ?string
    {
        if (! $this->identifier) {
            return null;
        }

        $identifier = $this->identifier;

        if (str_contains($identifier, '@')) {
            [$local, $domain] = explode('@', $identifier, 2);

            return mb_substr($local, 0, 2).str_repeat('•', max(3, mb_strlen($local) - 2)).'@'.$domain;
        }

        if (mb_strlen($identifier) <= 6) {
            return mb_substr($identifier, 0, 2).'••••';
        }

        return mb_substr($identifier, 0, 4).str_repeat('•', max(4, mb_strlen($identifier) - 4));
    }
}
