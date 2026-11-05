<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $labels = [
            'government_id' => 'Government ID',
            'certificate' => 'Certificate',
            'personal' => 'Personal',
            'school' => 'School Documents',
            'employment' => 'Employment',
            'financial' => 'Financial',
            'health' => 'Health',
            'credential' => 'Credential',
            'other' => 'Other',
        ];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'original_name' => $this->original_name,
            'extension' => $this->extension,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'human_size' => $this->humanSize(),
            'category' => $this->category,
            'category_label' => $labels[$this->category] ?? 'Other',
            'subcategory' => $this->subcategory,
            'description' => $this->description,
            'tags' => $this->tags ?? [],
            'status' => $this->status,
            'issued_at' => $this->issued_at?->format('Y-m-d'),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->format('Y-m-d'),
            'is_expired' => $this->isExpired(),
            'last_modified_at' => $this->last_modified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'checksum' => $this->checksum,
            'issuer' => $this->issuer,
            'document_number' => $this->document_number,
            'is_favorite' => $this->is_favorite,
            'is_shared' => $this->isShared(),
            'share_url' => $this->isShared()
                ? rtrim(config('edrive.frontend_url'), '/').'/share/'.$this->share_token
                : null,
            'shared_at' => $this->shared_at?->toIso8601String(),
            'share_expires_at' => $this->share_expires_at?->toIso8601String(),
            'view_count' => $this->view_count,
            'last_accessed_at' => $this->last_accessed_at?->toIso8601String(),
            'preview_url' => route('documents.file', ['document' => $this->id]),
            'download_url' => route('documents.download', ['document' => $this->id]),
            'file_exists' => $this->file_path ? Storage::disk('local')->exists($this->file_path) : false,
        ];
    }

    private function humanSize(): string
    {
        $bytes = (int) $this->size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 1).' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 0).' KB';
        }

        return $bytes.' B';
    }
}
