package ro.rovelo.backend.route;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonRawValue;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ro.rovelo.backend.user.UserRepository;

/**
 * Rutele salvate ale utilizatorului logat.
 *   GET    /api/routes        → lista, cele mai noi primele
 *   POST   /api/routes        → body = ruta (JSON-ul din aplicație) → { id, savedAt, route }
 *   DELETE /api/routes/{id}   → șterge (doar dacă e a ta)
 */
@RestController
@RequestMapping("/api/routes")
public class SavedRouteController {

    private static final int MAX_ROUTE_CHARS = 200_000; // o rută normală are câțiva KB

    /** "route" iese exact ca JSON-ul salvat, nu ca text între ghilimele. */
    public record SavedRouteResponse(UUID id, Instant savedAt, @JsonRawValue String route) {
        static SavedRouteResponse from(SavedRoute r) {
            return new SavedRouteResponse(r.getId(), r.getSavedAt(), r.getRouteJson());
        }
    }

    private final SavedRouteRepository routes;
    private final UserRepository users;

    public SavedRouteController(SavedRouteRepository routes, UserRepository users) {
        this.routes = routes;
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SavedRouteResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return routes.findByUserIdOrderBySavedAtDesc(userId(jwt)).stream()
                .map(SavedRouteResponse::from)
                .toList();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SavedRouteResponse save(@AuthenticationPrincipal Jwt jwt, @RequestBody String routeJson) {
        String json = routeJson == null ? "" : routeJson.trim();
        if (!json.startsWith("{") || !json.endsWith("}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The route must be a JSON object.");
        }
        if (json.length() > MAX_ROUTE_CHARS) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "This route is too large.");
        }
        UUID uid = userId(jwt);
        if (!users.existsById(uid)) {
            // token valid, dar contul a fost între timp șters
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found.");
        }
        var user = users.getReferenceById(uid);
        return SavedRouteResponse.from(routes.save(new SavedRoute(user, json)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        SavedRoute route = routes.findByIdAndUserId(id, userId(jwt))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found."));
        routes.delete(route);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
