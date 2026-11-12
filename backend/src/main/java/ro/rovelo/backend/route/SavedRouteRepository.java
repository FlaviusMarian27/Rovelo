package ro.rovelo.backend.route;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedRouteRepository extends JpaRepository<SavedRoute, UUID> {

    List<SavedRoute> findByUserIdOrderBySavedAtDesc(UUID userId);

    /** Caută doar printre rutele utilizatorului → nu poți atinge rutele altcuiva. */
    Optional<SavedRoute> findByIdAndUserId(UUID id, UUID userId);
}
