<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', config('edrive.demo_user.email'))->firstOrFail();
        $user->activities()->delete();

        $documents = $user->documents()->get()->keyBy('name');

        $activities = [
            ['uploaded', 'Uploaded and verified US_Passport_Card.pdf', 'US_Passport_Card.pdf', 0, 10],
            ['shared', 'Created a secure share link for Lease_Agreement_Apt4B.pdf', 'Lease_Agreement_Apt4B.pdf', 0, 45],
            ['updated', 'Updated metadata for Tax_Return_2025.pdf', 'Tax_Return_2025.pdf', 1, 2],
            ['certificate_verified', 'Verified Stanford_University_Degree.pdf through the seal registry', 'Stanford_University_Degree.pdf', 2, 5],
            ['credential_revealed', 'Revealed the Google Workspace passkey', null, 2, 8],
            ['uploaded', 'Uploaded Bank_Statement_September_2026.pdf', 'Bank_Statement_September_2026.pdf', 3, 1],
            ['security_updated', 'Enabled biometric vault lock', null, 4, 3],
            ['trashed', 'Moved an old utility bill to trash', null, 5, 2],
            ['restored', 'Restored First_Aid_CPR.pdf from trash', 'First_Aid_CPR.pdf', 6, 4],
            ['login', 'Signed in from MacBook Pro 16"', null, 7, 6],
            ['plan_changed', 'Reviewed storage plan options', null, 12, 2],
            ['password_changed', 'Rotated the vault master password', null, 18, 5],
        ];

        foreach ($activities as [$action, $description, $documentName, $daysAgo, $hoursAgo]) {
            $document = $documentName ? $documents->get($documentName) : null;
            $activity = Activity::create([
                'user_id' => $user->id,
                'document_id' => $document?->id,
                'action' => $action,
                'description' => $description,
                'metadata' => [],
                'ip_address' => '192.168.1.24',
            ]);

            $activity->timestamps = false;
            $activity->forceFill([
                'created_at' => now()->subDays($daysAgo)->subHours($hoursAgo),
                'updated_at' => now()->subDays($daysAgo)->subHours($hoursAgo),
            ])->save();
        }
    }
}
