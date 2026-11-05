<?php

namespace Database\Seeders\Support;

use ZipArchive;

class DemoFileFactory
{
    public static function create(string $absolutePath, string $extension, string $title): void
    {
        $directory = dirname($absolutePath);

        if (! is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        match (strtolower($extension)) {
            'pdf' => self::createPdf($absolutePath, $title),
            'png' => self::createImage($absolutePath, $title, 'png'),
            'jpg', 'jpeg' => self::createImage($absolutePath, $title, 'jpg'),
            'docx' => self::createDocx($absolutePath, $title),
            'zip' => self::createZip($absolutePath, $title),
            'csv' => self::createCsv($absolutePath, $title),
            default => file_put_contents($absolutePath, self::textContent($title)),
        };
    }

    private static function createPdf(string $path, string $title): void
    {
        $heading = self::escapePdfText(str_replace(['_', '-'], ' ', pathinfo($title, PATHINFO_FILENAME)));
        $body = self::escapePdfText('Encrypted document stored in E-Drive Cloud');
        $stream = "BT /F1 24 Tf 64 728 Td ({$heading}) Tj ET\n"
            ."0.15 0.39 0.92 rg 64 700 468 3 re f\n"
            ."BT /F1 11 Tf 64 676 Td ({$body}) Tj ET\n"
            ."BT /F1 11 Tf 64 652 Td (AES-256-GCM  |  Zero-knowledge vault  |  e-drive.cloud) Tj ET\n";

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}endstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $number = $index + 1;
            $pdf .= "{$number} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        $pdf .= 'trailer << /Size '.(count($objects) + 1).' /Root 1 0 R >>'."\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        file_put_contents($path, $pdf);
    }

    private static function createImage(string $path, string $title, string $format): void
    {
        $width = 900;
        $height = 1200;
        $image = imagecreatetruecolor($width, $height);

        for ($y = 0; $y < $height; $y++) {
            $ratio = $y / $height;
            $color = imagecolorallocate(
                $image,
                (int) (15 + (37 - 15) * $ratio),
                (int) (27 + (99 - 27) * $ratio),
                (int) (61 + (235 - 61) * $ratio),
            );
            imageline($image, 0, $y, $width, $y, $color);
        }

        $white = imagecolorallocate($image, 255, 255, 255);
        $light = imagecolorallocate($image, 219, 234, 254);
        imagefilledrectangle($image, 64, 64, $width - 64, $height - 64, imagecolorallocate($image, 248, 250, 252));

        $font = 'C:\Windows\Fonts\arialbd.ttf';
        $label = str_replace(['_', '-'], ' ', pathinfo($title, PATHINFO_FILENAME));
        $lines = explode(' ', $label);
        $chunks = array_chunk($lines, 3);

        $y = 220;

        foreach (array_slice($chunks, 0, 3) as $chunk) {
            $text = implode(' ', $chunk);

            if (is_file($font)) {
                imagettftext($image, 34, 0, 110, $y, $white, $font, $text);
            } else {
                imagestring($image, 5, 110, $y, $text, $white);
            }

            $y += 64;
        }

        if (is_file($font)) {
            imagettftext($image, 18, 0, 110, $height - 170, imagecolorallocate($image, 37, 99, 235), $font, 'E-DRIVE CLOUD');
            imagettftext($image, 14, 0, 110, $height - 130, imagecolorallocate($image, 100, 116, 139), $font, 'Encrypted document preview');
        } else {
            imagestring($image, 4, 110, $height - 170, 'E-DRIVE CLOUD', $light);
        }

        $format === 'png' ? imagepng($image, $path) : imagejpeg($image, $path, 90);
        imagedestroy($image);
    }

    private static function createDocx(string $path, string $title): void
    {
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            .'</Types>');

        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            .'</Relationships>');

        $escaped = htmlspecialchars(str_replace(['_', '-'], ' ', pathinfo($title, PATHINFO_FILENAME)), ENT_XML1);
        $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
            .'<w:p><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>'.$escaped.'</w:t></w:r></w:p>'
            .'<w:p><w:r><w:t>Encrypted document stored in E-Drive Cloud.</w:t></w:r></w:p>'
            .'</w:body></w:document>');

        $zip->close();
    }

    private static function createZip(string $path, string $title): void
    {
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('README.txt', self::textContent($title));
        $zip->addFromString('manifest.json', json_encode([
            'document' => $title,
            'vault' => 'E-Drive Cloud',
            'encryption' => 'AES-256-GCM',
        ], JSON_PRETTY_PRINT));
        $zip->close();
    }

    private static function createCsv(string $path, string $title): void
    {
        file_put_contents($path, "Document,Category,Status\n\"{$title}\",Archive,Encrypted\n");
    }

    private static function textContent(string $title): string
    {
        return "E-DRIVE CLOUD ENCRYPTED VAULT\n"
            ."Document: {$title}\n"
            ."Encryption: AES-256-GCM\n"
            ."This is a demonstration document generated for the E-Drive Cloud sample vault.\n";
    }

    private static function escapePdfText(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }
}
