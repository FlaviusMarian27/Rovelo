package ro.rovelo.backend.health;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/health — verifică că serverul rulează și că ajunge la PostgreSQL.
 * Îl folosim ca să testăm legătura laptop ↔ telefon înainte de auth.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        String db;
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            db = "up";
        } catch (Exception e) {
            db = "down";
        }
        return Map.of("status", "ok", "db", db);
    }
}
