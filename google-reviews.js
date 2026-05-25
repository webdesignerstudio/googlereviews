/**
 * Google Reviews Frontend
 * -----------------------
 * Standalone JavaScript voor het laden en renderen van Google Reviews.
 * Geen afhankelijkheden. Werkt in alle moderne browsers.
 *
 * Installatie:
 *   1. Laad dit bestand in je HTML: <script src="google-reviews.js"></script>
 *   2. Plaats een container met data-reviews="volledig" of data-reviews="compact"
 *   3. Roep googleReviews.init() aan na DOMContentLoaded
 */

(function(window, document) {
    'use strict';

    // ====================================================================
    // CONFIGURATIE
    // ====================================================================

    var CONFIG = {
        endpoint: 'google-reviews.php', // Pad naar de PHP proxy
        defaultLimit: 3                  // Standaard aantal reviews (eerste keer)
    };

    // ====================================================================
    // HELPER FUNCTIES
    // ====================================================================

    function sterrenHtml(beoordeling) {
        var html = '<span class="gr-sterren-lijst">';
        for (var i = 1; i <= 5; i++) {
            var kleur = i <= beoordeling ? '#FBBF24' : '#D1D5DB';
            html += '<svg width="16" height="16" viewBox="0 0 20 20" fill="' + kleur + '" style="display:inline-block;vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        }
        html += '</span>';
        return html;
    }

    function initiaalAvatar(naam) {
        var initiaal = (naam || '?').charAt(0).toUpperCase();
        var kleuren = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#d97706'];
        var kleur = kleuren[initiaal.charCodeAt(0) % kleuren.length];
        return '<div class="gr-avatar-initiaal" style="background:' + kleur + '">' + initiaal + '</div>';
    }

    // ====================================================================
    // REVIEW KAART HTML
    // ====================================================================

    function reviewKaartHtml(review) {
        var avatarHtml = review.foto
            ? '<img src="' + review.foto + '" alt="' + review.naam + '" class="gr-avatar-img" loading="lazy" onerror="this.style.display=\'none\'">'
            : initiaalAvatar(review.naam);

        var tekst = review.tekst.length > 180
            ? review.tekst.substring(0, 180) + '…'
            : review.tekst;

        return '<div class="gr-kaart">'
            + '<div class="gr-kaart-top">'
            + '<div class="gr-avatar">' + avatarHtml + '</div>'
            + '<div class="gr-auteur">'
            + '<div class="gr-naam">' + review.naam + '</div>'
            + '<div class="gr-datum">' + review.datum + '</div>'
            + '</div>'
            + '</div>'
            + '<div class="gr-sterren">' + sterrenHtml(review.beoordeling) + '</div>'
            + '<p class="gr-tekst">' + tekst + '</p>'
            + '</div>';
    }

    function compacteReviewHtml(review) {
        var tekst = review.tekst.length > 120 ? review.tekst.substring(0, 120) + '…' : review.tekst;
        return '<div class="gr-compact-item">'
            + '<div class="gr-sterren">' + sterrenHtml(review.beoordeling) + '</div>'
            + '<p class="gr-compact-tekst">&ldquo;' + tekst + '&rdquo;</p>'
            + '<div class="gr-compact-naam">&mdash; ' + review.naam + '</div>'
            + '</div>';
    }

    // ====================================================================
    // DATA LADEN
    // ====================================================================

    function createLoadMoreButton(container, reviews, type, perLoad) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gr-load-more';
        btn.textContent = 'Meer laden';

        btn.addEventListener('click', function() {
            var current = parseInt(container.dataset.grShown, 10) || CONFIG.defaultLimit;
            var next = current + perLoad;
            var toShow = reviews.slice(current, next);
            var html = type === 'volledig'
                ? toShow.map(reviewKaartHtml).join('')
                : toShow.map(compacteReviewHtml).join('');
            container.insertAdjacentHTML('beforeend', html);
            container.dataset.grShown = String(next);
            if (next >= reviews.length) {
                btn.classList.add('gr-hidden');
            }
        });

        return btn;
    }

    function renderContainer(container, data) {
        var type = container.dataset.reviews;
        var initialLimit = parseInt(container.dataset.reviewsLimit, 10) || CONFIG.defaultLimit;
        var perLoad = parseInt(container.dataset.reviewsPerLoad, 10) || 3;
        var reviews = data.reviews;

        if (type === 'volledig') {
            var volledigWrapper = container.closest('.gr-sectie-wrapper');
            var scoreEl    = volledigWrapper ? volledigWrapper.querySelector('[data-reviews-score]') : null;
            var totaalEl   = volledigWrapper ? volledigWrapper.querySelector('[data-reviews-totaal]') : null;
            var sterrenEl  = volledigWrapper ? volledigWrapper.querySelector('[data-reviews-sterren]') : null;
            var linkEl     = volledigWrapper ? volledigWrapper.querySelector('[data-reviews-link]') : null;

            if (scoreEl)   scoreEl.textContent   = data.gemiddeld ? data.gemiddeld.toFixed(1) : '';
            if (totaalEl)  totaalEl.textContent  = data.totaal_reviews ? data.totaal_reviews + ' beoordelingen' : '';
            if (sterrenEl) sterrenEl.innerHTML   = data.gemiddeld ? sterrenHtml(Math.round(data.gemiddeld)) : '';
            if (linkEl)    linkEl.href            = data.google_url || '#';

            container.innerHTML = reviews.slice(0, initialLimit).map(reviewKaartHtml).join('');
            container.dataset.grShown = String(initialLimit);

            if (reviews.length > initialLimit) {
                var btn = createLoadMoreButton(container, reviews, 'volledig', perLoad);
                container.parentNode.insertBefore(btn, container.nextSibling);
            }

        } else if (type === 'compact') {
            var wrapper   = container.closest('.gr-compact-wrapper');
            var scoreEl   = wrapper ? wrapper.querySelector('[data-reviews-score]') : null;
            var totaalEl  = wrapper ? wrapper.querySelector('[data-reviews-totaal]') : null;
            var sterrenEl = wrapper ? wrapper.querySelector('[data-reviews-sterren]') : null;
            var linkEl    = wrapper ? wrapper.querySelector('[data-reviews-link]') : null;

            if (scoreEl)   scoreEl.textContent  = data.gemiddeld ? data.gemiddeld.toFixed(1) : '';
            if (totaalEl)  totaalEl.textContent = data.totaal_reviews ? data.totaal_reviews + ' Google reviews' : '';
            if (sterrenEl) sterrenEl.innerHTML  = data.gemiddeld ? sterrenHtml(Math.round(data.gemiddeld)) : '';
            if (linkEl)    linkEl.href           = data.google_url || '#';

            container.innerHTML = reviews.slice(0, initialLimit).map(compacteReviewHtml).join('');
            container.dataset.grShown = String(initialLimit);

            if (wrapper) wrapper.style.display = '';

            if (reviews.length > initialLimit) {
                var btnCompact = createLoadMoreButton(container, reviews, 'compact', perLoad);
                wrapper.appendChild(btnCompact);
            }
        }
    }

    function laadReviews() {
        var containers = document.querySelectorAll('[data-reviews]');
        if (containers.length === 0) return;

        fetch(CONFIG.endpoint, { cache: 'default' })
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(data) {
                if (!data.reviews || data.reviews.length === 0) {
                    containers.forEach(function(el) {
                        var w = el.closest('.gr-sectie-wrapper') || el.closest('.gr-compact-wrapper');
                        if (w) w.style.display = 'none';
                    });
                    return;
                }

                containers.forEach(function(container) {
                    renderContainer(container, data);
                });
            })
            .catch(function() {
                containers.forEach(function(el) {
                    var wrapper = el.closest('.gr-sectie-wrapper') || el.closest('.gr-compact-wrapper');
                    if (wrapper) wrapper.style.display = 'none';
                });
            });
    }

    // ====================================================================
    // PUBLIEKE API
    // ====================================================================

    window.googleReviews = {
        init: laadReviews,
        config: CONFIG
    };

    // Automatisch laden bij DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', laadReviews);
    } else {
        laadReviews();
    }

})(window, document);
