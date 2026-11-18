package ro.rovelo.backend.planner;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ro.rovelo.backend.planner.PlannerDtos.Coord;
import ro.rovelo.backend.planner.PlannerDtos.PlanRequest;
import ro.rovelo.backend.planner.PlannerDtos.PlanResponse;
import ro.rovelo.backend.planner.PlannerDtos.PlannedStop;

/**
 * Planifică o plimbare din locuri reale (OpenStreetMap), fără AI:
 *   1. caută în jurul startului locurile potrivite intereselor: în tabela `places`
 *      (importată din OSM), iar dacă zona nu e importată, pe serverele Overpass;
 *   2. le dă un scor (cât de cunoscute sunt, cât de aproape);
 *   3. le alege pe cele mai bune care încap în timpul ales;
 *   4. le pune într-o ordine de mers scurtă (cel mai apropiat vecin + 2-opt).
 * Mersul se estimează la fel ca în aplicație: linie dreaptă × 1.3, 75 m/min.
 */
@Service
public class PlannerService {

    private static final double STREET_FACTOR = 1.3;
    private static final double WALK_M_PER_MIN = 75;
    private static final double MIN_GAP_M = 80; // două opriri nu pot fi lipite una de alta

    /** Câte locuri de același fel, maxim, într-o rută. */
    private static final Map<PoiKind, Integer> MAX_PER_KIND = new EnumMap<>(Map.of(
            PoiKind.CAFE, 1,
            PoiKind.PARK, 2,
            PoiKind.GARDEN, 1,
            PoiKind.MEMORIAL, 1,
            PoiKind.ARTWORK, 2,
            PoiKind.CHURCH, 3));

    private record Poi(String id, String name, PoiKind kind, double lat, double lon, double score) {}

    private final PlaceRepository places;
    private final OverpassClient overpass;

    public PlannerService(PlaceRepository places, OverpassClient overpass) {
        this.places = places;
        this.overpass = overpass;
    }

    public PlanResponse plan(PlanRequest req) {
        int budget = req.minutes();
        Set<String> interests = new LinkedHashSet<>(req.interests());
        Set<PoiKind> wanted = kindsFor(interests);
        Coord start = req.start();

        // Cât de departe căutăm: cu cât ai mai mult timp, cu atât mai larg.
        int radius = switch (budget) {
            case 60 -> 700;
            case 120 -> 1100;
            default -> 1500;
        };

        List<Poi> candidates = fromDatabase(start, radius, wanted);
        if (candidates == null) {
            candidates = candidates(overpass.query(query(interests, start, radius)), wanted, start);
        }
        List<Poi> chosen = select(candidates, start, budget, maxStops(budget));
        if (chosen.size() < 2) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_CONTENT, "Not enough interesting places nearby.");
        }

        List<Poi> ordered = order(chosen, start);
        List<PlannedStop> stops = ordered.stream()
                .map(p -> new PlannedStop(p.id(), p.name(), p.kind().id(), new Coord(p.lat(), p.lon()),
                        p.kind().visitMinutes))
                .toList();
        return new PlanResponse(stops, totalMinutes(ordered, start));
    }

    // ---- 1. Căutarea ----

    /** Din tabela `places`. null = zona nu e importată deloc (atunci încercăm Overpass). */
    private List<Poi> fromDatabase(Coord start, int radius, Set<PoiKind> wanted) {
        double dLat = radius / 111_320.0;
        double dLon = radius / (111_320.0 * Math.cos(Math.toRadians(start.latitude())));
        double minLat = start.latitude() - dLat, maxLat = start.latitude() + dLat;
        double minLon = start.longitude() - dLon, maxLon = start.longitude() + dLon;
        if (!places.existsByLatBetweenAndLonBetween(minLat, maxLat, minLon, maxLon)) return null;

        List<String> kinds = wanted.stream().map(PoiKind::id).toList();
        List<Poi> pois = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();
        for (Place p : places.findByLatBetweenAndLonBetweenAndKindIn(minLat, maxLat, minLon, maxLon, kinds)) {
            double meters = distance(start.latitude(), start.longitude(), p.getLat(), p.getLon());
            if (meters > radius || !seenNames.add(normalize(p.getName()))) continue;
            PoiKind kind = PoiKind.valueOf(p.getKind().toUpperCase(Locale.ROOT));
            pois.add(new Poi(p.getId(), p.getName(), kind, p.getLat(), p.getLon(),
                    withDistance(p.getBaseScore(), meters)));
        }
        pois.sort(Comparator.comparingDouble(Poi::score).reversed());
        return pois;
    }

    private static Set<PoiKind> kindsFor(Set<String> interests) {
        Set<PoiKind> kinds = new HashSet<>();
        interests.forEach(i -> kinds.addAll(PoiKind.BY_INTEREST.getOrDefault(i, Set.of())));
        return kinds;
    }

    /** Overpass QL: toate locurile cu nume, de tipurile cerute, într-un cerc în jurul startului. */
    static String query(Set<String> interests, Coord start, int radius) {
        String around = String.format(Locale.ROOT, "(around:%d,%.3f,%.3f)", radius, start.latitude(), start.longitude());
        Set<String> filters = new LinkedHashSet<>();
        for (String interest : interests) {
            switch (interest) {
                case "architecture" -> {
                    filters.add("[\"amenity\"=\"place_of_worship\"]");
                    filters.add("[\"building\"~\"^(cathedral|church|palace|castle)$\"]");
                    filters.add("[\"historic\"~\"^(building|castle|palace|manor|church)$\"]");
                    filters.add("[\"tourism\"=\"attraction\"]");
                    filters.add("[\"amenity\"=\"theatre\"]");
                }
                case "history" -> {
                    filters.add("[\"historic\"]");
                    filters.add("[\"tourism\"=\"museum\"]");
                }
                case "coffee" -> filters.add("[\"amenity\"=\"cafe\"]");
                case "parks" -> filters.add("[\"leisure\"~\"^(park|garden)$\"]");
                case "art" -> {
                    filters.add("[\"tourism\"~\"^(gallery|artwork|museum)$\"]");
                    filters.add("[\"amenity\"~\"^(arts_centre|theatre)$\"]");
                }
                default -> { }
            }
        }
        StringBuilder q = new StringBuilder("[out:json][timeout:25];(");
        filters.forEach(f -> q.append("nwr").append(f).append("[\"name\"]").append(around).append(';'));
        return q.append(");out center tags 500;").toString();
    }

    private static List<Poi> candidates(List<OverpassClient.Element> elements, Set<PoiKind> wanted, Coord start) {
        List<Poi> pois = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();
        for (var e : elements) {
            Map<String, String> tags = e.tags();
            Double lat = e.latitude(), lon = e.longitude();
            if (tags == null || lat == null || lon == null) continue;
            String name = tags.get("name");
            PoiKind kind = PoiKind.classify(tags);
            if (name == null || kind == null || !wanted.contains(kind)) continue;
            // Același loc apare uneori de două ori (nod + clădire): păstrăm primul
            if (!seenNames.add(normalize(name))) continue;
            double meters = distance(start.latitude(), start.longitude(), lat, lon);
            pois.add(new Poi("osm:" + e.type() + "/" + e.id(), name, kind, lat, lon,
                    withDistance(baseScore(tags, kind), meters)));
        }
        pois.sort(Comparator.comparingDouble(Poi::score).reversed());
        return pois;
    }

    // ---- 2. Scorul ----

    /** Cât de interesant e un loc în sine (se salvează și la import). Mai sus = mai interesant. */
    public static double baseScore(Map<String, String> tags, PoiKind kind) {
        double s = 10;
        if (tags.containsKey("wikidata") || tags.containsKey("wikipedia")) s += 6; // loc cunoscut
        if ("attraction".equals(tags.get("tourism"))) s += 3;
        if (tags.containsKey("heritage")) s += 2;
        if (tags.containsKey("website") || tags.containsKey("opening_hours")) s += 1;
        if (kind == PoiKind.MEMORIAL || kind == PoiKind.ARTWORK) s -= 3; // plăcuțe, statui mici
        return s;
    }

    /** Cu cât e mai departe de start, cu atât mai puțin. Puțin aleator, ca două "Generate" să difere. */
    private static double withDistance(double base, double meters) {
        return base - meters / 250 + ThreadLocalRandom.current().nextDouble(0, 2.5);
    }

    // ---- 3. Alegerea ----

    private static int maxStops(int budget) {
        return budget / 60 * 3 + 2; // 1h → 5, 2h → 8, 3h → 11
    }

    private static List<Poi> select(List<Poi> candidates, Coord start, int budget, int maxStops) {
        List<Poi> chosen = new ArrayList<>();
        Map<PoiKind, Integer> perKind = new EnumMap<>(PoiKind.class);
        for (Poi p : candidates) {
            if (chosen.size() >= maxStops) break;
            if (perKind.getOrDefault(p.kind(), 0) >= MAX_PER_KIND.getOrDefault(p.kind(), 4)) continue;
            if (chosen.stream().anyMatch(c -> distance(c.lat(), c.lon(), p.lat(), p.lon()) < MIN_GAP_M)) continue;

            List<Poi> tentative = new ArrayList<>(chosen);
            tentative.add(p);
            if (totalMinutes(order(tentative, start), start) > budget) continue;

            chosen.add(p);
            perKind.merge(p.kind(), 1, Integer::sum);
        }
        return chosen;
    }

    // ---- 4. Ordinea de mers ----

    /** Cel mai apropiat vecin pornind de la start, apoi 2-opt (desface "nodurile" din traseu). */
    static List<Poi> order(List<Poi> pois, Coord start) {
        List<Poi> left = new ArrayList<>(pois);
        List<Poi> route = new ArrayList<>();
        double lat = start.latitude(), lon = start.longitude();
        while (!left.isEmpty()) {
            final double fLat = lat, fLon = lon;
            Poi next = Collections.min(left,
                    Comparator.comparingDouble((Poi p) -> distance(fLat, fLon, p.lat(), p.lon())));
            route.add(next);
            left.remove(next);
            lat = next.lat();
            lon = next.lon();
        }

        boolean improved = true;
        while (improved) {
            improved = false;
            for (int i = 0; i < route.size() - 1; i++) {
                for (int j = i + 1; j < route.size(); j++) {
                    List<Poi> candidate = new ArrayList<>(route);
                    Collections.reverse(candidate.subList(i, j + 1));
                    if (walkMeters(candidate, start) + 1 < walkMeters(route, start)) {
                        route = candidate;
                        improved = true;
                    }
                }
            }
        }
        return route;
    }

    // ---- Calcule ----

    private static double walkMeters(List<Poi> route, Coord start) {
        double total = 0, lat = start.latitude(), lon = start.longitude();
        for (Poi p : route) {
            total += distance(lat, lon, p.lat(), p.lon()) * STREET_FACTOR;
            lat = p.lat();
            lon = p.lon();
        }
        return total;
    }

    /** Mersul (inclusiv de la start la prima oprire) + timpul petrecut la fiecare oprire. */
    private static int totalMinutes(List<Poi> route, Coord start) {
        int visit = route.stream().mapToInt(p -> p.kind().visitMinutes).sum();
        return (int) Math.round(walkMeters(route, start) / WALK_M_PER_MIN) + visit;
    }

    /** Distanța în linie dreaptă (haversine), în metri. */
    static double distance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1), dLon = Math.toRadians(lon2 - lon1);
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
    }

    private static String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }
}
