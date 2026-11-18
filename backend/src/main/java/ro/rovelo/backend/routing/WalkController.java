package ro.rovelo.backend.routing;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import ro.rovelo.backend.planner.PlannerDtos.Coord;

/**
 * POST /api/routes/walk
 *   { "points": [{latitude, longitude}, ...] }   (opririle, în ordinea de mers)
 *   → { "legs": [{meters, walkMinutes}], "path": [coord...], "waypoints": [coord...] }
 * Aplicația îl cheamă de fiecare dată când se schimbă opririle (generare, reordonare, Add to route).
 * Merge și fără cont (guest).
 */
@RestController
public class WalkController {

    public record WalkRequest(@NotNull @Size(min = 2, max = 30) List<@NotNull @Valid Coord> points) {}

    private final WalkingRouter router;

    public WalkController(WalkingRouter router) {
        this.router = router;
    }

    @PostMapping("/api/routes/walk")
    public WalkingRouter.Walk walk(@Valid @RequestBody WalkRequest req) {
        return router.walk(req.points());
    }
}
