<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', config('edrive.demo_user.email'))->firstOrFail();
        $user->notifications()->delete();

        $notifications = [
            ['expiry', 'Passport renewal reminder', 'Your US passport card expires in 30 days. Review the renewal checklist to stay ahead.', '/documents?expiring=1', null, 0, 15],
            ['security', 'New sign-in detected', 'A new sign-in was recorded from Office Workstation in San Jose, US.', '/settings/devices', null, 0, 120],
            ['share', 'Your secure link was viewed', 'The lease agreement share link was opened 3 times in the last 24 hours.', '/documents', null, 0, 240],
            ['storage', 'Storage at 22%', 'You have used 3.3 GB of your 15 GB Starter plan. Consider upgrading for more room.', '/settings/storage', null, 1, 3],
            ['certificate', 'Certificate verified', 'Stanford University Degree passed cryptographic seal validation.', '/certificates', '2026-10-30T09:15:00Z', 1, 6],
            ['credential', 'Weak credential detected', 'Home Router is using a weak password. Rotate it from the credentials vault.', '/credentials', '2026-10-29T14:00:00Z', 2, 4],
            ['digest', 'Your weekly vault digest', '7 documents updated, 1 certificate verified and 2 credentials rotated this week.', '/activity', '2026-10-28T08:00:00Z', 3, 2],
            ['welcome', 'Welcome to E-Drive Cloud', 'Your zero-knowledge vault is ready. Explore the quick tour to get started.', '/dashboard', '2026-10-20T10:00:00Z', 9, 5],
        ];

        foreach ($notifications as [$type, $title, $message, $url, $readAt, $daysAgo, $hoursAgo]) {
            $createdAt = now()->subDays($daysAgo)->subHours($hoursAgo);

            DB::table('notifications')->insert([
                'id' => (string) Str::uuid(),
                'type' => 'App\\Notifications\\'.Str::studly($type),
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode([
                    'type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'action_url' => $url,
                ]),
                'read_at' => $readAt ? Carbon::parse($readAt) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }
}
