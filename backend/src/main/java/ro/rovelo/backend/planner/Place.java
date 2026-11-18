package ro.rovelo.backend.planner;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Un loc din OpenStreetMap, importat o dată în baza noastră (vezi PlaceImporter).
 * Generarea de rute caută aici, nu pe serverele publice Overpass.
 */
@Entity
@Table(name = "places", indexes = @Index(name = "places_lat_lon", columnList = "lat, lon"))
public class Place {

    /** "osm:node/123", "osm:way/456", "osm:relation/789" */
    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    /** PoiKind.id(): "cafe", "museum"… */
    @Column(nullable = false, length = 20)
    private String kind;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lon;

    /** Cât de interesant e locul, fără distanță (vezi PlannerService.baseScore). */
    @Column(nullable = false)
    private double baseScore;

    /** Pentru poveștile de mai târziu (Wikipedia / agentul AI). */
    @Column(length = 20)
    private String wikidata;

    @Column(length = 200)
    private String wikipedia;

    protected Place() {}

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getKind() {
        return kind;
    }

    public double getLat() {
        return lat;
    }

    public double getLon() {
        return lon;
    }

    public double getBaseScore() {
        return baseScore;
    }

    public String getWikidata() {
        return wikidata;
    }

    public String getWikipedia() {
        return wikipedia;
    }
}
