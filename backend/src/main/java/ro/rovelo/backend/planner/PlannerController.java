package ro.rovelo.backend.planner;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import ro.rovelo.backend.planner.PlannerDtos.PlanRequest;
import ro.rovelo.backend.planner.PlannerDtos.PlanResponse;

/**
 * POST /api/routes/generate
 *   { "start": {"latitude": 45.7537, "longitude": 21.2257}, "duration": "2h", "interests": ["history"] }
 *   → { "stops": [{ id, name, kind, coord, visitMinutes }, ...], "totalMinutes": 112 }
 * Merge și fără cont (guest).
 */
@RestController
public class PlannerController {

    private final PlannerService planner;

    public PlannerController(PlannerService planner) {
        this.planner = planner;
    }

    @PostMapping("/api/routes/generate")
    public PlanResponse generate(@Valid @RequestBody PlanRequest req) {
        return planner.plan(req);
    }
}
