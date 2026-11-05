<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationSettingsRequest;
use App\Http\Requests\UpdatePrivacySettingsRequest;
use App\Http\Requests\UpdateSecuritySettingsRequest;
use App\Http\Resources\DeviceResource;
use App\Http\Resources\PlanResource;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Services\ActivityLogger;
use App\Services\UserSessions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('plan');

        return response()->json([
            'user' => UserResource::make($user),
            'devices_count' => $user->devices()->count(),
            'plans' => PlanResource::collection(
                Plan::where('is_active', true)->orderBy('sort_order')->get()
            )->resolve(),
        ]);
    }

    public function updateSecurity(UpdateSecuritySettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        ActivityLogger::record($user, 'security_updated', 'Updated vault security settings', null, [], $request);

        return response()->json([
            'message' => 'Security settings saved.',
            'user' => UserResource::make($user->fresh()->load('plan')),
        ]);
    }

    public function updateNotifications(UpdateNotificationSettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $preferences = array_merge($user->notificationPreferences(), $request->validated());
        $user->update(['notification_preferences' => $preferences]);

        ActivityLogger::record($user, 'notifications_updated', 'Updated notification preferences', null, [], $request);

        return response()->json([
            'message' => 'Notification preferences saved.',
            'notification_preferences' => $user->fresh()->notificationPreferences(),
        ]);
    }

    public function updatePrivacy(UpdatePrivacySettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $preferences = array_merge($user->privacyPreferences(), $request->validated());
        $user->update(['privacy_preferences' => $preferences]);

        ActivityLogger::record($user, 'privacy_updated', 'Updated privacy preferences', null, [], $request);

        return response()->json([
            'message' => 'Privacy preferences saved.',
            'privacy_preferences' => $user->fresh()->privacyPreferences(),
        ]);
    }

    public function devices(Request $request): JsonResponse
    {
        $devices = $request->user()->devices()
            ->orderByDesc('is_current')
            ->orderByDesc('last_active_at')
            ->get();

        return response()->json([
            'devices' => DeviceResource::collection($devices)->resolve(),
        ]);
    }

    public function revokeDevice(Request $request, int $device): JsonResponse
    {
        $record = $request->user()->devices()->findOrFail($device);

        if ($record->is_current) {
            return response()->json([
                'message' => 'You cannot revoke the device you are currently using.',
            ], 422);
        }

        $record->delete();
        app(UserSessions::class)->forgetAllFor($request->user(), $request->session()->getId());
        ActivityLogger::record($request->user(), 'device_revoked', 'Revoked access for '.$record->name, null, [], $request);

        return response()->json(['message' => 'Device access revoked.']);
    }

    public function revokeOtherDevices(Request $request): JsonResponse
    {
        $count = $request->user()->devices()->where('is_current', false)->delete();
        app(UserSessions::class)->forgetAllFor($request->user(), $request->session()->getId());
        ActivityLogger::record($request->user(), 'devices_revoked', 'Signed out '.$count.' other device(s)', null, [], $request);

        return response()->json([
            'message' => $count.' other device(s) signed out.',
            'count' => $count,
        ]);
    }
}
