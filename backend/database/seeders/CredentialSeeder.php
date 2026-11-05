<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class CredentialSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', config('edrive.demo_user.email'))->firstOrFail();
        $user->credentials()->delete();

        $credentials = [
            ['Google Workspace', 'passkey', 'sarah.j@northstarlabs.com', null, 'https://workspace.google.com', 'strong', true, 12, ['daily', 'work']],
            ['Corporate VPN', 'password', 'sjenkins', 'Vpn!2026#North', 'https://vpn.northstarlabs.com', 'fair', true, 52, ['work', 'network']],
            ['GitHub', 'ssh_key', 'ed25519 •••• 9F2A', '-----BEGIN OPENSSH PRIVATE KEY-----demo-key-----END OPENSSH PRIVATE KEY-----', 'https://github.com', 'strong', true, 90, ['development']],
            ['AWS Console', 'api_key', 'AKIA••••••••7Q2M', 'aws-demo-secret-access-key', 'https://console.aws.amazon.com', 'strong', true, 20, ['cloud', 'work']],
            ['Banking Portal', 'password', 'sarah.jenkins', 'Bank!Secure2026', 'https://firstrepublic.com', 'strong', true, 8, ['finance']],
            ['Company Email', 'passkey', 'sarah.j@northstarlabs.com', null, 'https://mail.northstarlabs.com', 'strong', true, 5, ['work', 'email']],
            ['Dropbox', 'password', 'sarah.j@example.com', 'Dropbox!Archive#4', 'https://dropbox.com', 'fair', false, 62, ['archive']],
            ['Figma', 'password', 'sarah.j@example.com', 'Design!Vault2026', 'https://figma.com', 'strong', false, 30, ['design']],
            ['Notion', 'passkey', 'sarah.j@northstarlabs.com', null, 'https://notion.so', 'strong', true, 15, ['work']],
            ['Slack', 'password', 'sarah.j@northstarlabs.com', 'Slack!Ops#2026', 'https://slack.com', 'strong', true, 40, ['work', 'communication']],
            ['Adobe Creative Cloud', 'password', 'sarah.j@example.com', 'Adobe!OldPass1', 'https://adobe.com', 'weak', false, 75, ['design']],
            ['Stripe Dashboard', 'api_key', 'rk_live_••••••••4F9X', 'sk_live_demo_restricted_key', 'https://dashboard.stripe.com', 'strong', true, 10, ['finance', 'payments']],
            ['Home Router', 'password', 'admin', 'admin1234', 'http://192.168.1.1', 'weak', false, 210, ['home', 'network']],
            ['Health Portal', 'password', 'sarah.jenkins', 'Health!Portal26', 'https://blueshieldca.com', 'fair', true, 95, ['health']],
            ['Personal Email', 'passkey', 'sarah.j@example.com', null, 'https://mail.google.com', 'strong', true, 3, ['email', 'personal']],
        ];

        foreach ($credentials as [$name, $type, $identifier, $secret, $url, $health, $twoFactor, $rotatedDaysAgo, $tags]) {
            $user->credentials()->create([
                'name' => $name,
                'type' => $type,
                'identifier' => $identifier,
                'secret' => $secret,
                'url' => $url,
                'notes' => 'Tags: '.implode(', ', $tags),
                'health' => $health,
                'two_factor_enabled' => $twoFactor,
                'is_favorite' => in_array($name, ['Google Workspace', 'Banking Portal', 'Company Email'], true),
                'last_rotated_at' => now()->subDays($rotatedDaysAgo),
                'expires_at' => in_array($health, ['weak', 'fair'], true) ? now()->addDays(30 - $rotatedDaysAgo % 20)->format('Y-m-d') : null,
            ]);
        }
    }
}
