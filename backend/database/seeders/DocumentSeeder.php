<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\User;
use Database\Seeders\Support\DemoFileFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', config('edrive.demo_user.email'))->firstOrFail();

        Document::where('user_id', $user->id)->forceDelete();
        Storage::disk('local')->deleteDirectory('documents/'.$user->id);

        foreach ($this->documents() as $index => $row) {
            [$name, $category, $subcategory, $status, $sizeKb, $issuer, $issuedAt, $expiresAt, $tags, $modifiedDaysAgo, $description] = $row;

            $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            $filePath = 'documents/'.$user->id.'/'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).'-'.Str::slug(pathinfo($name, PATHINFO_FILENAME)).'.'.$extension;

            DemoFileFactory::create(Storage::disk('local')->path($filePath), $extension, $name);

            $modifiedAt = now()->subDays($modifiedDaysAgo);
            $createdAt = now()->subDays($modifiedDaysAgo + 45);

            $document = $user->documents()->create([
                'name' => $name,
                'original_name' => $name,
                'file_path' => $filePath,
                'mime_type' => $this->mimeType($extension),
                'extension' => $extension,
                'size' => $sizeKb * 1024,
                'category' => $category,
                'subcategory' => $subcategory,
                'description' => $description,
                'tags' => $tags,
                'status' => $status,
                'issued_at' => $issuedAt,
                'expires_at' => $expiresAt,
                'last_modified_at' => $modifiedAt,
                'checksum' => hash_file('sha256', Storage::disk('local')->path($filePath)),
                'issuer' => $issuer,
                'document_number' => $this->documentNumber($category, $index),
                'is_favorite' => in_array($index, [0, 6, 15], true),
                'verified_at' => $status === 'verified' ? now()->subDays($modifiedDaysAgo) : null,
            ]);

            if ($status === 'shared') {
                $document->forceFill([
                    'share_token' => Str::random(48),
                    'shared_at' => now()->subDays(2),
                    'share_expires_at' => now()->addDays(5),
                ])->save();
            }

            $document->timestamps = false;
            $document->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $modifiedAt,
            ])->save();
        }
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    private function documents(): array
    {
        return [
            ['US_Passport_Card.pdf', 'government_id', null, 'verified', 1229, 'U.S. Department of State', '2024-10-18', '2034-10-18', ['identity', 'travel', 'passport'], 9, 'Official US passport card with biometric page and global travel validity.'],
            ['California_Driver_License.pdf', 'government_id', null, 'expired', 1126, 'California DMV', '2022-08-20', '2026-08-20', ['identity', 'driving', 'renewal'], 18, 'California REAL ID driver license scan. Renewal is due.'],
            ['Social_Security_Card.pdf', 'government_id', null, 'active', 420, 'Social Security Administration', '2016-03-12', null, ['identity', 'tax', 'sensitive'], 64, 'Original social security card kept in the identity vault.'],
            ['Birth_Certificate.pdf', 'government_id', null, 'verified', 980, 'County of San Francisco', '1992-06-04', null, ['identity', 'vital-record'], 120, 'Certified copy of birth certificate with county seal.'],
            ['Global_Entry_Card.jpg', 'government_id', null, 'active', 2458, 'U.S. Customs and Border Protection', '2024-02-11', '2029-02-11', ['identity', 'travel'], 40, 'Global Entry membership card and trusted traveler number.'],
            ['State_ID_Card.png', 'government_id', null, 'active', 760, 'California DMV', '2023-05-07', '2027-05-07', ['identity'], 88, 'Backup state identification card.'],

            ['Stanford_University_Degree.pdf', 'certificate', null, 'verified', 4301, 'Stanford University', '2019-06-15', null, ['education', 'degree', 'stanford'], 210, 'Bachelor of Science degree with cryptographic seal.'],
            ['AWS_Solutions_Architect.pdf', 'certificate', null, 'verified', 840, 'Amazon Web Services', '2023-01-18', '2027-01-18', ['cloud', 'aws', 'professional'], 48, 'AWS Solutions Architect Professional certification.'],
            ['Google_Cloud_Professional.pdf', 'certificate', null, 'verified', 920, 'Google Cloud', '2023-03-22', '2027-03-22', ['cloud', 'google', 'professional'], 48, 'Google Cloud Professional Cloud Architect certification.'],
            ['PMP_Certification.pdf', 'certificate', null, 'verified', 1100, 'Project Management Institute', '2022-11-15', '2026-11-15', ['project-management', 'pmp'], 30, 'Project Management Professional credential nearing renewal.'],
            ['IELTS_Academic.pdf', 'certificate', null, 'verified', 780, 'British Council', '2022-09-10', '2027-09-10', ['language', 'ielts'], 180, 'IELTS Academic test report form.'],
            ['First_Aid_CPR.pdf', 'certificate', null, 'expired', 640, 'American Red Cross', '2024-09-01', '2026-09-01', ['health', 'safety'], 60, 'First aid and CPR certification. Refresh required.'],
            ['ISO_27001_Lead_Implementer.pdf', 'certificate', null, 'verified', 1250, 'PECB', '2024-04-19', '2027-04-19', ['security', 'iso27001'], 75, 'ISO 27001 Lead Implementer certification.'],
            ['Professional_Scrum_Master_I.pdf', 'certificate', null, 'active', 900, 'Scrum.org', '2021-12-15', '2026-12-15', ['agile', 'scrum'], 52, 'Professional Scrum Master I assessment certificate.'],
            ['Data_Privacy_Certification.pdf', 'certificate', null, 'verified', 720, 'IAPP', '2025-02-14', '2028-02-14', ['privacy', 'compliance'], 22, 'Certified Information Privacy Professional credential.'],

            ['Lease_Agreement_Apt4B.pdf', 'personal', 'home_legal', 'shared', 2150, 'Bay Property Group', '2024-03-02', '2027-03-02', ['rental', 'legal', 'home'], 5, 'Signed apartment lease with renewal terms and deposit schedule.'],
            ['Marriage_Certificate.pdf', 'personal', 'identity', 'verified', 1434, 'County of Alameda', '2021-07-24', null, ['family', 'vital-record'], 400, 'Official marriage certificate with county authentication.'],
            ['Home_Insurance_Policy.pdf', 'personal', 'home_legal', 'active', 980, 'Lemonade Insurance', '2025-01-01', '2027-01-01', ['insurance', 'home'], 95, 'Homeowners insurance policy and coverage schedule.'],
            ['Pet_Vaccination_Record.pdf', 'personal', 'medical', 'active', 540, 'Bay Area Veterinary Clinic', '2025-06-10', '2026-12-10', ['pets', 'vaccination'], 70, 'Vaccination history for the family dog.'],
            ['Travel_Itinerary_Japan_2026.pdf', 'personal', null, 'active', 620, 'All Nippon Airways', '2026-09-01', '2026-11-20', ['travel', 'japan'], 12, 'Flight, hotel and rail itinerary for the Japan trip.'],
            ['Utility_Bill_September_2026.pdf', 'personal', 'finance', 'active', 480, 'Pacific Gas & Electric', '2026-09-01', '2026-10-15', ['utilities', 'bills'], 27, 'September utility statement for proof of address.'],
            ['Apartment_Inventory_Photos.jpg', 'personal', 'home_legal', 'active', 12500, 'Northstar Property', '2026-02-01', null, ['photos', 'inventory', 'home'], 150, 'Move-in inventory photos for the apartment.'],
            ['Family_Photo_Archive_2025.zip', 'personal', null, 'active', 2097152, null, '2025-12-31', null, ['photos', 'archive', 'family'], 210, 'Encrypted archive of family photos from 2025.'],
            ['Tax_Documents_Archive_2022_2025.zip', 'personal', 'finance', 'active', 921600, null, '2025-04-15', null, ['tax', 'archive'], 320, 'Archive of tax working papers and receipts from 2022 to 2025.'],
            ['Passport_Photo.png', 'personal', 'identity', 'active', 3400, null, '2024-10-01', null, ['identity', 'photo'], 200, 'Passport photo used for the renewal application.'],

            ['Stanford_Transcript.pdf', 'school', null, 'verified', 2200, 'Stanford University', '2019-06-20', null, ['education', 'transcript'], 300, 'Official Stanford transcript with degree conferral.'],
            ['High_School_Diploma.pdf', 'school', null, 'verified', 1800, 'Lowell High School', '2015-06-12', null, ['education', 'diploma'], 500, 'High school diploma with honors.'],
            ['SAT_Score_Report.pdf', 'school', null, 'active', 450, 'College Board', '2014-11-08', null, ['education', 'testing'], 600, 'SAT score report from the College Board.'],
            ['Student_ID_Card.png', 'school', null, 'active', 890, 'Stanford University', '2015-09-01', '2019-06-30', ['education', 'id'], 700, 'Archived student identification card.'],

            ['Employment_Contract_Google.pdf', 'employment', null, 'verified', 3200, 'Google LLC', '2024-02-01', null, ['work', 'contract'], 80, 'Signed employment contract and compensation schedule.'],
            ['Offer_Letter_2024.pdf', 'employment', null, 'active', 1200, 'Google LLC', '2024-01-08', null, ['work', 'offer'], 81, 'Offer letter for the Director of Operations role.'],
            ['NDA_Agreement.pdf', 'employment', null, 'verified', 980, 'Google LLC', '2024-02-01', '2029-02-01', ['work', 'legal', 'nda'], 80, 'Mutual non-disclosure agreement.'],
            ['Payroll_Benefits_Summary.pdf', 'employment', null, 'active', 1400, 'Google LLC', '2026-01-05', '2026-12-31', ['work', 'benefits'], 45, 'Annual payroll and benefits summary.'],

            ['Tax_Return_2025.pdf', 'financial', null, 'verified', 6200, 'Internal Revenue Service', '2026-04-12', null, ['tax', 'irs'], 100, 'Filed 2025 federal income tax return.'],
            ['Bank_Statement_September_2026.pdf', 'financial', null, 'active', 880, 'First Republic Bank', '2026-09-30', null, ['banking', 'statement'], 25, 'September checking account statement.'],
            ['Investment_Portfolio_Summary.pdf', 'financial', null, 'active', 2400, 'Fidelity Investments', '2026-09-30', null, ['investments', 'portfolio'], 25, 'Quarterly investment portfolio summary.'],
            ['W2_Form_2025.pdf', 'financial', null, 'verified', 760, 'Google LLC', '2026-01-31', null, ['tax', 'w2'], 120, '2025 W-2 wage and tax statement.'],
            ['1099_Form_2025.pdf', 'financial', null, 'active', 690, 'Fidelity Investments', '2026-01-31', null, ['tax', '1099'], 120, '2025 consolidated 1099 tax form.'],

            ['Health_Insurance_Policy.pdf', 'health', null, 'active', 3174, 'Blue Shield of California', '2026-01-01', '2026-12-31', ['health', 'insurance'], 65, '2026 health insurance policy and member details.'],
            ['Vaccination_Record.png', 'health', null, 'verified', 1126, 'Kaiser Permanente', '2025-08-14', null, ['health', 'vaccination'], 140, 'Immunization record with verified vaccination dates.'],

            ['Vault_Recovery_Key_Backup.txt', 'other', null, 'active', 12, 'E-Drive Cloud', '2024-01-01', null, ['security', 'recovery'], 210, 'Offline recovery key instructions. Keep this file private.'],
            ['Secure_Notes_Archive.zip', 'other', null, 'active', 409600, null, '2026-06-30', null, ['notes', 'archive'], 90, 'Encrypted archive of personal notes and checklists.'],
        ];
    }

    private function mimeType(string $extension): string
    {
        return match ($extension) {
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'csv' => 'text/csv',
            'zip' => 'application/zip',
            default => 'text/plain',
        };
    }

    private function documentNumber(string $category, int $index): string
    {
        if (! in_array($category, ['government_id', 'certificate', 'financial'], true)) {
            return 'ED-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);
        }

        return strtoupper(substr($category, 0, 2)).'-'.now()->format('Y').'-'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);
    }
}
