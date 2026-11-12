package ro.rovelo.backend.place;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import com.fasterxml.jackson.annotation.JsonRawValue;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ro.rovelo.backend.user.UserRepository;

/**
 * Locurile salvate ale utilizatorului logat. Cheia e id-ul locului din aplicație, deci
 * salvarea e idempotentă: același loc salvat de două ori rămâne o singură înregistrare.
 *   GET    /api/places         → lista, cele mai noi primele
 *   PUT    /api/places/{key}   → body = locul (JSON) → { key, savedAt, place }
 *   DELETE /api/places/{key}   → scoate locul din salvate
 */
@RestController
@RequestMapping("/api/places")
public class SavedPlaceController {

    private static final Pattern KEY = Pattern.compile("[A-Za-z0-9_.:\\-]{1,100}");
    private static final int MAX_PLACE_CHARS = 50_000;

    public record SavedPlaceResponse(String key, Instant savedAt, @JsonRawValue String place) {
        static SavedPlaceResponse from(SavedPlace p) {
            return new SavedPlaceResponse(p.getPlaceKey(), p.getSavedAt(), p.getPlaceJson());
        }
    }

    private final SavedPlaceRepository places;
    private final UserRepository users;

    public SavedPlaceController(SavedPlaceRepository places, UserRepository users) {
        this.places = places;
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SavedPlaceResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return places.findByUserIdOrderBySavedAtDesc(userId(jwt)).stream()
                .map(SavedPlaceResponse::from)
                .toList();
    }

    @PutMapping(path = "/{key}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public SavedPlaceResponse save(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String key, @RequestBody String placeJson) {
        validateKey(key);
        String json = placeJson == null ? "" : placeJson.trim();
        if (!json.startsWith("{") || !json.endsWith("}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The place must be a JSON object.");
        }
        if (json.length() > MAX_PLACE_CHARS) {
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "This place is too large.");
        }
        UUID uid = userId(jwt);
        if (!users.existsById(uid)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found.");
        }
        SavedPlace place = places.findByUserIdAndPlaceKey(uid, key)
                .map(existing -> {
                    existing.setPlaceJson(json); // deja salvat → doar actualizăm datele
                    return existing;
                })
                .orElseGet(() -> places.save(new SavedPlace(users.getReferenceById(uid), key, json)));
        return SavedPlaceResponse.from(place);
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String key) {
        validateKey(key);
        places.findByUserIdAndPlaceKey(userId(jwt), key).ifPresent(places::delete);
    }

    private static void validateKey(String key) {
        if (!KEY.matcher(key).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid place key.");
        }
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
