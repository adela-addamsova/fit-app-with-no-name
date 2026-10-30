<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\WeightEntryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DashboardController extends AbstractController
{
    #[Route('/', name: 'app_dashboard')]
    public function index(WeightEntryRepository $weightEntries): Response
    {
        [$latestWeight, $previousWeight] = $weightEntries->findLatest(2) + [null, null];

        return $this->render('dashboard/index.html.twig', [
            'latest_weight' => $latestWeight,
            'previous_weight' => $previousWeight,
        ]);
    }
}
