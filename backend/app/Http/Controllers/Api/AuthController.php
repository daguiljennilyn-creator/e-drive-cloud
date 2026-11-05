<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use App\Services\UserSessions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $user->forceFill(['last_active_at' => now()])->save();
        $this->touchCurrentDevice($user, $request);

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        ActivityLogger::record($user, 'login', 'Signed in to E-Drive Cloud', null, [], $request);

        return response()->json([
            'user' => UserResource::make($user->load('plan')),
        ]);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $freePlan = Plan::where('slug', 'free')->first();

        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'plan_id' => $freePlan?->id,
            'storage_limit_bytes' => $freePlan?->storage_bytes ?? 16106127360,
            'last_active_at' => now(),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        ActivityLogger::record($user, 'account_created', 'Created an E-Drive Cloud account', null, [], $request);
        Notifier::send(
            $user,
            'welcome',
            'Welcome to E-Drive Cloud',
            'Your encrypted vault is ready. Upload your first document to get started.',
            '/documents',
        );

        return response()->json([
            'user' => UserResource::make($user->load('plan')),
        ], 201);
    }

    public function demoLogin(Request $request): JsonResponse
    {
        $user = User::where('email', config('edrive.demo_user.email'))->firstOrFail();

        $user->forceFill(['last_active_at' => now()])->save();
        $this->touchCurrentDevice($user, $request);

        Auth::login($user);
        $request->session()->regenerate();

        ActivityLogger::record($user, 'login', 'Signed in with the demo account', null, [], $request);

        return response()->json([
            'user' => UserResource::make($user->load('plan')),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('plan');

        return response()->json([
            'user' => UserResource::make($user),
            'unread_notifications' => $user->unreadNotifications()->count(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        ActivityLogger::record($user, 'logout', 'Signed out of E-Drive Cloud', null, [], $request);

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'You have been signed out.']);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));
        $payload = [
            'message' => 'If an account exists for that email, a password reset link has been sent.',
            'status' => $status === Password::RESET_LINK_SENT ? 'sent' : 'accepted',
        ];

        if (app()->isLocal() && $status === Password::RESET_LINK_SENT) {
            $user = User::where('email', $request->validated('email'))->first();
            $token = $user ? Password::createToken($user) : null;

            if ($token) {
                $payload['reset_url'] = rtrim(config('edrive.frontend_url'), '/')
                    .'/reset-password?token='.$token
                    .'&email='.urlencode($user->email);
            }
        }

        return response()->json($payload);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password])->save();
                app(UserSessions::class)->forgetAllFor($user);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => 'Your password has been reset. You can sign in with your new password.',
        ]);
    }

    private function touchCurrentDevice(User $user, Request $request): void
    {
        $device = $user->devices()->where('is_current', true)->first();

        if ($device) {
            $device->update([
                'last_active_at' => now(),
                'ip_address' => $request->ip(),
            ]);
        }
    }
}
