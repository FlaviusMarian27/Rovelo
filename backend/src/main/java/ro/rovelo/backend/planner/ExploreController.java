package ro.rovelo.backend.planner;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ro.rovelo.backend.planner.PlannerDtos.Coord;
import ro.rovelo.backend.planner.PlannerDtos.PlannedStop;

/**
 * Locurile din jur, pentru tab-ul Explore (din tabela `places`). Merge și fără cont.
 *   GET /api/explore?lat=45.75&lon=21.22&radius=1500             → cele mai interesante din zonă
 *   GET /api/explore?lat=…&lon=…&kinds=cafe,restaurant           → doar anumite tipuri
 *   GET /api/explore?lat=…&lon=…&q=catedrala                     → căutare după nume (fără diacritice)
 *   &limit=120 → câte locuri, maxim (aplicația cere mai puține când harta e micșorată)
 */
@RestController
public class ExploreController {

    private static final int MAX_RADIUS = 5_000;
    private static final int SEARCH_RADIUS = 15_000; // căutarea merge în tot orașul
    private static final int MAX_RESULTS = 300;

    private final PlaceRepository places;

    public ExploreController(PlaceRepository places) {
        this.places = places;
    }

    @GetMapping("/api/explore")
    public List<PlannedStop> explore(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "1500") int radius,
            @RequestParam(required = false) String kinds,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "300") int limit) {
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid coordinates.");
        }

        // Căutare după nume: cele mai apropiate potriviri
        if (q != null && q.trim().length() >= 2) {
            double[] box = box(lat, lon, SEARCH_RADIUS);
            return places.findTop60BySearchNameContainingAndLatBetweenAndLonBetween(
                            PlannerService.normalize(q), box[0], box[1], box[2], box[3])
                    .stream()
                    .sorted(Comparator.comparingDouble(p -> PlannerService.distance(lat, lon, p.getLat(), p.getLon())))
                    .limit(30)
                    .map(ExploreController::toDto)
                    .toList();
        }

        int r = Math.max(100, Math.min(radius, MAX_RADIUS));
        double[] box = box(lat, lon, r);
        Set<String> wanted = parseKinds(kinds);
        List<Place> found = wanted.isEmpty()
                ? places.findByLatBetweenAndLonBetween(box[0], box[1], box[2], box[3])
                : places.findByLatBetweenAndLonBetweenAndKindIn(box[0], box[1], box[2], box[3], wanted);
        // Pe hartă încap doar câteva sute de pini: păstrăm cele mai interesante
        return found.stream()
                .sorted(Comparator.comparingDouble(Place::getBaseScore).reversed())
                .limit(Math.max(20, Math.min(limit, MAX_RESULTS)))
                .map(ExploreController::toDto)
                .toList();
    }

    private static Set<String> parseKinds(String kinds) {
        if (kinds == null || kinds.isBlank()) return Set.of();
        Set<String> known = Arrays.stream(PoiKind.values()).map(PoiKind::id).collect(Collectors.toSet());
        return Arrays.stream(kinds.split(","))
                .map(k -> k.trim().toLowerCase(Locale.ROOT))
                .filter(known::contains)
                .collect(Collectors.toSet());
    }

    /** [minLat, maxLat, minLon, maxLon] al unui pătrat cu latura 2 × meters. */
    private static double[] box(double lat, double lon, int meters) {
        double dLat = meters / 111_320.0;
        double dLon = meters / (111_320.0 * Math.cos(Math.toRadians(lat)));
        return new double[] {lat - dLat, lat + dLat, lon - dLon, lon + dLon};
    }

    private static PlannedStop toDto(Place p) {
        PoiKind kind = PoiKind.valueOf(p.getKind().toUpperCase(Locale.ROOT));
        return new PlannedStop(p.getId(), p.getName(), p.getKind(), new Coord(p.getLat(), p.getLon()), kind.visitMinutes);
    }
}
