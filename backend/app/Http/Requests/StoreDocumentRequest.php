<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:'.config('edrive.uploads.max_kilobytes'),
                'mimes:'.implode(',', config('edrive.uploads.extensions')),
            ],
            'name' => ['required', 'string', 'min:2', 'max:180'],
            'category' => ['required', Rule::in(Document::CATEGORIES)],
            'subcategory' => ['nullable', Rule::in(['identity', 'medical', 'finance', 'home_legal'])],
            'description' => ['nullable', 'string', 'max:2000'],
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:30'],
            'status' => ['sometimes', Rule::in(['active', 'verified', 'draft'])],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'issuer' => ['nullable', 'string', 'max:120'],
            'document_number' => ['nullable', 'string', 'max:120'],
        ];
    }
}
