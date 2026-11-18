package ro.rovelo.backend.planner;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Ce primește și ce trimite POST /api/routes/generate. */
public final class PlannerDtos {

    private PlannerDtos() {}

    public record Coord(
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude) {}

    public record PlanRequest(
            @NotNull @Valid Coord start,
            @NotNull @Pattern(regexp = "1h|2h|3h\\+") String duration,
            @NotEmpty List<@Pattern(regexp = "architecture|history|coffee|parks|art") String> interests) {

        int minutes() {
            return switch (duration) {
                case "1h" -> 60;
                case "2h" -> 120;
                default -> 180;
            };
        }
    }

    /** id = "osm:node/123" etc., ca să găsim locul înapoi mai târziu (povestea lui, salvarea). */
    public record PlannedStop(String id, String name, String kind, Coord coord, int visitMinutes) {}

    /** Opririle în ordinea propusă. Aplicația calculează mersul dintre ele și le poate reordona. */
    public record PlanResponse(List<PlannedStop> stops, int totalMinutes) {}
}
