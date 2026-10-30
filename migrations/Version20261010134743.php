<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261010134743 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create weight_entry table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE weight_entry (
        id INT AUTO_INCREMENT PRIMARY KEY,
        weight DECIMAL(5,2) NOT NULL,
        measured_at DATE NOT NULL
    ) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE weight_entry');
    }
}
