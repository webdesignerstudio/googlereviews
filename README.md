# Google Reviews Pakket

Herbruikbaar, veilig Google Reviews systeem voor PHP websites. Laadt reviews via een server-side proxy met caching, zodat je API key nooit client-side zichtbaar is.

## Kenmerken

- 🔒 **Veilig** — API key alleen server-side, nooit in de browser
- ⏱ **Efficiënt** — 1 API call per week dankzij caching
- 🎨 **Herbruikbaar** — generieke CSS met custom properties, makkelijk aan te passen
- 📱 **Responsive** — grid layout past zich aan op alle schermen
- 🌐 **Google Places API v1** — gebruikt de nieuwste API versie

## Installatie

### 1. Bestanden kopiëren

Kopieer deze bestanden naar de **webroot** van je website:

```
google-reviews.php
google-reviews.js
google-reviews.css
```

### 2. Configuratiebestand aanmaken

Maak een bestand `google-reviews-config.php` aan **buiten de webroot** (bijv. één map hoger dan `public_html/`):

```php
<?php
return [
    'api_key'  => 'JOU_GOOGLE_PLACES_API_KEY',
    'place_id' => 'JOU_GOOGLE_PLACE_ID',
];
```

> **Waar vind je deze gegevens?**
> - **API key**: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API Key
> - **Place ID**: [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)

### 3. Cache map aanmaken

Maak in de webroot een map `cache/` aan met schrijfrechten:

```bash
mkdir cache
chmod 755 cache
```

### 4. HTML toevoegen

#### Volledige weergave (homepage)

```html
<section class="gr-sectie-wrapper">
    <div class="gr-score-header">
        <div class="gr-score-getal" data-reviews-score></div>
        <div class="gr-score-info">
            <div class="gr-sterren" data-reviews-sterren></div>
            <div data-reviews-totaal></div>
            <a href="#" target="_blank" class="gr-google-link" data-reviews-link>
                Bekijk alle reviews op Google
            </a>
        </div>
    </div>
    <div class="gr-grid" data-reviews="volledig" data-reviews-limit="5"></div>
</section>
```

#### Compacte weergave (contactpagina)

```html
<div class="gr-compact-wrapper" style="display:none;">
    <div class="gr-compact-header">
        <div class="gr-compact-score" data-reviews-score></div>
        <div class="gr-compact-meta">
            <div class="gr-sterren" data-reviews-sterren></div>
            <div data-reviews-totaal></div>
        </div>
    </div>
    <div data-reviews="compact"></div>
</div>
```

### 5. CSS en JS laden

```html
<link rel="stylesheet" href="google-reviews.css">
<script src="google-reviews.js"></script>
```

## Aanpassen aan je huisstijl

Het pakket gebruikt CSS custom properties. Pas de `:root` variabelen aan in je eigen stylesheet:

```css
:root {
    --gr-primary:       #003366;  /* Jouw merk-kleur */
    --gr-primary-hover: #E31E24;
    --gr-bg-section:    #f3f4f6;
    --gr-font-heading:  'Noto Serif', serif;
}
```

## Beveiliging

- Het configuratiebestand staat **buiten de webroot** en is niet via de browser te benaderen
- De cache map bevat geen gevoelige gegevens, alleen publieke review data
- Zet `.htaccess` in de cache map als extra beveiliging (al toegepast in dit pakket)

## Licentie

MIT — vrij te gebruiken voor commerciële en persoonlijke projecten.
