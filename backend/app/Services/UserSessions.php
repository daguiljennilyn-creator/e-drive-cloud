<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserSessions
{
    /**
     * Remove persisted sessions belonging to the user.
     *
     * The array/file session drivers cannot be queried per user, so this is a
     * no-op outside of the database driver (which the application uses).
     */
    public function forgetAllFor(User $user, ?string $exceptId = null): int
    {
        if (config('session.driver') !== 'database') {
            return 0;
        }

        $query = DB::table(config('session.table', 'sessions'))
            ->where('user_id', $user->getKey());

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->delete();
    }
}
