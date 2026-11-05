<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class Notifier
{
    /**
     * @param  array<string, mixed>  $extra
     */
    public static function send(
        User $user,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $extra = [],
    ): void {
        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\'.$type,
            'data' => array_merge([
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'action_url' => $actionUrl,
            ], $extra),
        ]);
    }
}
