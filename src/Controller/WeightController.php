<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\WeightEntryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

#[Route('/weight', name: 'app_weight_')]
final class WeightController extends AbstractController
{
    #[Route('', name: 'index')]
    public function index(Request $request, WeightEntryRepository $weightEntries): Response
    {
        $form = $this->createFormBuilder(['measuredAt' => new \DateTimeImmutable('today')])
            ->add('weight', NumberType::class, [
                'label' => 'Weight (kg)',
                'input' => 'string',
                'scale' => 1,
                'constraints' => [new Assert\NotBlank(), new Assert\Range(min: 1, max: 999.9, notInRangeMessage: 'Enter a weight between {{ min }} and {{ max }} kg.')],
            ])
            ->add('measuredAt', DateType::class, [
                'label' => 'Date',
                'input' => 'datetime_immutable',
                'widget' => 'single_text',
                'constraints' => [new Assert\NotBlank(), new Assert\LessThanOrEqual('today')],
            ])
            ->getForm();

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $data = $form->getData();
            $weightEntries->save($data['weight'], $data['measuredAt']->format('Y-m-d'));

            return $this->redirectToRoute('app_weight_index');
        }

        $entries = $weightEntries->findAll();

        return $this->render('weight/index.html.twig', [
            'form' => $form,
            'entries' => $entries,
            'history' => $this->groupByMonth($entries),
        ]);
    }

    /**
     * @param list<array{id: int, weight: string, measured_at: string}> $entries
     *
     * @return array<string, list<array{id: int, weight: string, measured_at: string}>>
     */
    private function groupByMonth(array $entries): array
    {
        $history = [];
        foreach (array_reverse($entries) as $entry) {
            $month = (new \DateTimeImmutable($entry['measured_at']))->format('F Y');
            $history[$month][] = $entry;
        }

        return $history;
    }
}
