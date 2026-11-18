package ro.rovelo.backend.planner;

import java.util.Map;
import java.util.Set;

/**
 * Ce fel de loc e un punct din OpenStreetMap și cât stai, în medie, la el.
 * Numele (cafe, museum…) ajung în aplicație, care le traduce.
 */
public enum PoiKind {
    CAFE(20),
    MUSEUM(30),
    GALLERY(25),
    PARK(25),
    GARDEN(20),
    CHURCH(15),
    CASTLE(20),
    THEATRE(10),
    MONUMENT(10),
    MEMORIAL(5),
    ARTWORK(5),
    ATTRACTION(15),
    HISTORIC(10);

    public final int visitMinutes;

    PoiKind(int visitMinutes) {
        this.visitMinutes = visitMinutes;
    }

    /** Ce tipuri de locuri se potrivesc fiecărui interes din aplicație. */
    static final Map<String, Set<PoiKind>> BY_INTEREST = Map.of(
            "architecture", Set.of(CHURCH, CASTLE, THEATRE, ATTRACTION, HISTORIC),
            "history", Set.of(MUSEUM, MONUMENT, MEMORIAL, CASTLE, HISTORIC, CHURCH),
            "coffee", Set.of(CAFE),
            "parks", Set.of(PARK, GARDEN),
            "art", Set.of(GALLERY, ARTWORK, THEATRE, MUSEUM));

    /** Clasifică după tag-urile OSM; null = nu ne interesează. Ordinea contează (cel mai specific primul). */
    static PoiKind classify(Map<String, String> tags) {
        String amenity = tags.getOrDefault("amenity", "");
        String tourism = tags.getOrDefault("tourism", "");
        String historic = tags.getOrDefault("historic", "");
        String leisure = tags.getOrDefault("leisure", "");
        String building = tags.getOrDefault("building", "");

        if (amenity.equals("cafe")) return CAFE;
        if (tourism.equals("museum")) return MUSEUM;
        if (tourism.equals("gallery") || amenity.equals("arts_centre")) return GALLERY;
        if (leisure.equals("park")) return PARK;
        if (leisure.equals("garden")) return GARDEN;
        if (historic.equals("castle") || historic.equals("fort") || historic.equals("palace")
                || building.equals("castle") || building.equals("palace")) return CASTLE;
        if (amenity.equals("place_of_worship") || building.equals("cathedral")
                || building.equals("church") || building.equals("chapel")) return CHURCH;
        if (amenity.equals("theatre")) return THEATRE;
        if (historic.equals("monument")) return MONUMENT;
        if (historic.equals("memorial")) return MEMORIAL;
        if (tourism.equals("artwork")) return ARTWORK;
        if (tourism.equals("attraction")) return ATTRACTION;
        if (!historic.isEmpty() && !historic.equals("no")) return HISTORIC;
        return null;
    }

    /** Numele care pleacă spre aplicație: "cafe", "museum"… */
    public String id() {
        return name().toLowerCase();
    }
}
