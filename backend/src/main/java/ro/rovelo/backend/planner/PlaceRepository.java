package ro.rovelo.backend.planner;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceRepository extends JpaRepository<Place, String> {

    /** Locurile de anumite tipuri dintr-un dreptunghi în jurul startului (indexul lat, lon). */
    List<Place> findByLatBetweenAndLonBetweenAndKindIn(
            double minLat, double maxLat, double minLon, double maxLon, Collection<String> kinds);

    /** Toate locurile dintr-un dreptunghi (Explore fără filtru). */
    List<Place> findByLatBetweenAndLonBetween(double minLat, double maxLat, double minLon, double maxLon);

    /** Căutare după nume (searchName e deja fără diacritice și cu litere mici). */
    List<Place> findTop60BySearchNameContainingAndLatBetweenAndLonBetween(
            String query, double minLat, double maxLat, double minLon, double maxLon);

    /** Avem date importate pentru zona asta? Dacă nu, întrebăm Overpass. */
    boolean existsByLatBetweenAndLonBetween(double minLat, double maxLat, double minLon, double maxLon);
}
