<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CredentialController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ShareController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::get('/csrf-cookie', fn () => response()->noContent());
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/demo-login', [AuthController::class, 'demoLogin'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
});

Route::get('/share/{token}', [ShareController::class, 'show'])->name('share.show');
Route::get('/share/{token}/file', [ShareController::class, 'file'])->name('share.file');
Route::get('/share/{token}/download', [ShareController::class, 'download'])->name('share.download');

Route::middleware('auth')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', DashboardController::class);

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::post('/documents/bulk', [DocumentController::class, 'bulk']);
    Route::post('/documents/verify-all', [DocumentController::class, 'verifyAll']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);
    Route::match(['put', 'post'], '/documents/{document}', [DocumentController::class, 'update']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);
    Route::patch('/documents/{document}/favorite', [DocumentController::class, 'toggleFavorite']);
    Route::get('/documents/{document}/file', [DocumentController::class, 'file'])->name('documents.file');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::post('/documents/{document}/share', [DocumentController::class, 'share']);
    Route::delete('/documents/{document}/share', [DocumentController::class, 'unshare']);
    Route::post('/documents/{document}/verify', [DocumentController::class, 'verify']);
    Route::post('/documents/{document}/restore', [DocumentController::class, 'restore'])
        ->withTrashed()
        ->name('documents.restore');
    Route::delete('/documents/{document}/force', [DocumentController::class, 'forceDelete'])
        ->withTrashed()
        ->name('documents.force-delete');
    Route::delete('/trash/empty', [DocumentController::class, 'emptyTrash']);

    Route::get('/activity', [ActivityController::class, 'index']);

    Route::get('/credentials', [CredentialController::class, 'index']);
    Route::post('/credentials', [CredentialController::class, 'store']);
    Route::post('/credentials/import', [CredentialController::class, 'import']);
    Route::get('/credentials/{credential}', [CredentialController::class, 'show']);
    Route::put('/credentials/{credential}', [CredentialController::class, 'update']);
    Route::delete('/credentials/{credential}', [CredentialController::class, 'destroy']);
    Route::get('/credentials/{credential}/reveal', [CredentialController::class, 'reveal']);
    Route::post('/credentials/{credential}/rotate', [CredentialController::class, 'rotate']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/read', [NotificationController::class, 'clearRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::match(['put', 'post'], '/profile', [ProfileController::class, 'update']);
    Route::post('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('/profile/export', [ProfileController::class, 'export']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings/security', [SettingsController::class, 'updateSecurity']);
    Route::put('/settings/notifications', [SettingsController::class, 'updateNotifications']);
    Route::put('/settings/privacy', [SettingsController::class, 'updatePrivacy']);
    Route::get('/devices', [SettingsController::class, 'devices']);
    Route::delete('/devices/{device}', [SettingsController::class, 'revokeDevice']);
    Route::delete('/devices', [SettingsController::class, 'revokeOtherDevices']);

    Route::get('/plans', [PlanController::class, 'index']);
    Route::post('/plans/upgrade', [PlanController::class, 'upgrade']);
});
