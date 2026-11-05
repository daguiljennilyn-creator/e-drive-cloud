<?php

namespace App\Http\Requests;

use App\Models\Credential;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('credential'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'type' => ['sometimes', 'required', Rule::in(Credential::TYPES)],
            'identifier' => ['sometimes', 'nullable', 'string', 'max:180'],
            'secret' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'health' => ['sometimes', Rule::in(['strong', 'fair', 'weak'])],
            'two_factor_enabled' => ['sometimes', 'boolean'],
            'is_favorite' => ['sometimes', 'boolean'],
            'last_rotated_at' => ['sometimes', 'nullable', 'date'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
