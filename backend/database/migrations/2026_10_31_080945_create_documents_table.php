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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->string('extension', 16);
            $table->unsignedBigInteger('size');
            $table->string('category')->default('other')->index();
            $table->string('subcategory')->nullable();
            $table->text('description')->nullable();
            $table->json('tags')->nullable();
            $table->string('status')->default('active')->index();
            $table->date('issued_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->timestamp('last_modified_at')->nullable();
            $table->string('checksum', 64)->nullable();
            $table->string('issuer')->nullable();
            $table->string('document_number')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->string('share_token', 64)->nullable()->unique();
            $table->timestamp('share_expires_at')->nullable();
            $table->timestamp('shared_at')->nullable();
            $table->unsignedInteger('view_count')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'deleted_at']);
            $table->index(['user_id', 'last_modified_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
