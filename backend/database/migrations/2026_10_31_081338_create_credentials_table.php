<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->default('password');
            $table->string('identifier')->nullable();
            $table->text('secret')->nullable();
            $table->string('url')->nullable();
            $table->text('notes')->nullable();
            $table->string('health')->default('strong');
            $table->boolean('two_factor_enabled')->default(false);
            $table->boolean('is_favorite')->default(false);
            $table->timestamp('last_rotated_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credentials');
    }
};
