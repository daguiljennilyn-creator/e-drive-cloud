<?php

return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    'uploads' => [
        'max_kilobytes' => 25600,
        'extensions' => [
            'pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx',
        ],
        'mime_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
    ],

    'share_expiry_days' => 7,

    'demo_user' => [
        'email' => 'sarah.j@example.com',
        'password' => 'Password123!',
    ],
];
