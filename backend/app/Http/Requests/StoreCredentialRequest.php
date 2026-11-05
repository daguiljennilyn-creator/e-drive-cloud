<?php

namespace App\Http\Requests;

use App\Models\Credential;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'type' => ['required', Rule::in(Credential::TYPES)],
            'identifier' => ['nullable', 'string', 'max:180'],
            'secret' => ['nullable', 'string', 'max:2000'],
            'url' => ['nullable', 'url', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'health' => ['sometimes', Rule::in(['strong', 'fair', 'weak'])],
            'two_factor_enabled' => ['sometimes', 'boolean'],
            'is_favorite' => ['sometimes', 'boolean'],
            'last_rotated_at' => ['sometimes', 'nullable', 'date'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
