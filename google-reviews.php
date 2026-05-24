<?php
/**
 * Google Reviews Proxy
 * --------------------
 * Server-side proxy voor Google Places API (v1) met caching.
 * Plaats dit bestand in de webroot van je website.
 *
 * Vereisten:
 *   - PHP 7.4+
 *   - Schrijfrechten op de cache-directory
 *   - google-reviews-config.php buiten de webroot met API key en Place ID
 *
 * Installatie:
 *   1. Kopieer dit bestand + google-reviews.js + google-reviews.css naar je website
 *   2. Maak een cache/ map aan naast dit bestand (chmod 755)
 *   3. Maak google-reviews-config.php aan BUITEN de webroot
 *   4. Roep dit bestand aan vanuit je frontend: fetch('google-reviews.php')
 */

// ============================================================================
// CONFIGURATIE (pas aan indien nodig)
// ============================================================================

// Pad naar het configuratiebestand met API key en Place ID.
// Standaard: één map hoger dan de webroot (buiten publieke toegang).
$config_pad = dirname(__DIR__) . '/google-reviews-config.php';

// Fallback: ook in dezelfde map zoeken (voor lokale ontwikkeling)
if (!file_exists($config_pad)) {
    $config_pad = __DIR__ . '/google-reviews-config.php';
}

// Cache instellingen
$cache_dir    = __DIR__ . '/cache';
$cache_bestand = $cache_dir . '/reviews_cache.json';
$cache_tijd   = 604800; // 1 week (60 * 60 * 24 * 7)

// Aantal reviews dat opgehaald wordt (maximaal 5)
$max_reviews  = 5;

// Minimale beoordeling (4 of 5 sterren)
$min_rating   = 4;

// Taalcode voor Google Places API
$taal         = 'nl';

// ============================================================================
// CONFIG INLEZEN
// ============================================================================

$config = file_exists($config_pad) ? include $config_pad : null;

if (!$config || empty($config['api_key']) || empty($config['place_id'])) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Configuratie niet gevonden of onvolledig.',
        'pad'   => $config_pad
    ]);
    exit;
}

// ============================================================================
// CACHE CHECK
// ============================================================================

header('Content-Type: application/json; charset=utf-8');

if (file_exists($cache_bestand)) {
    $leeftijd = time() - filemtime($cache_bestand);
    if ($leeftijd < $cache_tijd) {
        // Cache is nog geldig — serveer direct
        echo file_get_contents($cache_bestand);
        exit;
    }
}

// ============================================================================
// GOOGLE PLACES API V1
// ============================================================================

$url = 'https://places.googleapis.com/v1/places/' . urlencode($config['place_id'])
     . '?fields=id,displayName,rating,userRatingCount,reviews'
     . '&languageCode=' . urlencode($taal);

$respons = @file_get_contents($url, false, stream_context_create([
    'http' => [
        'timeout'       => 10,
        'ignore_errors' => true,
        'header'        => "X-Goog-Api-Key: " . $config['api_key'] . "\r\n"
    ],
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false
    ]
]));

// Fallback: als de API faalt, serveer verouderde cache (indien beschikbaar)
if (!$respons) {
    if (file_exists($cache_bestand)) {
        echo file_get_contents($cache_bestand);
        exit;
    }
    http_response_code(503);
    echo json_encode(['error' => 'Google Places API niet bereikbaar']);
    exit;
}

$data = json_decode($respons, true);

if (empty($data) || isset($data['error'])) {
    // Ook hier fallback naar oude cache
    if (file_exists($cache_bestand)) {
        echo file_get_contents($cache_bestand);
        exit;
    }
    http_response_code(502);
    echo json_encode([
        'error'    => 'Ongeldig antwoord van Google Places API',
        'response' => isset($data['error']) ? $data['error'] : substr($respons, 0, 300)
    ]);
    exit;
}

// ============================================================================
// REVIEWS VERWERKEN
// ============================================================================

$reviews = [];
foreach ($data['reviews'] ?? [] as $r) {
    $rating = $r['rating'] ?? 0;
    $text   = $r['text']['text'] ?? ($r['text'] ?? '');

    if ($rating >= $min_rating && !empty($text)) {
        $reviews[] = [
            'naam'        => $r['authorAttribution']['displayName'] ?? 'Anoniem',
            'foto'        => $r['authorAttribution']['photoUri'] ?? null,
            'beoordeling' => (int) $rating,
            'tekst'       => $text,
            'datum'       => $r['relativePublishTimeDescription'] ?? ''
        ];
    }

    if (count($reviews) >= $max_reviews) {
        break;
    }
}

$output = [
    'bedrijfsnaam'   => $data['displayName']['text'] ?? 'Bedrijf',
    'gemiddeld'      => $data['rating'] ?? null,
    'totaal_reviews' => $data['userRatingCount'] ?? 0,
    'reviews'        => $reviews
];

$json = json_encode($output, JSON_UNESCAPED_UNICODE);

// ============================================================================
// CACHE OPSLAAN
// ============================================================================

if (!is_dir($cache_dir)) {
    @mkdir($cache_dir, 0755, true);
}

@file_put_contents($cache_bestand, $json, LOCK_EX);

echo $json;
