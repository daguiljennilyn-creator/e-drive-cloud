<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('document'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'sometimes',
                'file',
                'max:'.config('edrive.uploads.max_kilobytes'),
                'mimes:'.implode(',', config('edrive.uploads.extensions')),
            ],
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:180'],
            'category' => ['sometimes', 'required', Rule::in(Document::CATEGORIES)],
            'subcategory' => ['sometimes', 'nullable', Rule::in(['identity', 'medical', 'finance', 'home_legal'])],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'tags' => ['sometimes', 'nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:30'],
            'status' => ['sometimes', Rule::in(Document::STATUSES)],
            'issued_at' => ['sometimes', 'nullable', 'date'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
            'issuer' => ['sometimes', 'nullable', 'string', 'max:120'],
            'document_number' => ['sometimes', 'nullable', 'string', 'max:120'],
            'is_favorite' => ['sometimes', 'boolean'],
        ];
    }
}
