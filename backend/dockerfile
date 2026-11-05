   FROM php:8.4-cli
   RUN apt-get update && apt-get install -y git unzip && rm -rf /var/lib/apt/lists/*
   ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
   RUN chmod +x /usr/local/bin/install-php-extensions && install-php-extensions pdo_pgsql pdo_mysql bcmath zip gd intl
   COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
   WORKDIR /app
   COPY . .
   RUN composer install --no-dev --optimize-autoloader --no-interaction
   RUN chmod -R 775 storage bootstrap/cache
   EXPOSE 10000
   CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}