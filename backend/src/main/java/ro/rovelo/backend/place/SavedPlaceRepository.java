package ro.rovelo.backend.place;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedPlaceRepository extends JpaRepository<SavedPlace, UUID> {

    List<SavedPlace> findByUserIdOrderBySavedAtDesc(UUID userId);

    Optional<SavedPlace> findByUserIdAndPlaceKey(UUID userId, String placeKey);
}
