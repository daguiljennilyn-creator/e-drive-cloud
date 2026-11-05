<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpgradePlanRequest;
use App\Http\Resources\PlanResource;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Services\ActivityLogger;
use App\Services\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $plans = Plan::where('is_active', true)->orderBy('sort_order')->get();
        $user = $request->user()->load('plan');

        return response()->json([
            'plans' => PlanResource::collection($plans)->resolve(),
            'current_plan' => $user->plan ? PlanResource::make($user->plan)->resolve() : null,
            'storage_used_bytes' => $user->storageUsedBytes(),
            'storage_limit_bytes' => $user->storage_limit_bytes,
        ]);
    }

    public function upgrade(UpgradePlanRequest $request): JsonResponse
    {
        $user = $request->user();
        $plan = Plan::findOrFail($request->validated('plan_id'));
        $used = $user->storageUsedBytes();

        if ($plan->storage_bytes < $used) {
            throw ValidationException::withMessages([
                'plan_id' => ['This plan does not have enough storage for your current files.'],
            ]);
        }

        $user->update([
            'plan_id' => $plan->id,
            'storage_limit_bytes' => $plan->storage_bytes,
        ]);

        ActivityLogger::record(
            $user,
            'plan_changed',
            'Changed plan to '.$plan->name,
            null,
            ['plan_id' => $plan->id],
            $request,
        );

        Notifier::send(
            $user,
            'plan_changed',
            'Storage plan updated',
            'You are now on the '.$plan->name.' plan with '.$plan->storageLabel().' of storage.',
            '/settings/storage',
        );

        return response()->json([
            'message' => 'Your storage plan has been updated.',
            'user' => UserResource::make($user->fresh()->load('plan')),
            'plan' => PlanResource::make($plan),
        ]);
    }
}
