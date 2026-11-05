<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSecuritySettingsRequest extends FormRequest
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
            'two_factor_enabled' => ['sometimes', 'boolean'],
            'biometric_enabled' => ['sometimes', 'boolean'],
            'auto_lock_enabled' => ['sometimes', 'boolean'],
            'auto_lock_minutes' => ['sometimes', 'integer', 'min:1', 'max:60'],
            'login_alerts_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
