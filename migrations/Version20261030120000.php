<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261030120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Allow one weight entry per day';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE weight_entry ADD UNIQUE KEY uniq_weight_entry_measured_at (measured_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE weight_entry DROP KEY uniq_weight_entry_measured_at');
    }
}
