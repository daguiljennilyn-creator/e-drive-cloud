<?php

namespace App\Policies;

use App\Models\Credential;
use App\Models\User;

class CredentialPolicy
{
    public function view(User $user, Credential $credential): bool
    {
        return $credential->user_id === $user->id;
    }

    public function update(User $user, Credential $credential): bool
    {
        return $credential->user_id === $user->id;
    }

    public function delete(User $user, Credential $credential): bool
    {
        return $credential->user_id === $user->id;
    }
}
