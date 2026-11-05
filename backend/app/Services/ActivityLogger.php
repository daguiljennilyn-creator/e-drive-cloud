<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;

class ActivityLogger
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public static function record(
        User $user,
        string $action,
        string $description,
        ?Document $document = null,
        array $metadata = [],
        ?Request $request = null,
    ): Activity {
        return Activity::create([
            'user_id' => $user->id,
            'document_id' => $document?->id,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
        ]);
    }
}
