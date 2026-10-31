<?php

declare(strict_types=1);

namespace App\Repository;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\ParameterType;

final class WeightEntryRepository
{
    public function __construct(private readonly Connection $db) {}

    /** Saving a day again replaces its weight. */
    public function save(string $weight, string $measuredAt): void
    {
        $this->db->executeStatement(
            'INSERT INTO weight_entry (weight, measured_at) VALUES (:weight, :measuredAt)
            ON DUPLICATE KEY UPDATE weight = VALUES(weight)',
            ['weight' => $weight, 'measuredAt' => $measuredAt]
        );
    }

    /** @return list<array{id: int, weight: string, measured_at: string}> */
    public function findAll(): array
    {
        return $this->db->fetchAllAssociative(
            'SELECT id, weight, measured_at FROM weight_entry ORDER BY measured_at'
        );
    }

    /** @return list<array{id: int, weight: string, measured_at: string}> */
    public function findLatest(int $limit): array
    {
        return $this->db->fetchAllAssociative(
            'SELECT id, weight, measured_at FROM weight_entry ORDER BY measured_at DESC LIMIT :limit',
            ['limit' => $limit],
            ['limit' => ParameterType::INTEGER]
        );
    }
}
